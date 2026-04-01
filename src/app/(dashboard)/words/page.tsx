"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { levelToColor, levelToEmoji, levelToLabel } from "@/lib/scoring";

interface Word {
  id: string;
  text: string;
  level: number;
  source: "MANUAL" | "CAPTURED";
  timesSeenInSentence: number;
  timesCorrect: number;
  timesWrong: number;
  addedAt: string;
  priorityScore: number;
}

type SortOption = "date_desc" | "alpha" | "level_asc" | "wrong_desc";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "date_desc", label: "Date d'ajout (récent d'abord)" },
  { value: "alpha", label: "Alphabétique" },
  { value: "level_asc", label: "Niveau (faible en premier)" },
  { value: "wrong_desc", label: "Plus souvent raté" },
];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function successRate(word: Word): string {
  if (word.timesSeenInSentence === 0) return "—";
  return `${Math.round((word.timesCorrect / word.timesSeenInSentence) * 100)}%`;
}

function sortWords(words: Word[], sort: SortOption): Word[] {
  return [...words].sort((a, b) => {
    switch (sort) {
      case "date_desc":
        return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
      case "alpha":
        return a.text.localeCompare(b.text, "fr");
      case "level_asc":
        return a.level - b.level;
      case "wrong_desc":
        return b.timesWrong - a.timesWrong;
    }
  });
}

interface WordRowProps {
  word: Word;
  pendingDeleteId: string | null;
  onDeleteRequest: (id: string) => void;
  onDeleteCancel: () => void;
  onDeleteConfirm: (id: string, text: string) => void;
}

function WordRow({
  word,
  pendingDeleteId,
  onDeleteRequest,
  onDeleteCancel,
  onDeleteConfirm,
}: WordRowProps) {
  const isPending = pendingDeleteId === word.id;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, transition: { duration: 0.2 } }}
      className={`group flex items-center gap-2 px-3 py-3 border-b border-gray-100 last:border-0 transition-colors ${
        isPending ? "bg-red-50" : "hover:bg-gray-50"
      }`}
    >
      {/* Texte */}
      <span className="flex-1 font-semibold text-gray-800 capitalize text-sm truncate">
        {word.text}
      </span>

      {/* Badge niveau */}
      <span
        className={`hidden sm:inline-flex w-24 shrink-0 items-center justify-center text-xs px-2 py-0.5 rounded-full border font-medium ${levelToColor(word.level)}`}
      >
        {levelToEmoji(word.level)} {levelToLabel(word.level)}
      </span>
      {/* Badge niveau mobile (emoji seulement) */}
      <span className="sm:hidden text-base shrink-0" title={levelToLabel(word.level)}>
        {levelToEmoji(word.level)}
      </span>

      {/* Taux réussite */}
      <span className="w-12 sm:w-16 text-right text-xs text-gray-500 shrink-0">
        {successRate(word)}
      </span>

      {/* Date — masquée mobile */}
      <span className="hidden sm:block w-24 text-right text-xs text-gray-400 shrink-0">
        {formatDate(word.addedAt)}
      </span>

      {/* Actions */}
      <div className="w-auto shrink-0 flex items-center gap-1">
        {isPending ? (
          <>
            <button
              onClick={onDeleteCancel}
              className="text-gray-500 text-xs underline px-1 py-1 hover:text-gray-700 transition"
            >
              Annuler
            </button>
            <button
              onClick={() => onDeleteConfirm(word.id, word.text)}
              className="bg-red-500 text-white text-xs px-3 py-1 rounded-lg hover:bg-red-600 transition font-medium"
            >
              Supprimer
            </button>
          </>
        ) : (
          <button
            onClick={() => onDeleteRequest(word.id)}
            className="text-gray-300 group-hover:text-gray-400 active:text-red-400 transition p-1 rounded hover:bg-gray-100"
            title="Supprimer"
            aria-label={`Supprimer "${word.text}"`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path
                fillRule="evenodd"
                d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.712Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
    </motion.li>
  );
}

interface WordSectionProps {
  title: string;
  icon?: string;
  words: Word[];
  pendingDeleteId: string | null;
  onDeleteRequest: (id: string) => void;
  onDeleteCancel: () => void;
  onDeleteConfirm: (id: string, text: string) => void;
}

function WordSection({
  title,
  icon,
  words,
  pendingDeleteId,
  onDeleteRequest,
  onDeleteCancel,
  onDeleteConfirm,
}: WordSectionProps) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1 flex items-center gap-1">
        {icon && <span>{icon}</span>}
        {title} ({words.length})
      </h3>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* En-tête colonnes */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-2 border-b border-gray-100 bg-gray-50 text-xs font-medium text-gray-400">
          <span className="flex-1">Mot</span>
          <span className="w-24 text-center">Niveau</span>
          <span className="w-16 text-right">Réussite</span>
          <span className="w-24 text-right">Ajouté le</span>
          <span className="w-10" />
        </div>
        <ul>
          <AnimatePresence initial={false}>
            {words.map((word) => (
              <WordRow
                key={word.id}
                word={word}
                pendingDeleteId={pendingDeleteId}
                onDeleteRequest={onDeleteRequest}
                onDeleteCancel={onDeleteCancel}
                onDeleteConfirm={onDeleteConfirm}
              />
            ))}
          </AnimatePresence>
        </ul>
      </div>
    </div>
  );
}

