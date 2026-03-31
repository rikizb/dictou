import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computePriorityScore } from "@/lib/scoring";

// GET /api/words — récupère tous les mots de l'utilisateur
export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return NextResponse.json({ words: [] });

  const words = await prisma.word.findMany({
    where: { userId: user.id },
    orderBy: { addedAt: "desc" },
  });

  return NextResponse.json({ words });
}

// POST /api/words — ajoute un ou plusieurs mots
export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const { words: wordTexts } = body as { words: string[] };

  if (!wordTexts || !Array.isArray(wordTexts) || wordTexts.length === 0) {
    return NextResponse.json({ error: "Mots manquants" }, { status: 400 });
  }

  // Récupère ou crée l'utilisateur
  let user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) {
    user = await prisma.user.create({ data: { clerkId } });
    // Crée aussi le streak
    await prisma.streak.create({ data: { userId: user.id } });
  }

  // Nettoie et déduplique les mots
  const cleaned = [...new Set(
    wordTexts
      .map((w) => w.trim().toLowerCase())
      .filter((w) => w.length > 0 && w.length <= 50)
  )];

  // Crée les mots (ignore les doublons avec upsert)
  const created = await Promise.all(
    cleaned.map((text) =>
      prisma.word.upsert({
        where: { userId_text: { userId: user!.id, text } },
        update: {}, // ne modifie pas si déjà existant
        create: {
          userId: user!.id,
          text,
          priorityScore: 100, // nouveau mot = priorité max
        },
      })
    )
  );

  return NextResponse.json({ words: created }, { status: 201 });
}

// DELETE /api/words — supprime un mot
export async function DELETE(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const wordId = searchParams.get("id");

  if (!wordId) return NextResponse.json({ error: "ID manquant" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });

  // Vérifie que le mot appartient à cet utilisateur
  const word = await prisma.word.findFirst({
    where: { id: wordId, userId: user.id },
  });

  if (!word) return NextResponse.json({ error: "Mot non trouvé" }, { status: 404 });

  await prisma.word.delete({ where: { id: wordId } });

  return NextResponse.json({ success: true });
}
