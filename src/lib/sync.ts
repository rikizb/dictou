import { prisma } from "@/lib/db";

/**
 * Synchronise les abonnements aux listes partagées pour un utilisateur.
 * Ajoute les nouveaux mots des listes abonnées sans jamais supprimer.
 * Retourne le nombre de mots ajoutés.
 */
export async function syncSubscriptions(userId: string): Promise<number> {
  const subscriptions = await prisma.wordListSubscription.findMany({
    where: { userId },
    include: {
      list: { include: { items: true } },
    },
  });

  if (subscriptions.length === 0) return 0;

  let totalAdded = 0;

  for (const sub of subscriptions) {
    const list = sub.list;
    if (list.isArchived || !list.isPublic) continue;

    const texts = list.items
      .map((i) => i.word.trim().toLowerCase())
      .filter(Boolean);
    if (texts.length === 0) continue;

    // Mots déjà présents chez l'utilisateur
    const existing = await prisma.word.findMany({
      where: { userId, text: { in: texts } },
      select: { text: true },
    });
    const existingSet = new Set(existing.map((w) => w.text));

    const newTexts = texts.filter((t) => !existingSet.has(t));

    if (newTexts.length > 0) {
      await prisma.word.createMany({
        data: newTexts.map((text) => ({
          userId,
          text,
          source: "MANUAL" as const,
          sourceListId: list.id,
          priorityScore: 100,
        })),
        skipDuplicates: true,
      });
      totalAdded += newTexts.length;
    }

    // Met à jour lastSyncedAt
    await prisma.wordListSubscription.update({
      where: { id: sub.id },
      data: { lastSyncedAt: new Date() },
    });
  }

  return totalAdded;
}
