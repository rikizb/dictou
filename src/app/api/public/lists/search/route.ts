import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/public/lists/search?q=query
// Recherche les listes publiques par nom. Si q vide : 20 listes les plus copiées.
export async function GET(req: NextRequest) {
  const { userId: clerkId } = await auth();

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";

  const lists = await prisma.wordList.findMany({
    where: {
      isPublic: true,
      isArchived: false,
      ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
    },
    orderBy: { copyCount: "desc" },
    take: 20,
    select: {
      id: true,
      slug: true,
      name: true,
      copyCount: true,
      user: { select: { clerkId: true } },
      _count: { select: { items: true } },
    },
  });

  // Si l'utilisateur est connecté, vérifier ses abonnements
  let subscribedListIds = new Set<string>();
  if (clerkId) {
    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (user) {
      const subs = await prisma.wordListSubscription.findMany({
        where: {
          userId: user.id,
          listId: { in: lists.map((l) => l.id) },
        },
        select: { listId: true },
      });
      subscribedListIds = new Set(subs.map((s) => s.listId));
    }
  }

  const result = lists.map((list) => ({
    id: list.id,
    slug: list.slug,
    name: list.name,
    itemCount: list._count.items,
    copyCount: list.copyCount,
    ownerClerkId: list.user.clerkId,
    isSubscribed: subscribedListIds.has(list.id),
  }));

  return NextResponse.json({ lists: result });
}