export default function WordsPage() {
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState<"all" | "0" | "1" | "2" | "3">("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("date_desc");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const loadWords = async () => {
    const r = await fetch("/api/words");
    const data = await r.json();
    setWords(data.words || []);
    setLoading(false);
  };

  useEffect(() => {
    loadWords();
  }, []);

  // Nettoyage du timer au démontage
  useEffect(() => {
    return () => {
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
    };
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
        `${data.words.length} mot${data.words.length > 1 ? "s" : ""} ajouté${data.words.length > 1 ? "s" : ""} !`
      );
    } catch {
      toast.error("Erreur lors de l'ajout");
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteRequest = useCallback((id: string) => {
    // Annule le timer précédent si un mot était déjà en attente
    if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
    setPendingDeleteId(id);
    // Auto-annulation après 5 secondes
    deleteTimerRef.current = setTimeout(() => {
      setPendingDeleteId(null);
    }, 5000);
  }, []);

  const handleDeleteCancel = useCallback(() => {
    if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
    setPendingDeleteId(null);
  }, []);

  const handleDeleteConfirm = useCallback(
    async (wordId: string, wordText: string) => {
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
      setPendingDeleteId(null);

      // Suppression optimiste
      setWords((prev) => prev.filter((w) => w.id !== wordId));
      toast.success(`"${wordText}" supprimé`);

      try {
        const r = await fetch(`/api/words?id=${wordId}`, { method: "DELETE" });
        if (!r.ok) throw new Error("Erreur");
      } catch {
        // Restaure le mot en cas d'erreur
        await loadWords();
        toast.error("Erreur lors de la suppression");
      }
    },
    []
  );

  // Filtrage et tri
  const processedWords = (() => {
    let result = words;

    // Filtre par niveau
    if (filter !== "all") {
      result = result.filter((w) => w.level.toString() === filter);
    }

    // Filtre par recherche
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((w) => w.text.toLowerCase().includes(q));
    }

    // Tri
    result = sortWords(result, sort);

    return result;
  })();

  const manualWords = processedWords.filter((w) => w.source === "MANUAL");
  const capturedWords = processedWords.filter((w) => w.source === "CAPTURED");

  const hasBothSections = manualWords.length > 0 && capturedWords.length > 0;

  const counts = {
    all: words.length,
    "0": words.filter((w) => w.level === 0).length,
    "1": words.filter((w) => w.level === 1).length,
    "2": words.filter((w) => w.level === 2).length,
    "3": words.filter((w) => w.level === 3).length,
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">📚 Mes mots</h1>
        <p className="text-gray-500 mt-1">
          {words.length} mot{words.length !== 1 ? "s" : ""} dans ta liste
        </p>
      </div>

      {/* Ajouter des mots */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h2 className="font-semibold text-gray-800 mb-3">Ajouter des mots</h2>
        <p className="text-sm text-gray-500 mb-3">
          Tape un ou plusieurs mots, séparés par des virgules ou des retours à la ligne
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <textarea
            ref={inputRef}
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

      {/* Barre d'outils : recherche + tri + filtre niveau */}
      <div className="space-y-3">
        {/* Ligne 1 : recherche + tri */}
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Recherche */}
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un mot…"
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            )}
          </div>

          {/* Tri */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="sm:w-64 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white text-gray-700"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Ligne 2 : filtre niveau */}
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
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                filter === key
                  ? "bg-purple-600 text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-purple-300"
              }`}
            >
              {emoji} {label} ({counts[key]})
            </button>
          ))}
        </div>
      </div>

      {/* Liste des mots */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl h-12 animate-pulse" />
          ))}
        </div>
      ) : processedWords.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">📭</div>
          <p className="font-medium">
            {words.length === 0
              ? "Ta liste est vide ! Ajoute des mots ci-dessus."
              : search
              ? `Aucun mot ne correspond à "${search}"`
              : "Aucun mot dans cette catégorie."}
          </p>
        </div>
      ) : hasBothSections ? (
        // Deux sections
        <div className="space-y-6">
          <WordSection
            title="Ajoutés manuellement"
            words={manualWords}
            pendingDeleteId={pendingDeleteId}
            onDeleteRequest={handleDeleteRequest}
            onDeleteCancel={handleDeleteCancel}
            onDeleteConfirm={handleDeleteConfirm}
          />
          <WordSection
            title="Appris en dictée"
            icon="⚡"
            words={capturedWords}
            pendingDeleteId={pendingDeleteId}
            onDeleteRequest={handleDeleteRequest}
            onDeleteCancel={handleDeleteCancel}
            onDeleteConfirm={handleDeleteConfirm}
          />
        </div>
      ) : (
        // Une seule section sans en-tête
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* En-tête colonnes */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 border-b border-gray-100 bg-gray-50 text-xs font-medium text-gray-400">
            <span className="flex-1">Mot</span>
            <span className="w-24 text-center">Niveau</span>
            <span className="w-16 text-right">Réussite</span>
            <span className="w-24 text-right">Ajouté le</span>
            <span className="w-10" />
          </div>
          <ul>
            <AnimatePresence initial={false}>
              {processedWords.map((word) => (
                <WordRow
                  key={word.id}
                  word={word}
                  pendingDeleteId={pendingDeleteId}
                  onDeleteRequest={handleDeleteRequest}
                  onDeleteCancel={handleDeleteCancel}
                  onDeleteConfirm={handleDeleteConfirm}
                />
              ))}
            </AnimatePresence>
          </ul>
        </div>
      )}
    </div>
  );
}
