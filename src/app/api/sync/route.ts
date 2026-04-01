import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { syncSubscriptions } from "@/lib/sync";

// POST /api/sync — synchronise les abonnements aux listes partagées
export async function POST() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return NextResponse.json({ addedCount: 0 });

  const addedCount = await syncSubscriptions(user.id);

  return NextResponse.json({ addedCount });
}
