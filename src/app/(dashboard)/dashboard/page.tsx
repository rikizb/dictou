"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

function displayLevel(level: number): { emoji: string; label: string; color: string } {
  if (level === 0) return { emoji: "🔴", label: "Nouveau", color: "bg-red-100 text-red-700 border-red-200" };
  if (level === 1) return { emoji: "🟠", label: "En cours", color: "bg-orange-100 text-orange-700 border-orange-200" };
  return { emoji: "⭐", label: "Maîtrisé", color: "bg-yellow-100 text-yellow-700 border-yellow-200" };
}

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

interface Subscription {
  listId: string;
  lastSyncedAt: string;
  createdAt: string;
  list: {
    id: string;
    slug: string;
    name: string;
    isPublic: boolean;
    isArchived: boolean;
    itemCount: number;
    ownerClerkId: string;
  };
}

interface WordListSummary {
  id: string;
  slug: string;
  name: string;
  isPublic: boolean;
  isArchived: boolean;
  copyCount: number;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

function successRate(word: Word): string {
  if (word.timesSeenInSentence === 0) return "—";
  return `${Math.round((word.timesCorrect / word.timesSeenInSentence) * 100)}%`;
}

function extractSlug(input: string): string {
  // Accepte : https://dictou.com/liste/mon-slug, /liste/mon-slug, ou juste mon-slug
  const match = input.match(/\/liste\/([^/?#\s]+)/);
  if (match) return match[1].trim();
  return input.trim();
}

const LEVEL_KEY = "dictou_level";
type Level = "cp" | "ce1" | "ce2" | "cm1" | "cm2";
const LEVEL_OPTIONS: { key: Level; label: string }[] = [
  { key: "cp", label: "CP" },
  { key: "ce1", label: "CE1" },
  { key: "ce2", label: "CE2" },
  { key: "cm1", label: "CM1" },
  { key: "cm2", label: "CM2" },
];

export default function DashboardPage() {
  const router = useRouter();

  // Level persisté
  const [level, setLevel] = useState<Level>("cp");
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(LEVEL_KEY) : null;
    if (saved) setLevel(saved as Level);
  }, []);
  const handleLevelSelect = (l: Level) => {
    setLevel(l);
    localStorage.setItem(LEVEL_KEY, l);
  };

  // Words
  const [words, setWords] = useState<Word[]>([]);
  const [wordsLoading, setWordsLoading] = useState(true);
  const [wordFilter, setWordFilter] = useState<"all" | "0" | "1" | "2">("all");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Subscriptions
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  // My lists
  const [myLists, setMyLists] = useState<WordListSummary[]>([]);
  const [listsLoading, setListsLoading] = useState(true);
  const [showNewListForm, setShowNewListForm] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListWords, setNewListWords] = useState("");
  const [creatingList, setCreatingList] = useState(false);

  // Subscribe by link
  const [linkInput, setLinkInput] = useState("");
  const [linkSubscribing, setLinkSubscribing] = useState(false);

  // ─── Load data ─────────────────────────────────────────────

  const loadWords = useCallback(async () => {
    const r = await fetch("/api/words");
    const data = await r.json();
    setWords(data.words || []);
    setWordsLoading(false);
  }, []);

  const loadSubscriptions = useCallback(async () => {
    const r = await fetch("/api/subscriptions");
    if (r.ok) {
      const data = await r.json();
      setSubscriptions(data.subscriptions || []);
    }
  }, []);

  const loadMyLists = useCallback(async () => {
    const r = await fetch("/api/lists");
    if (r.ok) {
      const data = await r.json();
      setMyLists(data.lists || []);
    }
    setListsLoading(false);
  }, []);

  // Ouvrir le formulaire si ?create=list
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("create") === "list") {
        setShowNewListForm(true);
        router.replace("/dashboard");
      }
    }
  }, [router]);

  useEffect(() => {
    // Import mots guest depuis /jouer
    const guestRaw = typeof window !== "undefined" ? localStorage.getItem("guest_words") : null;
    if (guestRaw) {
      try {
        const guestWords: { text: string }[] = JSON.parse(guestRaw);
        if (guestWords.length > 0) {
          const texts = guestWords.map((w) => w.text);
          fetch("/api/words/bulk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ words: texts }),
          })
            .then((r) => r.json())
            .then((data) => {
              if (data.addedCount > 0) {
                toast.success(`✨ ${data.addedCount} mot${data.addedCount > 1 ? "s" : ""} importés depuis ta session !`);
                loadWords();
              }
              localStorage.removeItem("guest_words");
            })
            .catch(() => localStorage.removeItem("guest_words"));
        } else {
          localStorage.removeItem("guest_words");
        }
      } catch {
        localStorage.removeItem("guest_words");
      }
    }

    loadWords();
    loadSubscriptions();
    loadMyLists();

    // Sync silencieux
    fetch("/api/sync", { method: "POST" })
      .then((r) => r.json())
      .then((data) => {
        if (data.addedCount > 0) {
          toast.success(`🔄 ${data.addedCount} nouveau${data.addedCount > 1 ? "x mots" : " mot"} depuis tes listes !`);
          loadWords();
        }
      })
      .catch(() => {});
  }, [loadWords, loadSubscriptions, loadMyLists]);

  useEffect(() => {
    return () => { if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current); };
  }, []);

  // ─── Handlers mots ─────────────────────────────────────────

  const handleLevelChange = useCallback(async (wordId: string, currentLevel: number) => {
    const newLevel = currentLevel >= 2 ? 0 : currentLevel + 1;
    setWords((prev) => prev.map((w) => w.id === wordId ? { ...w, level: newLevel } : w));
    try {
      const r = await fetch(`/api/words/${wordId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level: newLevel }),
      });
      if (!r.ok) throw new Error();
    } catch {
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

  // ─── Handlers listes ───────────────────────────────────────

  const handleUnsubscribe = async (listId: string, listName: string) => {
    if (!confirm(`Se désabonner de "${listName}" ?`)) return;
    try {
      const r = await fetch(`/api/subscriptions/${listId}`, { method: "DELETE" });
      if (!r.ok) throw new Error();
      toast.success(`Désabonné de "${listName}"`);
      await loadSubscriptions();
    } catch {
      toast.error("Erreur lors du désabonnement");
    }
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) return;
    setCreatingList(true);
    try {
      const words = newListWords.split(/[,;\n]+/).map((w) => w.trim()).filter((w) => w.length > 0);
      const r = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newListName.trim(), words }),
      });
      if (!r.ok) {
        const err = await r.json();
        throw new Error(err.error || "Erreur");
      }
      const data = await r.json();
      toast.success(`Liste "${data.list.name}" créée !`);
      setNewListName("");
      setNewListWords("");
      setShowNewListForm(false);
      router.push(`/listes/${data.list.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la création");
    } finally {
      setCreatingList(false);
    }
  };

  const handleSubscribeByLink = async () => {
    const slug = extractSlug(linkInput);
    if (!slug) { toast.error("Lien invalide"); return; }
    setLinkSubscribing(true);
    try {
      const r = await fetch(`/api/public/lists/${slug}/copy`, { method: "POST" });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Liste introuvable");
      toast.success(`Abonné ! ${data.addedCount} mot${data.addedCount !== 1 ? "s" : ""} ajouté${data.addedCount !== 1 ? "s" : ""}.`);
      setLinkInput("");
      await loadSubscriptions();
      await loadWords();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lien invalide ou liste introuvable");
    } finally {
      setLinkSubscribing(false);
    }
  };

  const copyListLink = (slug: string) => {
    navigator.clipboard.writeText(`https://www.dictou.com/liste/${slug}`);
    toast.success("Lien copié ! Envoyez-le à vos élèves 🔗");
  };

  // ─── Computed ──────────────────────────────────────────────

  const wordCounts = {
    all: words.length,
    "0": words.filter((w) => w.level === 0).length,
    "1": words.filter((w) => w.level === 1).length,
    "2": words.filter((w) => w.level >= 2).length,
  };

  const filteredWords =
    wordFilter === "all" ? words :
    wordFilter === "2" ? words.filter((w) => w.level >= 2) :
    words.filter((w) => w.level.toString() === wordFilter);

  const hasNoLists = myLists.length === 0 && subscriptions.length === 0;

  // ─── Render ────────────────────────────────────────────────

  return (
    <div className="space-y-8">

      {/* ══ 1. HERO ══ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-600 to-indigo-500 rounded-3xl p-6 sm:p-8 text-white shadow-lg"
      >
        <p className="text-purple-200 text-sm font-medium uppercase tracking-widest mb-1">Dictou</p>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-snug">
          {words.length === 0
            ? "Prêt à lancer la première dictée ?"
            : `${words.length} mot${words.length > 1 ? "s" : ""} à travailler`}
        </h1>

        {words.length > 0 && (
          <div className="flex flex-wrap gap-3 mt-3 text-sm font-medium">
            {wordCounts["2"] > 0 && (
              <span className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1">
                <span>⭐</span><span>{wordCounts["2"]} maîtrisé{wordCounts["2"] > 1 ? "s" : ""}</span>
              </span>
            )}
            {wordCounts["1"] > 0 && (
              <span className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1">
                <span>🟠</span><span>{wordCounts["1"]} en cours</span>
              </span>
            )}
            {wordCounts["0"] > 0 && (
              <span className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1">
                <span>🔴</span><span>{wordCounts["0"]} nouveau{wordCounts["0"] > 1 ? "x" : ""}</span>
              </span>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 mt-5">
          <div className="flex items-center gap-2 bg-white/20 rounded-xl px-3 py-2">
            <span className="text-xs text-purple-200 font-medium">Niveau</span>
            <select
              value={level}
              onChange={(e) => handleLevelSelect(e.target.value as Level)}
              className="bg-transparent text-white text-sm font-semibold focus:outline-none cursor-pointer"
            >
              {LEVEL_OPTIONS.map(({ key, label }) => (
                <option key={key} value={key} className="text-gray-800 bg-white">{label}</option>
              ))}
            </select>
          </div>
          <Link
            href="/practice"
            className="inline-block px-6 py-3 bg-white text-purple-700 font-bold rounded-xl hover:scale-105 transition shadow-md"
          >
            🎯 Lancer une dictée
          </Link>
        </div>
      </motion.div>

      {/* ══ 2. MES LISTES (fusionné) ══ */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-3"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-gray-900">📋 Mes listes</h2>
          <button
            onClick={() => setShowNewListForm(v => !v)}
            className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition shadow-sm text-sm"
          >
            + Créer ma liste
          </button>
        </div>

        {/* Formulaire création */}
        <AnimatePresence>
          {showNewListForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-5 space-y-4">
                <h3 className="font-semibold text-gray-800">Nouvelle liste partageable</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom <span className="text-red-500">*</span>
                  </label>
                  <input
                    autoFocus
                    type="text"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    maxLength={60}
                    placeholder="Ex : CP-A 2025-26 Mme Dupont"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                    onKeyDown={(e) => { if (e.key === "Enter" && e.metaKey) handleCreateList(); }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mots <span className="text-gray-400">(séparés par des virgules ou retour à la ligne)</span>
                  </label>
                  <textarea
                    value={newListWords}
                    onChange={(e) => setNewListWords(e.target.value)}
                    placeholder="grenouille, papillon, anniversaire..."
                    rows={2}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleCreateList}
                    disabled={creatingList || !newListName.trim()}
                    className="px-5 py-2 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
                  >
                    {creatingList ? "Création…" : "Créer"}
                  </button>
                  <button
                    onClick={() => { setShowNewListForm(false); setNewListName(""); setNewListWords(""); }}
                    className="px-5 py-2 text-gray-600 font-medium rounded-xl hover:bg-gray-100 transition text-sm"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rejoindre par lien */}
        <div className="flex gap-2">
          <input
            type="text"
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSubscribeByLink(); }}
            placeholder="Coller un lien de liste pour la rejoindre…"
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white"
          />
          <button
            onClick={handleSubscribeByLink}
            disabled={linkSubscribing || !linkInput.trim()}
            className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:border-purple-400 hover:text-purple-700 disabled:opacity-50 transition text-sm shrink-0"
          >
            {linkSubscribing ? "⏳" : "Rejoindre"}
          </button>
        </div>

        {/* État vide */}
        {!listsLoading && hasNoLists && (
          <div className="bg-white rounded-2xl border-2 border-dashed border-purple-200 p-8 text-center space-y-3">
            <div className="text-4xl">📋</div>
            <p className="text-gray-700 font-semibold">Pas encore de liste</p>
            <p className="text-sm text-gray-500">Créez votre première liste et partagez-la à votre classe, ou collez un lien ci-dessus pour rejoindre une liste existante.</p>
          </div>
        )}

        {/* Mes listes créées */}
        {myLists.length > 0 && (
          <div className="space-y-2">
            {subscriptions.length > 0 && (
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">Créées par moi</p>
            )}
            {listsLoading
              ? [...Array(2)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-16 animate-pulse" />)
              : myLists.map((list) => (
                <div key={list.id} className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-lg shrink-0">📝</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">{list.name}</p>
                    <p className="text-xs text-gray-400">{list.itemCount} mot{list.itemCount !== 1 ? "s" : ""}{list.copyCount > 0 ? ` · ${list.copyCount} abonné${list.copyCount > 1 ? "s" : ""}` : ""}</p>
                  </div>
                  <Link
                    href={`/listes/${list.id}`}
                    className="shrink-0 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition"
                  >
                    Modifier
                  </Link>
                  <button
                    onClick={() => copyListLink(list.slug)}
                    title="Copier le lien de partage"
                    className="shrink-0 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition"
                  >
                    🔗 Lien
                  </button>
                </div>
              ))
            }
          </div>
        )}

        {/* Listes rejointes */}
        {subscriptions.length > 0 && (
          <div className="space-y-2">
            {myLists.length > 0 && (
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 pt-1">Rejointes</p>
            )}
            {subscriptions.map((sub) => (
              <div key={sub.listId} className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-lg shrink-0">📋</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm truncate">{sub.list.name}</p>
                  <p className="text-xs text-gray-400">{sub.list.itemCount} mot{sub.list.itemCount !== 1 ? "s" : ""}</p>
                </div>
                <span className="shrink-0 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-lg">
                  Abonné ✓
                </span>
                <button
                  onClick={() => copyListLink(sub.list.slug)}
                  title="Copier le lien"
                  className="shrink-0 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition"
                >
                  🔗 Lien
                </button>
                <button
                  onClick={() => handleUnsubscribe(sub.listId, sub.list.name)}
                  className="px-2 py-1 text-xs text-gray-300 hover:text-red-400 rounded-lg transition shrink-0"
                  title="Se désabonner"
                >✕</button>
              </div>
            ))}
          </div>
        )}
      </motion.section>

      {/* ══ 3. MES MOTS (lecture seule) ══ */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <h2 className="text-lg font-bold text-gray-900">📚 Mes mots ({words.length})</h2>

        {/* Filtres */}
        <div className="flex gap-2 flex-wrap">
          {([
            { key: "all", label: "Tous", emoji: "📋" },
            { key: "0", label: "Nouveaux", emoji: "🔴" },
            { key: "1", label: "En cours", emoji: "🟠" },
            { key: "2", label: "Maîtrisés", emoji: "⭐" },
          ] as const).map(({ key, label, emoji }) => (
            <button
              key={key}
              onClick={() => setWordFilter(key)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                wordFilter === key ? "bg-purple-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:border-purple-300"
              }`}
            >
              {emoji} {label} ({wordCounts[key]})
            </button>
          ))}
        </div>

        {/* Liste */}
        {wordsLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => <div key={i} className="bg-white rounded-xl h-12 animate-pulse" />)}
          </div>
        ) : filteredWords.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100">
            <div className="text-4xl mb-2">📭</div>
            <p className="font-medium text-sm">
              {words.length === 0
                ? "Aucun mot pour l'instant. Abonnez-vous à une liste ci-dessus."
                : "Aucun mot dans cette catégorie."}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 border-b border-gray-100 bg-gray-50 text-xs font-medium text-gray-400">
              <span className="flex-1">Mot</span>
              <span className="w-24 text-center">Niveau</span>
              <span className="w-14 text-right">Réussite</span>
              <span className="w-10" />
            </div>
            <ul>
              <AnimatePresence initial={false}>
                {filteredWords.map((word) => {
                  const isPending = pendingDeleteId === word.id;
                  return (
                    <motion.li
                      key={word.id}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20, transition: { duration: 0.2 } }}
                      className={`group flex items-center gap-2 px-3 py-3 border-b border-gray-100 last:border-0 transition-colors ${
                        isPending ? "bg-red-50" : "hover:bg-gray-50"
                      }`}
                    >
                      <span className="flex-1 font-semibold text-gray-800 capitalize text-sm truncate min-w-0">
                        {word.text}
                      </span>
                      <button
                        onClick={() => handleLevelChange(word.id, word.level)}
                        title="Cliquer pour changer le niveau"
                        className={`hidden sm:inline-flex w-24 shrink-0 items-center justify-center text-xs px-2 py-0.5 rounded-full border font-medium transition hover:opacity-75 active:scale-95 ${displayLevel(word.level).color}`}
                      >
                        {displayLevel(word.level).emoji} {displayLevel(word.level).label}
                      </button>
                      <button
                        onClick={() => handleLevelChange(word.id, word.level)}
                        className="sm:hidden text-base shrink-0 active:scale-90 transition"
                        title={`Niveau: ${displayLevel(word.level).label}`}
                      >
                        {displayLevel(word.level).emoji}
                      </button>
                      <span className="w-12 sm:w-14 text-right text-xs text-gray-500 shrink-0">
                        {successRate(word)}
                      </span>
                      <div className="w-auto shrink-0 flex items-center gap-1">
                        {isPending ? (
                          <>
                            <button onClick={handleDeleteCancel} className="text-gray-500 text-xs underline px-1 py-1 hover:text-gray-700 transition">
                              Annuler
                            </button>
                            <button onClick={() => handleDeleteConfirm(word.id, word.text)} className="bg-red-500 text-white text-xs px-3 py-1 rounded-lg hover:bg-red-600 transition font-medium">
                              Supprimer
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleDeleteRequest(word.id)}
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
                })}
              </AnimatePresence>
            </ul>
          </div>
        )}
        {words.length > 0 && (
          <p className="text-xs text-gray-400 text-center">Cliquer sur le badge de niveau pour le modifier</p>
        )}
      </motion.section>

    </div>
  );
}
