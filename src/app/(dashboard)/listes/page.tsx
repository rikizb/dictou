"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

type MenuState = { id: string; action: "rename" | "menu" } | null;

export default function ListesPage() {
  const router = useRouter();
  const [lists, setLists] = useState<WordListSummary[]>([]);
  const [archivedLists, setArchivedLists] = useState<WordListSummary[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [syncingListId, setSyncingListId] = useState<string | null>(null);

  // Formulaire nouvelle liste
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newWords, setNewWords] = useState("");
  const [creating, setCreating] = useState(false);

  // Menu contextuel
  const [menuState, setMenuState] = useState<MenuState>(null);
  const [renameValue, setRenameValue] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  const loadLists = async () => {
    const [activeRes, archivedRes, subsRes] = await Promise.all([
      fetch("/api/lists"),
      fetch("/api/lists?includeArchived=true"),
      fetch("/api/subscriptions"),
    ]);
    const activeData = await activeRes.json();
    const allData = await archivedRes.json();
    const subsData = subsRes.ok ? await subsRes.json() : { subscriptions: [] };

    const active = (activeData.lists || []) as WordListSummary[];
    const all = (allData.lists || []) as WordListSummary[];
    const archived = all.filter((l) => l.isArchived);

    setLists(active);
    setArchivedLists(archived);
    setSubscriptions(subsData.subscriptions || []);
    setLoading(false);
  };

  useEffect(() => {
    loadLists();
  }, []);

  // Ferme le menu si clic en dehors
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuState(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const words = newWords
        .split(/[,;\n]+/)
        .map((w) => w.trim())
        .filter((w) => w.length > 0);

      const r = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), words }),
      });

      if (!r.ok) {
        const err = await r.json();
        throw new Error(err.error || "Erreur");
      }

      const data = await r.json();
      toast.success(`Liste "${data.list.name}" créée !`);
      setNewName("");
      setNewWords("");
      setShowNewForm(false);
      router.push(`/listes/${data.list.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la création");
    } finally {
      setCreating(false);
    }
  };

  const handleShare = (slug: string) => {
    const url = `${window.location.origin}/liste/${slug}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Lien copié !");
    });
  };

  const handleRenameStart = (list: WordListSummary) => {
    setRenameValue(list.name);
    setMenuState({ id: list.id, action: "rename" });
  };

  const handleRenameSubmit = async (id: string) => {
    if (!renameValue.trim()) return;
    try {
      const r = await fetch(`/api/lists/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: renameValue.trim() }),
      });
      if (!r.ok) throw new Error("Erreur");
      setMenuState(null);
      await loadLists();
      toast.success("Liste renommée !");
    } catch {
      toast.error("Erreur lors du renommage");
    }
  };

  const handleArchive = async (id: string, currentlyArchived: boolean) => {
    try {
      const r = await fetch(`/api/lists/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: !currentlyArchived }),
      });
      if (!r.ok) throw new Error("Erreur");
      setMenuState(null);
      await loadLists();
      toast.success(currentlyArchived ? "Liste restaurée" : "Liste archivée");
    } catch {
      toast.error("Erreur");
    }
  };

  const handleSyncSubscription = async (listId: string) => {
    setSyncingListId(listId);
    try {
      const r = await fetch("/api/sync", { method: "POST" });
      const data = await r.json();
      if (data.addedCount > 0) {
        toast.success(`🔄 ${data.addedCount} nouveau${data.addedCount > 1 ? "x mots" : " mot"} ajouté${data.addedCount > 1 ? "s" : ""} !`);
      } else {
        toast("Tout est à jour ✅", { icon: "🔄" });
      }
      await loadLists();
    } catch {
      toast.error("Erreur lors de la synchronisation");
    } finally {
      setSyncingListId(null);
    }
  };

  const handleUnsubscribe = async (listId: string, listName: string) => {
    if (!confirm(`Se désabonner de "${listName}" ? Les mots déjà copiés restent dans ta liste.`)) return;
    try {
      const r = await fetch(`/api/subscriptions/${listId}`, { method: "DELETE" });
      if (!r.ok) throw new Error();
      toast.success(`Désabonné de "${listName}"`);
      await loadLists();
    } catch {
      toast.error("Erreur lors du désabonnement");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Supprimer définitivement la liste "${name}" ?`)) return;
    try {
      const r = await fetch(`/api/lists/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error("Erreur");
      setMenuState(null);
      await loadLists();
      toast.success(`Liste "${name}" supprimée`);
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  const ListCard = ({ list }: { list: WordListSummary }) => {
    const isMenuOpen = menuState?.id === list.id && menuState.action === "menu";
    const isRenaming = menuState?.id === list.id && menuState.action === "rename";

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition"
      >
        {isRenaming ? (
          <div className="flex gap-2 mb-3">
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRenameSubmit(list.id);
                if (e.key === "Escape") setMenuState(null);
              }}
              maxLength={60}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
            <button
              onClick={() => handleRenameSubmit(list.id)}
              className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-xl hover:bg-purple-700 transition font-medium"
            >
              OK
            </button>
            <button
              onClick={() => setMenuState(null)}
              className="px-3 py-1.5 text-gray-500 text-sm rounded-xl hover:bg-gray-100 transition"
            >
              ×
            </button>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-2 mb-3">
            <Link
              href={`/listes/${list.id}`}
              className="font-semibold text-gray-800 hover:text-purple-700 transition text-base leading-tight flex-1"
            >
              {list.name}
            </Link>
            <div className="relative" ref={isMenuOpen ? menuRef : undefined}>
              <button
                onClick={() =>
                  setMenuState(
                    isMenuOpen ? null : { id: list.id, action: "menu" }
                  )
                }
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition text-lg leading-none"
                aria-label="Options"
              >
                •••
              </button>
              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    className="absolute right-0 top-8 bg-white border border-gray-200 rounded-xl shadow-lg z-10 min-w-36 py-1"
                  >
                    <button
                      onClick={() => handleRenameStart(list)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                    >
                      Renommer
                    </button>
                    <button
                      onClick={() => handleArchive(list.id, list.isArchived)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                    >
                      {list.isArchived ? "Restaurer" : "Archiver"}
                    </button>
                    <hr className="my-1 border-gray-100" />
                    <button
                      onClick={() => handleDelete(list.id, list.name)}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                    >
                      Supprimer
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <span>📝</span>
            {list.itemCount} mot{list.itemCount !== 1 ? "s" : ""}
          </span>
          {list.copyCount > 0 && (
            <span className="flex items-center gap-1 text-purple-600">
              <span>📋</span>
              {list.copyCount} copie{list.copyCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-50">
          <Link
            href={`/listes/${list.id}`}
            className="flex-1 text-center py-1.5 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl transition"
          >
            Gérer
          </Link>
          <button
            onClick={() => handleShare(list.slug)}
            className="flex-1 text-center py-1.5 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition flex items-center justify-center gap-1"
          >
            <span>🔗</span> Partager
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📋 Mes listes</h1>
          <p className="text-gray-500 mt-1">
            Organise tes mots par thème et partage-les
          </p>
        </div>
        <button
          onClick={() => setShowNewForm((v) => !v)}
          className="px-5 py-2.5 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition shadow-sm"
        >
          + Nouvelle liste
        </button>
      </div>

      {/* Formulaire nouvelle liste */}
      <AnimatePresence>
        {showNewForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-6 space-y-4">
              <h2 className="font-semibold text-gray-800">Nouvelle liste</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de la liste <span className="text-red-500">*</span>
                </label>
                <input
                  autoFocus
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  maxLength={60}
                  placeholder="Ex : Mots CE2 difficiles"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.metaKey) handleCreate();
                  }}
                />
                <p className="text-xs text-gray-400 mt-1">
                  {newName.length}/60 caractères
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mots initiaux{" "}
                  <span className="text-gray-400">(optionnel)</span>
                </label>
                <textarea
                  value={newWords}
                  onChange={(e) => setNewWords(e.target.value)}
                  placeholder="grenouille, papillon, anniversaire..."
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Séparés par des virgules ou retours à la ligne
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleCreate}
                  disabled={creating || !newName.trim()}
                  className="px-6 py-2.5 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {creating ? "Création…" : "Créer la liste"}
                </button>
                <button
                  onClick={() => {
                    setShowNewForm(false);
                    setNewName("");
                    setNewWords("");
                  }}
                  className="px-6 py-2.5 text-gray-600 font-medium rounded-xl hover:bg-gray-100 transition"
                >
                  Annuler
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Listes actives */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-36 animate-pulse" />
          ))}
        </div>
      ) : lists.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">📋</div>
          <p className="font-medium">Tu n'as pas encore de liste.</p>
          <p className="text-sm mt-1">
            Clique sur "+ Nouvelle liste" pour commencer !
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {lists.map((list) => (
              <ListCard key={list.id} list={list} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Section Mes abonnements */}
      {subscriptions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-gray-800">🔔 Mes abonnements</h2>
          <p className="text-sm text-gray-500">Listes partagées auxquelles tu es abonné. Les nouveaux mots sont ajoutés automatiquement à ta connexion.</p>
          <div className="space-y-2">
            {subscriptions.map((sub) => (
              <div key={sub.listId} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <a
                    href={`/liste/${sub.list.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-gray-800 hover:text-purple-700 transition truncate block"
                  >
                    {sub.list.name}
                  </a>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {sub.list.itemCount} mot{sub.list.itemCount !== 1 ? "s" : ""} · dernière synchro{" "}
                    {new Date(sub.lastSyncedAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleSyncSubscription(sub.listId)}
                    disabled={syncingListId === sub.listId}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl transition disabled:opacity-50"
                  >
                    <span className={syncingListId === sub.listId ? "animate-spin" : ""}>🔄</span>
                    <span className="hidden sm:inline">Sync</span>
                  </button>
                  <button
                    onClick={() => handleUnsubscribe(sub.listId, sub.list.name)}
                    className="px-3 py-1.5 text-sm text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition"
                    title="Se désabonner"
                  >
                    Se désabonner
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section Archivées */}
      {archivedLists.length > 0 && (
        <div>
          <button
            onClick={() => setShowArchived((v) => !v)}
            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition py-2"
          >
            <span
              className={`transition-transform ${showArchived ? "rotate-90" : ""}`}
            >
              ▶
            </span>
            Archivées ({archivedLists.length})
          </button>
          <AnimatePresence>
            {showArchived && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
                  {archivedLists.map((list) => (
                    <ListCard key={list.id} list={list} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
