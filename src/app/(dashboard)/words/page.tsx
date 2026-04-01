"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { levelToColor, levelToEmoji, levelToLabel } from "@/lib/scoring";

interface Word {
  id: string;
  text: string;
  level: number;
  timesSeenInSentence: number;
  timesCorrect: number;
  timesWrong: number;
  addedAt: string;
  priorityScore: number;
}

export default function WordsPage() {
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState<"all" | "0" | "1" | "2" | "3">("all");
  const inputRef = useRef<HTMLInputElement>(null);

  const loadWords = async () => {
    const r = await fetch("/api/words");
    const data = await r.json();
    setWords(data.words || []);
    setLoading(false);
  };

  useEffect(() => {
    loadWords();
  }, []);

  const handleAdd = async () => {
    if (!input.trim()) return;

    const newWords = input
      .split(/[,;\n]+/)
      .map((w) => w.trim())
      .filter((w) => w.length > 0);

    if (newWords.length === 0) return;

    setAdding(true);
    try {
      const r = await fetch("/api/words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ words: newWords }),
      });

      if (!r.ok) throw new Error("Erreur");

      const data = await r.json();
      setInput("");
      await loadWords();
      toast.success(
        `${data.words.length} mot${data.words.length > 1 ? "s" : ""} ajouté${data.words.length > 1 ? "s" : ""} ! 🎉`
      );
    } catch {
      toast.error("Erreur lors de l'ajout");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (wordId: string, wordText: string) => {
    try {
      const r = await fetch(`/api/words?id=${wordId}`, { method: "DELETE" });
      if (!r.ok) throw new Error("Erreur");
      setWords((prev) => prev.filter((w) => w.id !== wordId));
      toast.success(`"${wordText}" supprimé`);
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  const filteredWords = words.filter((w) =>
    filter === "all" ? true : w.level.toString() === filter
  );

  const counts = {
    all: words.length,
    "0": words.filter((w) => w.level === 0).length,
    "1": words.filter((w) => w.level === 1).length,
    "2": words.filter((w) => w.level === 2).length,
    "3": words.filter((w) => w.level === 3).length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">📚 Mes mots</h1>
        <p className="text-gray-500 mt-1">
          {words.length} mot{words.length !== 1 ? "s" : ""} dans ta liste
        </p>
      </div>

      {/* Add words */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h2 className="font-semibold text-gray-800 mb-3">Ajouter des mots</h2>
        <p className="text-sm text-gray-500 mb-3">
          Tape un ou plusieurs mots, séparés par des virgules ou des retours à la ligne
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <textarea
            ref={inputRef as any}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.metaKey) handleAdd();
            }}
            placeholder="Ex: grenouille, papillon, anniversaire..."
            className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none"
            rows={2}
          />
          <button
            onClick={handleAdd}
            disabled={adding || !input.trim()}
            className="w-full sm:w-auto px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 sm:self-start"
          >
            {adding ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <span>+ Ajouter</span>
            )}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Astuce : Cmd+Entrée pour ajouter rapidement
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(
          [
            { key: "all", label: "Tous", emoji: "📋" },
            { key: "0", label: "Nouveaux", emoji: "🔴" },
            { key: "1", label: "En cours", emoji: "🟠" },
            { key: "2", label: "Connus", emoji: "🔵" },
            { key: "3", label: "Maîtrisés", emoji: "⭐" },
          ] as const
        ).map(({ key, label, emoji }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-2 rounded-full text-sm font-medium transition ${
              filter === key
                ? "bg-purple-600 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:border-purple-300"
            }`}
          >
            {emoji} {label} ({counts[key]})
          </button>
        ))}
      </div>

      {/* Words list */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl h-16 animate-pulse" />
          ))}
        </div>
      ) : filteredWords.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">📭</div>
          <p className="font-medium">
            {words.length === 0
              ? "Ta liste est vide ! Ajoute des mots ci-dessus."
              : "Aucun mot dans cette catégorie."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <AnimatePresence>
            {filteredWords.map((word) => (
              <motion.div
                key={word.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-xl border border-gray-100 p-3 group hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <span className="font-semibold text-gray-800 capitalize">
                    {word.text}
                  </span>
                  <button
                    onClick={() => handleDelete(word.id, word.text)}
                    className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 text-gray-300 hover:text-red-400 active:text-red-500 transition text-lg leading-none p-1 -m-1"
                    title="Supprimer"
                  >
                    ×
                  </button>
                </div>
                <div className="mt-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border font-medium ${levelToColor(
                      word.level
                    )}`}
                  >
                    {levelToEmoji(word.level)} {levelToLabel(word.level)}
                  </span>
                </div>
                {word.timesSeenInSentence > 0 && (
                  <div className="mt-1.5 text-xs text-gray-400">
                    {word.timesCorrect}/{word.timesSeenInSentence} correct
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
