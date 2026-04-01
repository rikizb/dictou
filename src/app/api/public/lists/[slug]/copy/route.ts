import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST /api/public/lists/[slug]/copy — s'abonner à une liste et copier ses mots
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

  // Crée ou met à jour l'abonnement
  await prisma.wordListSubscription.upsert({
    where: { userId_listId: { userId: user.id, listId: list.id } },
    update: { lastSyncedAt: new Date() },
    create: { userId: user.id, listId: list.id },
  });

  const texts = list.items
    .map(({ word }) => word.trim().toLowerCase())
    .filter(Boolean);

  // Mots déjà présents
  const existing = await prisma.word.findMany({
    where: { userId: user.id, text: { in: texts } },
    select: { text: true },
  });
  const existingSet = new Set(existing.map((w) => w.text));

  const newTexts = texts.filter((t) => !existingSet.has(t));
  const skippedCount = texts.length - newTexts.length;

  if (newTexts.length > 0) {
    await prisma.word.createMany({
      data: newTexts.map((text) => ({
        userId: user!.id,
        text,
        source: "MANUAL" as const,
        sourceListId: list.id,
        priorityScore: 100,
      })),
      skipDuplicates: true,
    });
  }

  // Incrémente copyCount de façon atomique (seulement si premier abonnement)
  await prisma.wordList.update({
    where: { slug },
    data: { copyCount: { increment: 1 } },
  });

  return NextResponse.json({ addedCount: newTexts.length, skippedCount });
}
