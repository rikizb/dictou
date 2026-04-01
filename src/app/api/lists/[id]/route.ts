import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/lists/[id] — détail d'une liste (propriétaire uniquement)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });

  const listExists = await prisma.wordList.findUnique({ where: { id } });
  if (!listExists) return NextResponse.json({ error: "Liste introuvable" }, { status: 404 });
  if (listExists.userId !== user.id) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const list = await prisma.wordList.findUnique({
    where: { id },
    include: {
      items: { orderBy: { position: "asc" } },
    },
  });

  return NextResponse.json({ list });
}

// PATCH /api/lists/[id] — renommer ou archiver
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });

  const existingListPatch = await prisma.wordList.findUnique({ where: { id } });
  if (!existingListPatch) return NextResponse.json({ error: "Liste introuvable" }, { status: 404 });
  if (existingListPatch.userId !== user.id) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const body = await req.json();
  const { name, isArchived } = body as { name?: string; isArchived?: boolean };

  const updateData: { name?: string; isArchived?: boolean } = {};

  if (name !== undefined) {
    if (typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Nom invalide" }, { status: 400 });
    }
    if (name.trim().length > 60) {
      return NextResponse.json({ error: "Le nom ne peut pas dépasser 60 caractères" }, { status: 400 });
    }
    updateData.name = name.trim();
  }

  if (isArchived !== undefined) {
    updateData.isArchived = Boolean(isArchived);
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "Aucune donnée à mettre à jour" }, { status: 400 });
  }

  const updated = await prisma.wordList.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({ list: updated });
}

// DELETE /api/lists/[id] — suppression définitive
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });

  const existingList = await prisma.wordList.findUnique({ where: { id } });
  if (!existingList) return NextResponse.json({ error: "Liste introuvable" }, { status: 404 });
  if (existingList.userId !== user.id) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  await prisma.wordList.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
