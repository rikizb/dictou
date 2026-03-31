"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useUser } from "@clerk/nextjs";

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

export default function DashboardPage() {
  const { user } = useUser();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => setStats(data))
      .finally(() => setLoading(false));
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Bonjour";
    if (h < 18) return "Bon après-midi";
    return "Bonsoir";
  };

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-600 to-blue-500 rounded-3xl p-8 text-white shadow-lg"
      >
        <p className="text-purple-200 text-lg">
          {greeting()},{" "}
          <span className="font-bold text-white">
            {user?.firstName || "champion"} !
          </span>
        </p>
        <h1 className="text-3xl font-bold mt-1">
          {stats?.streak.current && stats.streak.current > 0
            ? `🔥 ${stats.streak.current} jour${stats.streak.current > 1 ? "s" : ""} de suite !`
            : "Prêt à t'entraîner ?"}
        </h1>
        <p className="text-purple-200 mt-2">
          {stats?.totalXp || 0} ⭐ XP total
        </p>
        <Link
          href="/practice"
          className="inline-block mt-4 px-6 py-3 bg-white text-purple-700 font-bold rounded-xl hover:scale-105 transition shadow"
        >
          🎯 Lancer une dictée
        </Link>
      </motion.div>

      {/* Stats cards */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 h-28 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              icon: "📚",
              label: "Mots dans la liste",
              value: stats?.totalWords || 0,
              color: "text-blue-600",
              bg: "bg-blue-50",
            },
            {
              icon: "⭐",
              label: "Mots maîtrisés",
              value: stats?.masteredWords || 0,
              color: "text-yellow-600",
              bg: "bg-yellow-50",
            },
            {
              icon: "🎯",
              label: "Sessions",
              value: stats?.totalSessions || 0,
              color: "text-green-600",
              bg: "bg-green-50",
            },
            {
              icon: "📈",
              label: "Précision",
              value: `${stats?.accuracy || 0}%`,
              color: "text-purple-600",
              bg: "bg-purple-50",
            },
          ].map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`${card.bg} rounded-2xl p-5 border border-white`}
            >
              <div className="text-3xl mb-2">{card.icon}</div>
              <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
              <div className="text-xs text-gray-500 mt-1">{card.label}</div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Word levels breakdown */}
      {stats && stats.totalWords > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <h2 className="font-bold text-gray-800 mb-4">
            Progression de tes mots
          </h2>
          <div className="space-y-3">
            {[
              { level: "0", label: "Nouveaux", emoji: "🔴", color: "bg-red-400" },
              { level: "1", label: "En apprentissage", emoji: "🟠", color: "bg-orange-400" },
              { level: "2", label: "Connus", emoji: "🔵", color: "bg-blue-400" },
              { level: "3", label: "Maîtrisés", emoji: "⭐", color: "bg-yellow-400" },
            ].map(({ level, label, emoji, color }) => {
              const count = stats.wordsByLevel[level] || 0;
              const pct = stats.totalWords > 0 ? (count / stats.totalWords) * 100 : 0;
              return (
                <div key={level} className="flex items-center gap-3">
                  <span className="text-lg w-6">{emoji}</span>
                  <span className="text-sm text-gray-600 w-36">{label}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-3">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: 0.4 }}
                      className={`${color} h-3 rounded-full`}
                    />
                  </div>
                  <span className="text-sm font-bold text-gray-700 w-8 text-right">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/words" className="group">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:border-purple-200 transition">
            <div className="text-3xl mb-2">📚</div>
            <h3 className="font-bold text-gray-800">Gérer mes mots</h3>
            <p className="text-sm text-gray-500 mt-1">
              Ajouter, voir et supprimer les mots à apprendre
            </p>
          </div>
        </Link>
        <Link href="/stats" className="group">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:border-purple-200 transition">
            <div className="text-3xl mb-2">📊</div>
            <h3 className="font-bold text-gray-800">Voir mes statistiques</h3>
            <p className="text-sm text-gray-500 mt-1">
              Historique des sessions et progression détaillée
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
