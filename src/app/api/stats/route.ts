import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/stats — récupère les statistiques de l'utilisateur
export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) {
    return NextResponse.json({
      totalWords: 0,
      masteredWords: 0,
      totalSessions: 0,
      totalXp: 0,
      streak: { current: 0, best: 0 },
      recentSessions: [],
      wordsByLevel: { 0: 0, 1: 0, 2: 0, 3: 0 },
    });
  }

  // Stats en parallèle pour la performance
  const [
    totalWords,
    wordsByLevel,
    sessions,
    streak,
    recentSessions,
  ] = await Promise.all([
    prisma.word.count({ where: { userId: user.id } }),
    prisma.word.groupBy({
      by: ["level"],
      where: { userId: user.id },
      _count: { level: true },
    }),
    prisma.session.aggregate({
      where: { userId: user.id, endedAt: { not: null } },
      _count: { id: true },
      _sum: { xpEarned: true, correctWords: true, totalWords: true },
    }),
    prisma.streak.findUnique({ where: { userId: user.id } }),
    prisma.session.findMany({
      where: { userId: user.id, endedAt: { not: null } },
      orderBy: { startedAt: "desc" },
      take: 7,
      select: {
        id: true,
        startedAt: true,
        totalSentences: true,
        totalWords: true,
        correctWords: true,
        xpEarned: true,
      },
    }),
  ]);

  // Reformate wordsByLevel en objet {0: N, 1: N, 2: N, 3: N}
  const levelMap: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0 };
  for (const group of wordsByLevel) {
    levelMap[group.level] = group._count.level;
  }

  const totalXp = sessions._sum.xpEarned || 0;
  const totalCorrect = sessions._sum.correctWords || 0;
  const totalAttempted = sessions._sum.totalWords || 0;
  const accuracy =
    totalAttempted > 0
      ? Math.round((totalCorrect / totalAttempted) * 100)
      : 0;

  return NextResponse.json({
    totalWords,
    masteredWords: levelMap[3],
    totalSessions: sessions._count.id,
    totalXp,
    accuracy,
    streak: {
      current: streak?.current || 0,
      best: streak?.best || 0,
    },
    recentSessions,
    wordsByLevel: levelMap,
  });
}
