import { Word } from "@prisma/client";

// ============================================================
// Algorithme de priorisation des mots
// ============================================================
// Score = recency_score + difficulty_score
//
// recency_score: les mots ajoutés récemment ont un score élevé
//   - Ajouté il y a 0-3 jours  → 50 pts
//   - Ajouté il y a 4-7 jours  → 30 pts
//   - Ajouté il y a 8-14 jours → 15 pts
//   - Plus ancien              → 5 pts
//
// difficulty_score: les mots peu connus ont un score élevé
//   - Jamais vu (level=0)      → 40 pts
//   - Difficile (level=1)      → 30 pts
//   - Connu (level=2)          → 10 pts
//   - Maîtrisé (level=3)       → 2 pts
//
// Bonus: longtemps sans voir le mot → +10 pts

export function computePriorityScore(word: Word): number {
  const now = new Date();
  const daysSinceAdded =
    (now.getTime() - word.addedAt.getTime()) / (1000 * 60 * 60 * 24);

  // Score de récence
  let recencyScore = 5;
  if (daysSinceAdded <= 3) recencyScore = 50;
  else if (daysSinceAdded <= 7) recencyScore = 30;
  else if (daysSinceAdded <= 14) recencyScore = 15;

  // Score de difficulté
  const difficultyScores = [40, 30, 10, 2];
  const difficultyScore = difficultyScores[Math.min(word.level, 3)];

  // Bonus "pas vu depuis longtemps"
  let staleness = 0;
  if (word.lastSeenAt) {
    const daysSinceSeen =
      (now.getTime() - word.lastSeenAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceSeen > 7) staleness = 10;
  } else {
    staleness = 10; // jamais vu dans une phrase
  }

  return recencyScore + difficultyScore + staleness;
}

// Sélectionne les N mots les plus prioritaires pour une phrase
export function selectPriorityWords(words: Word[], n: number = 3): Word[] {
  const scored = words.map((w) => ({
    word: w,
    score: computePriorityScore(w),
  }));

  // Tri par score décroissant, avec un peu d'aléatoire pour éviter la répétition
  scored.sort((a, b) => {
    // Ajout d'un bruit aléatoire de ±10% pour varier les phrases
    const noise = (Math.random() - 0.5) * 20;
    return b.score - a.score + noise;
  });

  return scored.slice(0, n).map((s) => s.word);
}

// Met à jour le niveau d'un mot après une réponse
export function computeNewLevel(
  currentLevel: number,
  wasCorrect: boolean
): number {
  if (wasCorrect) {
    return Math.min(currentLevel + 1, 3); // max level = 3
  } else {
    return Math.max(currentLevel - 1, 0); // min level = 0
  }
}

// Calcule les XP gagnés pour une phrase
export function computeXp(
  correctCount: number,
  totalCount: number,
  wordLevels: number[]
): number {
  if (totalCount === 0) return 0;

  const accuracy = correctCount / totalCount;
  const baseXp = 10;

  // Bonus pour les mots difficiles
  const avgLevel =
    wordLevels.length > 0
      ? wordLevels.reduce((a, b) => a + b, 0) / wordLevels.length
      : 0;
  const difficultyBonus = Math.round((3 - avgLevel) * 5);

  // Bonus pour la précision
  const accuracyBonus = accuracy === 1 ? 15 : accuracy >= 0.8 ? 8 : 0;

  return baseXp + difficultyBonus + accuracyBonus;
}

// Niveau d'un mot en texte
export function levelToLabel(level: number): string {
  const labels = ["Nouveau", "En cours", "Connu", "Maitrisé"];
  return labels[Math.min(level, 3)];
}

// Couleur selon le niveau
export function levelToColor(level: number): string {
  const colors = [
    "bg-red-100 text-red-700 border-red-200",
    "bg-orange-100 text-orange-700 border-orange-200",
    "bg-blue-100 text-blue-700 border-blue-200",
    "bg-green-100 text-green-700 border-green-200",
  ];
  return colors[Math.min(level, 3)];
}

// Emoji selon le niveau
export function levelToEmoji(level: number): string {
  const emojis = ["🔴", "🟠", "🔵", "⭐"];
  return emojis[Math.min(level, 3)];
}
