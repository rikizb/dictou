import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateSlug } from "@/lib/slug";

// GET /api/lists — toutes les listes de l'utilisateur
export async function GET(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return NextResponse.json({ lists: [] });

  const { searchParams } = new URL(req.url);
  const includeArchived = searchParams.get("includeArchived") === "true";

  const lists = await prisma.wordList.findMany({
    where: {
      userId: user.id,
      ...(includeArchived ? {} : { isArchived: false }),
    },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { items: true } },
    },
  });

  return NextResponse.json({
    lists: lists.map((l) => ({
      id: l.id,
      slug: l.slug,
      name: l.name,
      isPublic: l.isPublic,
      isArchived: l.isArchived,
      copyCount: l.copyCount,
      itemCount: l._count.items,
      createdAt: l.createdAt,
      updatedAt: l.updatedAt,
    })),
  });
}

// POST /api/lists — créer une nouvelle liste
export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const { name, words } = body as { name: string; words?: string[] };

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Le nom est requis" }, { status: 400 });
  }
  if (name.trim().length > 60) {
    return NextResponse.json({ error: "Le nom ne peut pas dépasser 60 caractères" }, { status: 400 });
  }

  let user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) {
    user = await prisma.user.create({ data: { clerkId } });
    await prisma.streak.create({ data: { userId: user.id } });
  }

  // Génère un slug unique (retente en cas de collision)
  let slug = generateSlug(name.trim());
  let attempts = 0;
  while (attempts < 5) {
    const existing = await prisma.wordList.findUnique({ where: { slug } });
    if (!existing) break;
    slug = generateSlug(name.trim());
    attempts++;
  }

  // Prépare les items si des mots sont fournis
  const cleanedWords = words
    ? [...new Set(
        words
          .map((w) => w.trim().toLowerCase())
          .filter((w) => w.length > 0)
      )]
    : [];

  const list = await prisma.wordList.create({
    data: {
      slug,
      name: name.trim(),
      userId: user.id,
      items: cleanedWords.length > 0
        ? {
            create: cleanedWords.map((word, position) => ({ word, position })),
          }
        : undefined,
    },
    include: {
      _count: { select: { items: true } },
    },
  });

  return NextResponse.json(
    {
      list: {
        id: list.id,
        slug: list.slug,
        name: list.name,
        isPublic: list.isPublic,
        isArchived: list.isArchived,
        copyCount: list.copyCount,
        itemCount: list._count.items,
        createdAt: list.createdAt,
        updatedAt: list.updatedAt,
      },
    },
    { status: 201 }
  );
}
