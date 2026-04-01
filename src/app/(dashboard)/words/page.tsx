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
  sourceListId: string | null;
  sourceList: { id: string; name: string } | null;
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
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

function successRate(word: Word): string {
  if (word.timesSeenInSentence === 0) return "—";
  return `${Math.round((word.timesCorrect / word.timesSeenInSentence) * 100)}%`;
}

function originLabel(word: Word): { text: string; title: string } {
  if (word.sourceList) return { text: `📋 ${word.sourceList.name}`, title: `Depuis la liste "${word.sourceList.name}"` };
  if (word.source === "CAPTURED") return { text: "✨ Dictou", title: "Capturé pendant une dictée" };
  return { text: "✏️ Manuel", title: "Ajouté manuellement" };
}

function sortWords(words: Word[], sort: SortOption): Word[] {
  return [...words].sort((a, b) => {
    switch (sort) {
      case "date_desc": return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
      case "alpha": return a.text.localeCompare(b.text, "fr");
      case "level_asc": return a.level - b.level;
      case "wrong_desc": return b.timesWrong - a.timesWrong;
    }
  });
}

interface WordRowProps {
  word: Word;
  pendingDeleteId: string | null;
  onDeleteRequest: (id: string) => void;
  onDeleteCancel: () => void;
  onDeleteConfirm: (id: string, text: string) => void;
  onLevelChange: (id: string, currentLevel: number) => void;
}

