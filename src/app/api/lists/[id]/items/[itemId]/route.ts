import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// DELETE /api/lists/[id]/items/[itemId] — supprimer un mot d'une liste
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id, itemId } = await params;

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });

  // Vérifie que la liste appartient à l'utilisateur
  const list = await prisma.wordList.findUnique({ where: { id } });
  if (!list) return NextResponse.json({ error: "Liste introuvable" }, { status: 404 });
  if (list.userId !== user.id) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  // Vérifie que l'item appartient à cette liste
  const item = await prisma.wordListItem.findFirst({
    where: { id: itemId, listId: id },
  });
  if (!item) return NextResponse.json({ error: "Mot introuvable" }, { status: 404 });

  await prisma.wordListItem.delete({ where: { id: itemId } });

  // Met à jour updatedAt de la liste
  await prisma.wordList.update({
    where: { id },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
