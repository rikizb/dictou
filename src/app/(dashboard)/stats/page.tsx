"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface Stats {
  totalWords: number;
  masteredWords: number;
  totalSessions: number;
  totalXp: number;
  accuracy: number;
  streak: { current: number; best: number };
  recentSessions: Array<{
    id: string;
    startedAt: string;
    totalSentences: number;
    totalWords: number;
    correctWords: number;
    xpEarned: number;
  }>;
  wordsByLevel: Record<string, number>;
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl h-32 animate-pulse" />
        ))}
      </div>
    );
  }

  const levelLabels = ["🔴 Nouveaux", "🟠 En cours", "🔵 Connus", "⭐ Maîtrisés"];
  const levelColors = ["bg-red-400", "bg-orange-400", "bg-blue-400", "bg-yellow-400"];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">📊 Mes statistiques</h1>

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { emoji: "🔥", label: "Streak actuel", value: `${stats?.streak.current || 0} jours`, color: "text-orange-600", bg: "bg-orange-50" },
          { emoji: "🏆", label: "Meilleur streak", value: `${stats?.streak.best || 0} jours`, color: "text-yellow-600", bg: "bg-yellow-50" },
          { emoji: "⭐", label: "XP total", value: stats?.totalXp || 0, color: "text-purple-600", bg: "bg-purple-50" },
          { emoji: "🎯", label: "Précision globale", value: `${stats?.accuracy || 0}%`, color: "text-green-600", bg: "bg-green-50" },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`${card.bg} rounded-2xl p-4 sm:p-5`}
          >
            <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">{card.emoji}</div>
            <div className={`text-xl sm:text-2xl font-bold ${card.color}`}>{card.value}</div>
            <div className="text-xs text-gray-500 mt-1 leading-tight">{card.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Words progress */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h2 className="font-bold text-gray-800 mb-4">
          Répartition des mots ({stats?.totalWords || 0} au total)
        </h2>
        {stats?.totalWords === 0 ? (
          <p className="text-gray-400 text-center py-4">
            Aucun mot dans ta liste. <a href="/words" className="text-purple-600 underline">Ajoutes-en !</a>
          </p>
        ) : (
          <div className="space-y-4">
            {[0, 1, 2, 3].map((level) => {
              const count = stats?.wordsByLevel[level.toString()] || 0;
              const total = stats?.totalWords || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={level}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{levelLabels[level]}</span>
                    <span className="font-semibold text-gray-800">
                      {count} mot{count !== 1 ? "s" : ""} ({pct}%)
                    </span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-4 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: level * 0.1 }}
                      className={`${levelColors[level]} h-4 rounded-full`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent sessions */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h2 className="font-bold text-gray-800 mb-4">Sessions récentes</h2>
        {!stats?.recentSessions || stats.recentSessions.length === 0 ? (
          <p className="text-gray-400 text-center py-4">
            Aucune session terminée. <a href="/practice" className="text-purple-600 underline">Lance ta première dictée !</a>
          </p>
        ) : (
          <div className="space-y-3">
            {stats.recentSessions.map((session, i) => {
              const accuracy =
                session.totalWords > 0
                  ? Math.round((session.correctWords / session.totalWords) * 100)
                  : 0;
              const date = new Date(session.startedAt);
              const dateStr = date.toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              });

              return (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start sm:items-center justify-between gap-2 p-4 bg-gray-50 rounded-xl"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-gray-800 capitalize text-sm sm:text-base truncate">
                      {dateStr}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500">
                      {session.totalSentences} phrase{session.totalSentences !== 1 ? "s" : ""}
                      {" · "}
                      {session.totalWords} mot{session.totalWords !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div
                      className={`text-base sm:text-lg font-bold ${
                        accuracy >= 80
                          ? "text-green-600"
                          : accuracy >= 60
                          ? "text-orange-500"
                          : "text-red-500"
                      }`}
                    >
                      {accuracy}%
                    </div>
                    <div className="text-xs sm:text-sm text-purple-600 font-medium">
                      +{session.xpEarned} XP
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
