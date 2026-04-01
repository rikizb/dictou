import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST /api/lists/[id]/items — ajouter des mots à une liste
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });

  const list = await prisma.wordList.findUnique({ where: { id } });
  if (!list) return NextResponse.json({ error: "Liste introuvable" }, { status: 404 });
  if (list.userId !== user.id) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const body = await req.json();
  const { words } = body as { words: string[] };

  if (!words || !Array.isArray(words) || words.length === 0) {
    return NextResponse.json({ error: "Mots manquants" }, { status: 400 });
  }

  const cleaned = [...new Set(
    words
      .map((w) => w.trim().toLowerCase())
      .filter((w) => w.length > 0)
  )];

  // Récupère la position max actuelle
  const maxPositionItem = await prisma.wordListItem.findFirst({
    where: { listId: id },
    orderBy: { position: "desc" },
  });
  const startPosition = maxPositionItem ? maxPositionItem.position + 1 : 0;

  // Upsert pour dédupliquer
  const items = await Promise.all(
    cleaned.map((word, i) =>
      prisma.wordListItem.upsert({
        where: { listId_word: { listId: id, word } },
        update: {},
        create: { listId: id, word, position: startPosition + i },
      })
    )
  );

  // Met à jour updatedAt de la liste
  await prisma.wordList.update({
    where: { id },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json({ items }, { status: 201 });
}
