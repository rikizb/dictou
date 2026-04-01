import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/subscriptions — liste les abonnements de l'utilisateur
export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return NextResponse.json({ subscriptions: [] });

  const subscriptions = await prisma.wordListSubscription.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      list: {
        select: {
          id: true,
          slug: true,
          name: true,
          isPublic: true,
          isArchived: true,
          user: { select: { clerkId: true } },
          _count: { select: { items: true } },
        },
      },
    },
  });

  const result = subscriptions.map((sub) => ({
    listId: sub.listId,
    lastSyncedAt: sub.lastSyncedAt,
    createdAt: sub.createdAt,
    list: {
      id: sub.list.id,
      slug: sub.list.slug,
      name: sub.list.name,
      isPublic: sub.list.isPublic,
      isArchived: sub.list.isArchived,
      itemCount: sub.list._count.items,
      ownerClerkId: sub.list.user.clerkId,
    },
  }));

  return NextResponse.json({ subscriptions: result });
}
