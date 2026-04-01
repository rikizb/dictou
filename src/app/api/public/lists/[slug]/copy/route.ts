import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST /api/public/lists/[slug]/copy — copie les mots dans le compte de l'utilisateur
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { slug } = await params;

  const list = await prisma.wordList.findUnique({
    where: { slug },
    include: { items: true },
  });

  if (!list || list.isArchived || !list.isPublic) {
    return NextResponse.json({ error: "Liste introuvable" }, { status: 404 });
  }

  let user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) {
    user = await prisma.user.create({ data: { clerkId } });
    await prisma.streak.create({ data: { userId: user.id } });
  }

  let addedCount = 0;
  let skippedCount = 0;

  // Vérifie les mots déjà présents pour compter proprement ajouts vs doublons
  const texts = list.items
    .map(({ word }) => word.trim().toLowerCase())
    .filter(Boolean);

  const existing = await prisma.word.findMany({
    where: { userId: user.id, text: { in: texts } },
    select: { text: true },
  });
  const existingSet = new Set(existing.map((w) => w.text));

  await Promise.all(
    texts.map(async (text) => {
      await prisma.word.upsert({
        where: { userId_text: { userId: user!.id, text } },
        update: {},
        create: {
          userId: user!.id,
          text,
          source: "MANUAL",
          priorityScore: 100,
        },
      });
      if (existingSet.has(text)) {
        skippedCount++;
      } else {
        addedCount++;
      }
    })
  );

  // Incrémente copyCount de façon atomique
  await prisma.wordList.update({
    where: { slug },
    data: { copyCount: { increment: 1 } },
  });

  return NextResponse.json({ addedCount, skippedCount });
}