function WordRow({ word, pendingDeleteId, onDeleteRequest, onDeleteCancel, onDeleteConfirm, onLevelChange }: WordRowProps) {
  const isPending = pendingDeleteId === word.id;
  const origin = originLabel(word);

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
      <span className="flex-1 font-semibold text-gray-800 capitalize text-sm truncate min-w-0">
        {word.text}
      </span>

      {/* Origine — masquée sur très petit mobile */}
      <span
        className="hidden md:block w-32 shrink-0 text-xs text-gray-500 truncate"
        title={origin.title}
      >
        {origin.text}
      </span>

      {/* Badge niveau — cliquable pour changer */}
      <button
        onClick={() => onLevelChange(word.id, word.level)}
        title="Cliquer pour changer le niveau"
        className={`hidden sm:inline-flex w-24 shrink-0 items-center justify-center text-xs px-2 py-0.5 rounded-full border font-medium transition hover:opacity-75 active:scale-95 ${levelToColor(word.level)}`}
      >
        {levelToEmoji(word.level)} {levelToLabel(word.level)}
      </button>
      {/* Badge niveau mobile (emoji seul, cliquable) */}
      <button
        onClick={() => onLevelChange(word.id, word.level)}
        className="sm:hidden text-base shrink-0 active:scale-90 transition"
        title={`Niveau: ${levelToLabel(word.level)} — cliquer pour changer`}
      >
        {levelToEmoji(word.level)}
      </button>

      {/* Taux réussite */}
      <span className="w-12 sm:w-14 text-right text-xs text-gray-500 shrink-0">
        {successRate(word)}
      </span>

      {/* Date — masquée mobile */}
      <span className="hidden lg:block w-24 text-right text-xs text-gray-400 shrink-0">
        {formatDate(word.addedAt)}
      </span>

      {/* Actions */}
      <div className="w-auto shrink-0 flex items-center gap-1">
        {isPending ? (
          <>
            <button onClick={onDeleteCancel} className="text-gray-500 text-xs underline px-1 py-1 hover:text-gray-700 transition">
              Annuler
            </button>
            <button onClick={() => onDeleteConfirm(word.id, word.text)} className="bg-red-500 text-white text-xs px-3 py-1 rounded-lg hover:bg-red-600 transition font-medium">
              Supprimer
            </button>
          </>
        ) : (
          <button
            onClick={() => onDeleteRequest(word.id)}
            className="text-gray-300 group-hover:text-gray-400 active:text-red-400 transition p-1 rounded hover:bg-gray-100"
            title={`Supprimer "${word.text}"`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.712Z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </motion.li>
  );
}

export default function WordsPage() {
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [input, setInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState<"all" | "0" | "1" | "2" | "3">("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("date_desc");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const loadWords = useCallback(async () => {
    const r = await fetch("/api/words");
    const data = await r.json();
    setWords(data.words || []);
    setLoading(false);
  }, []);

  // Auto-sync silencieux au chargement
  useEffect(() => {
    loadWords();
    // Sync en arrière-plan
    fetch("/api/sync", { method: "POST" })
      .then((r) => r.json())
      .then((data) => {
        if (data.addedCount > 0) {
          toast.success(`🔄 ${data.addedCount} nouveau${data.addedCount > 1 ? "x mots" : " mot"} depuis tes listes !`);
          loadWords();
        }
      })
      .catch(() => {/* silencieux */});
  }, [loadWords]);

  useEffect(() => {
    return () => { if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current); };
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const r = await fetch("/api/sync", { method: "POST" });
      const data = await r.json();
      if (data.addedCount > 0) {
        toast.success(`🔄 ${data.addedCount} nouveau${data.addedCount > 1 ? "x mots" : " mot"} ajouté${data.addedCount > 1 ? "s" : ""} !`);
        await loadWords();
      } else {
        toast("Tout est à jour ✅", { icon: "🔄" });
      }
    } catch {
      toast.error("Erreur lors de la synchronisation");
    } finally {
      setSyncing(false);
    }
  };

  const handleAdd = async () => {
    if (!input.trim()) return;
    const newWords = input.split(/[,;\n]+/).map((w) => w.trim()).filter((w) => w.length > 0);
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
      toast.success(`${data.words.length} mot${data.words.length > 1 ? "s" : ""} ajouté${data.words.length > 1 ? "s" : ""} !`);
    } catch {
      toast.error("Erreur lors de l'ajout");
    } finally {
      setAdding(false);
    }
  };

  const handleLevelChange = useCallback(async (wordId: string, currentLevel: number) => {
    const newLevel = (currentLevel + 1) % 4;
    // Mise à jour optimiste
    setWords((prev) => prev.map((w) => w.id === wordId ? { ...w, level: newLevel } : w));
    try {
      const r = await fetch(`/api/words/${wordId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level: newLevel }),
      });
      if (!r.ok) throw new Error();
    } catch {
      // Restaure en cas d'erreur
      setWords((prev) => prev.map((w) => w.id === wordId ? { ...w, level: currentLevel } : w));
      toast.error("Erreur lors du changement de niveau");
    }
  }, []);

  const handleDeleteRequest = useCallback((id: string) => {
    if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
    setPendingDeleteId(id);
    deleteTimerRef.current = setTimeout(() => setPendingDeleteId(null), 5000);
  }, []);

  const handleDeleteCancel = useCallback(() => {
    if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
    setPendingDeleteId(null);
  }, []);

  const handleDeleteConfirm = useCallback(async (wordId: string, wordText: string) => {
    if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
    setPendingDeleteId(null);
    setWords((prev) => prev.filter((w) => w.id !== wordId));
    toast.success(`"${wordText}" supprimé`);
    try {
      const r = await fetch(`/api/words?id=${wordId}`, { method: "DELETE" });
      if (!r.ok) throw new Error();
    } catch {
      await loadWords();
      toast.error("Erreur lors de la suppression");
    }
  }, [loadWords]);

  const processedWords = (() => {
    let result = words;
    if (filter !== "all") result = result.filter((w) => w.level.toString() === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((w) => w.text.toLowerCase().includes(q));
    }
    return sortWords(result, sort);
  })();

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
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📚 Mes mots</h1>
          <p className="text-gray-500 mt-1">{words.length} mot{words.length !== 1 ? "s" : ""} dans ta liste</p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 disabled:opacity-50 transition"
          title="Synchroniser les listes abonnées"
        >
          <span className={syncing ? "animate-spin" : ""}>🔄</span>
          <span className="hidden sm:inline">{syncing ? "Sync…" : "Synchroniser"}</span>
        </button>
      </div>

      {/* Ajouter des mots */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h2 className="font-semibold text-gray-800 mb-3">Ajouter des mots</h2>
        <p className="text-sm text-gray-500 mb-3">Tape un ou plusieurs mots, séparés par des virgules ou des retours à la ligne</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && e.metaKey) handleAdd(); }}
            placeholder="Ex: grenouille, papillon, anniversaire..."
            className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none"
            rows={2}
          />
          <button
            onClick={handleAdd}
            disabled={adding || !input.trim()}
            className="w-full sm:w-auto px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 sm:self-start"
          >
            {adding ? <span className="animate-spin">⏳</span> : <span>+ Ajouter</span>}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">Astuce : Cmd+Entrée pour ajouter rapidement</p>
      </div>

      {/* Barre d'outils */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un mot…"
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">×</button>
            )}
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="sm:w-64 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white text-gray-700"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 flex-wrap">
          {([
            { key: "all", label: "Tous", emoji: "📋" },
            { key: "0", label: "Nouveaux", emoji: "🔴" },
            { key: "1", label: "En cours", emoji: "🟠" },
            { key: "2", label: "Connus", emoji: "🔵" },
            { key: "3", label: "Maîtrisés", emoji: "⭐" },
          ] as const).map(({ key, label, emoji }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-2 rounded-full text-sm font-medium transition ${
                filter === key ? "bg-purple-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:border-purple-300"
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
          {[...Array(6)].map((_, i) => <div key={i} className="bg-white rounded-xl h-12 animate-pulse" />)}
        </div>
      ) : processedWords.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">📭</div>
          <p className="font-medium">
            {words.length === 0 ? "Ta liste est vide ! Ajoute des mots ci-dessus."
              : search ? `Aucun mot ne correspond à "${search}"`
              : "Aucun mot dans cette catégorie."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* En-tête colonnes */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 border-b border-gray-100 bg-gray-50 text-xs font-medium text-gray-400">
            <span className="flex-1">Mot</span>
            <span className="hidden md:block w-32">Origine</span>
            <span className="w-24 text-center">Niveau <span className="font-normal opacity-70">(cliquable)</span></span>
            <span className="w-14 text-right">Réussite</span>
            <span className="hidden lg:block w-24 text-right">Ajouté le</span>
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
                  onLevelChange={handleLevelChange}
                />
              ))}
            </AnimatePresence>
          </ul>
        </div>
      )}

      {/* Légende */}
      {words.length > 0 && (
        <p className="text-xs text-gray-400 text-center">
          Cliquer sur le badge de niveau pour le modifier manuellement
        </p>
      )}
    </div>
  );
}
