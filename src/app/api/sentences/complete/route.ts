import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeNewLevel, computeXp } from "@/lib/scoring";

// POST /api/sentences/complete — valide une phrase et enregistre les résultats
export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const { sentenceId, results } = body as {
    sentenceId: string;
    results: { wordId: string; correct: boolean }[];
  };

  if (!sentenceId || !results) {
    return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });

  // Récupère la phrase
  const sentence = await prisma.sentence.findFirst({
    where: { id: sentenceId },
    include: {
      session: true,
      sentenceWords: { include: { word: true } },
    },
  });

  if (!sentence || sentence.session.userId !== user.id) {
    return NextResponse.json({ error: "Phrase non trouvée" }, { status: 404 });
  }

  const correctCount = results.filter((r) => r.correct).length;
  const totalCount = results.length;
  const score = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

  // XP calculés selon les niveaux des mots
  const wordLevels = sentence.sentenceWords.map((sw) => sw.word.level);
  const xpEarned = computeXp(correctCount, totalCount, wordLevels);

  // Met à jour chaque SentenceWord avec le résultat
  await Promise.all(
    results.map((r) =>
      prisma.sentenceWord.updateMany({
        where: { sentenceId, wordId: r.wordId },
        data: { wasCorrect: r.correct },
      })
    )
  );

  // Met à jour les niveaux et stats des mots
  await Promise.all(
    results.map(async (r) => {
      const sentenceWord = sentence.sentenceWords.find((sw) => sw.wordId === r.wordId);
      if (!sentenceWord) return;

      const newLevel = computeNewLevel(sentenceWord.word.level, r.correct);
      await prisma.word.update({
        where: { id: r.wordId },
        data: {
          level: newLevel,
          timesCorrect: r.correct ? { increment: 1 } : undefined,
          timesWrong: !r.correct ? { increment: 1 } : undefined,
          // Recalcule le score de priorité
          priorityScore: computePriorityScoreSimple(newLevel, sentenceWord.word.addedAt),
        },
      });
    })
  );

  // Met à jour la phrase
  await prisma.sentence.update({
    where: { id: sentenceId },
    data: {
      completedAt: new Date(),
      score,
    },
  });

  // Met à jour la session
  await prisma.session.update({
    where: { id: sentence.sessionId },
    data: {
      totalWords: { increment: totalCount },
      correctWords: { increment: correctCount },
      xpEarned: { increment: xpEarned },
    },
  });

  // Met à jour le streak
  await updateStreak(user.id);

  return NextResponse.json({
    score,
    xpEarned,
    results: results.map((r) => {
      const sw = sentence.sentenceWords.find((s) => s.wordId === r.wordId);
      return {
        wordId: r.wordId,
        word: sw?.word.text,
        correct: r.correct,
        newLevel: computeNewLevel(sw?.word.level || 0, r.correct),
      };
    }),
  });
}

function computePriorityScoreSimple(level: number, addedAt: Date): number {
  const daysSinceAdded =
    (Date.now() - addedAt.getTime()) / (1000 * 60 * 60 * 24);
  let recency = daysSinceAdded <= 3 ? 50 : daysSinceAdded <= 7 ? 30 : daysSinceAdded <= 14 ? 15 : 5;
  const difficulty = [40, 30, 10, 2][Math.min(level, 3)];
  return recency + difficulty;
}

async function updateStreak(userId: string) {
  const streak = await prisma.streak.findUnique({ where: { userId } });
  const now = new Date();

  if (!streak) {
    await prisma.streak.create({
      data: { userId, current: 1, best: 1, lastActiveAt: now },
    });
    return;
  }

  const lastActive = streak.lastActiveAt;
  if (!lastActive) {
    await prisma.streak.update({
      where: { userId },
      data: { current: 1, best: Math.max(streak.best, 1), lastActiveAt: now },
    });
    return;
  }

  const daysSinceLastActive =
    (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSinceLastActive < 1) {
    // Même jour — pas de changement
    return;
  } else if (daysSinceLastActive < 2) {
    // Jour suivant — continue le streak
    const newStreak = streak.current + 1;
    await prisma.streak.update({
      where: { userId },
      data: {
        current: newStreak,
        best: Math.max(streak.best, newStreak),
        lastActiveAt: now,
      },
    });
  } else {
    // Streak cassé
    await prisma.streak.update({
      where: { userId },
      data: { current: 1, lastActiveAt: now },
    });
  }
}
