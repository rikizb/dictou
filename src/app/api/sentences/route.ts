import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { selectPriorityWords } from "@/lib/scoring";
import { generateDictationSentence } from "@/lib/claude";

// POST /api/sentences — génère une nouvelle phrase
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

  // Vérifie que la session appartient à cet utilisateur
  const session = await prisma.session.findFirst({
    where: { id: sessionId, userId: user.id },
  });
  if (!session) return NextResponse.json({ error: "Session non trouvée" }, { status: 404 });

  // Récupère les mots disponibles
  const allWords = await prisma.word.findMany({
    where: { userId: user.id },
  });

  if (allWords.length === 0) {
    return NextResponse.json(
      { error: "Aucun mot dans la liste. Ajoutez des mots d'abord !" },
      { status: 400 }
    );
  }

  // Sélectionne les mots prioritaires (2-3 mots cibles par phrase)
  const wordCount = Math.min(allWords.length, allWords.length >= 3 ? 3 : allWords.length);
  const priorityWords = selectPriorityWords(allWords, wordCount);
  const optionalWords = allWords
    .filter((w) => !priorityWords.find((p) => p.id === w.id))
    .slice(0, 5);

  // Génère la phrase avec Claude
  const generated = await generateDictationSentence({
    targetWords: priorityWords.map((w) => w.text),
    optionalWords: optionalWords.map((w) => w.text),
    level: level || "ce1",
  });

  // Sauvegarde la phrase en base
  const sentence = await prisma.sentence.create({
    data: {
      sessionId,
      text: generated.text,
      sentenceWords: {
        create: priorityWords.map((word) => ({
          wordId: word.id,
        })),
      },
    },
    include: {
      sentenceWords: {
        include: { word: true },
      },
    },
  });

  // Met à jour lastSeenAt pour les mots utilisés
  await prisma.word.updateMany({
    where: { id: { in: priorityWords.map((w) => w.id) } },
    data: { lastSeenAt: new Date(), timesSeenInSentence: { increment: 1 } },
  });

  // Incrémente le compteur de phrases de la session
  await prisma.session.update({
    where: { id: sessionId },
    data: { totalSentences: { increment: 1 } },
  });

  return NextResponse.json({
    sentence: {
      id: sentence.id,
      text: sentence.text,
      targetWords: sentence.sentenceWords.map((sw) => ({
        id: sw.wordId,
        text: sw.word.text,
        level: sw.word.level,
      })),
    },
  });
}
