import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// PATCH /api/words/[id] — met à jour le niveau d'un mot
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { level } = body as { level: number };

  if (typeof level !== "number" || level < 0 || level > 3) {
    return NextResponse.json({ error: "Niveau invalide (0-3)" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });

  const word = await prisma.word.findFirst({ where: { id, userId: user.id } });
  if (!word) return NextResponse.json({ error: "Mot non trouvé" }, { status: 404 });

  const updated = await prisma.word.update({
    where: { id },
    data: { level },
  });

  return NextResponse.json({ word: updated });
}
