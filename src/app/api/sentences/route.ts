import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { selectPriorityWords } from "@/lib/scoring";
import { generateDictationSentence } from "@/lib/claude";
import { extractSignificantWords } from "@/lib/stopwords";

// POST /api/sentences — génère une nouvelle phrase et enregistre tous ses mots
export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const { sessionId, level } = body as {
    sessionId: string;
    level?: "cp" | "ce1" | "ce2" | "cm1" | "cm2";
  };

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId manquant" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });

  const session = await prisma.session.findFirst({
    where: { id: sessionId, userId: user.id },
  });
  if (!session) return NextResponse.json({ error: "Session non trouvée" }, { status: 404 });

  // Récupère les mots existants
  const allWords = await prisma.word.findMany({ where: { userId: user.id } });

  if (allWords.length === 0) {
    return NextResponse.json(
      { error: "Aucun mot dans la liste. Ajoutez des mots d'abord !" },
      { status: 400 }
    );
  }

  // Sélectionne les mots prioritaires pour guider la génération (2-3 mots)
  const wordCount = Math.min(allWords.length, 3);
  const priorityWords = selectPriorityWords(allWords, wordCount);
  const optionalWords = allWords
    .filter((w) => !priorityWords.find((p) => p.id === w.id))
    .slice(0, 4);

  // Génère la phrase avec Claude
  const generated = await generateDictationSentence({
    targetWords: priorityWords.map((w) => w.text),
    optionalWords: optionalWords.map((w) => w.text),
    level: level || "ce1",
  });

  // ─── Extraire TOUS les mots significatifs de la phrase ───
  const allSentenceWords = extractSignificantWords(generated.text);

  // Upsert tous les mots dans la liste de l'utilisateur (nouveaux = level 0)
  const wordRecords = await Promise.all(
    allSentenceWords.map((text) =>
      prisma.word.upsert({
        where: { userId_text: { userId: user.id, text } },
        update: { lastSeenAt: new Date(), timesSeenInSentence: { increment: 1 } },
        create: {
          userId: user.id,
          text,
          level: 0,
          priorityScore: 100,
          lastSeenAt: new Date(),
          timesSeenInSentence: 1,
        },
      })
    )
  );

  // Crée la phrase et lie TOUS ses mots
  const sentence = await prisma.sentence.create({
    data: {
      sessionId,
      text: generated.text,
      sentenceWords: {
        create: wordRecords.map((word) => ({ wordId: word.id })),
      },
    },
    include: {
      sentenceWords: { include: { word: true } },
    },
  });

  await prisma.session.update({
    where: { id: sessionId },
    data: { totalSentences: { increment: 1 } },
  });

  // Identifie les mots "cibles" (ceux qui étaient prioritaires avant la phrase)
  const priorityWordIds = new Set(priorityWords.map((w) => w.id));

  return NextResponse.json({
    sentence: {
      id: sentence.id,
      text: sentence.text,
      allWords: sentence.sentenceWords.map((sw) => ({
        id: sw.wordId,
        text: sw.word.text,
        level: sw.word.level,
        isTarget: priorityWordIds.has(sw.wordId),
      })),
    },
  });
}
