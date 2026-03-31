import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST /api/sessions — crée une nouvelle session de pratique
export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  // Récupère ou crée l'utilisateur
  let user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) {
    user = await prisma.user.create({ data: { clerkId } });
    await prisma.streak.create({ data: { userId: user.id } });
  }

  const session = await prisma.session.create({
    data: { userId: user.id },
  });

  return NextResponse.json({ session }, { status: 201 });
}

// PATCH /api/sessions — termine une session
export async function PATCH(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const { sessionId } = body as { sessionId: string };

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });

  const session = await prisma.session.update({
    where: { id: sessionId, userId: user.id },
    data: { endedAt: new Date() },
  });

  return NextResponse.json({ session });
}
