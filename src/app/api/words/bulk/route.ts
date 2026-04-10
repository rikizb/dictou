import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST /api/words/bulk — importe des mots en masse (depuis localStorage guest)
export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const { words: wordTexts } = body as { words: string[] };

  if (!wordTexts || !Array.isArray(wordTexts) || wordTexts.length === 0) {
    return NextResponse.json({ addedCount: 0, skippedCount: 0 });
  }

  // Récupère ou crée l'utilisateur
  let user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) {
    user = await prisma.user.create({ data: { clerkId } });
    await prisma.streak.create({ data: { userId: user.id } });
  }

  const cleaned = [...new Set(
    wordTexts
      .map((w) => w.trim().toLowerCase())
      .filter((w) => w.length > 0 && w.length <= 50)
  )];

  // Vérifie les mots déjà existants
  const existing = await prisma.word.findMany({
    where: { userId: user.id, text: { in: cleaned } },
    select: { text: true },
  });
  const existingSet = new Set(existing.map((w) => w.text));
  const newWords = cleaned.filter((w) => !existingSet.has(w));

  if (newWords.length > 0) {
    await prisma.word.createMany({
      data: newWords.map((text) => ({
        userId: user!.id,
        text,
        priorityScore: 100,
      })),
      skipDuplicates: true,
    });
  }

  return NextResponse.json({
    addedCount: newWords.length,
    skippedCount: cleaned.length - newWords.length,
  });
}
