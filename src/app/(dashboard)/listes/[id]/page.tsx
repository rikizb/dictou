"use client";

import { useEffect, useState, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import Link from "next/link";

interface WordListItem {
  id: string;
  word: string;
  position: number;
}

interface WordList {
  id: string;
  slug: string;
  name: string;
  isPublic: boolean;
  isArchived: boolean;
  copyCount: number;
  items: WordListItem[];
}

export default function ListDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [list, setList] = useState<WordList | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Ajout de mots
  const [addInput, setAddInput] = useState("");
  const [adding, setAdding] = useState(false);

  // Édition du nom
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");

  // Partage
  const [showShare, setShowShare] = useState(false);

  const loadList = async () => {
    const r = await fetch(`/api/lists/${id}`);
    if (!r.ok) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    const data = await r.json();
    setList(data.list);
    setLoading(false);
  };

  useEffect(() => {
    loadList();
  }, [id]);

  const handleAddWords = async () => {
    if (!addInput.trim() || !list) return;
    const words = addInput
      .split(/[,;\n]+/)
      .map((w) => w.trim())
      .filter((w) => w.length > 0);

    if (words.length === 0) return;
    setAdding(true);
    try {
      const r = await fetch(`/api/lists/${id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ words }),
      });
      if (!r.ok) throw new Error("Erreur");
      setAddInput("");
      await loadList();
      toast.success(`${words.length} mot${words.length > 1 ? "s" : ""} ajouté${words.length > 1 ? "s" : ""} !`);
    } catch {
      toast.error("Erreur lors de l'ajout");
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteItem = async (itemId: string, word: string) => {
    if (!list) return;
    // Suppression optimiste
    setList((prev) =>
      prev ? { ...prev, items: prev.items.filter((i) => i.id !== itemId) } : prev
    );
    try {
      const r = await fetch(`/api/lists/${id}/items/${itemId}`, {
        method: "DELETE",
      });
      if (!r.ok) throw new Error("Erreur");
    } catch {
      await loadList();
      toast.error("Erreur lors de la suppression");
      return;
    }
    toast.success(`"${word}" retiré de la liste`);
  };

  const handleRenameSubmit = async () => {
    if (!nameValue.trim() || !list) return;
    try {
      const r = await fetch(`/api/lists/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameValue.trim() }),
      });
      if (!r.ok) throw new Error("Erreur");
      setList((prev) => (prev ? { ...prev, name: nameValue.trim() } : prev));
      setEditingName(false);
      toast.success("Nom mis à jour !");
    } catch {
      toast.error("Erreur lors du renommage");
    }
  };

  const handleCopyLink = () => {
    if (!list) return;
    const url = `${window.location.origin}/liste/${list.slug}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Lien copié !");
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-2xl h-16 animate-pulse" />
        <div className="bg-white rounded-2xl h-48 animate-pulse" />
      </div>
    );
  }

  if (notFound || !list) {
    return (
      <div className="text-center py-16 text-gray-400">
        <div className="text-5xl mb-3">📭</div>
        <p className="font-medium">Liste introuvable.</p>
        <Link href="/listes" className="text-purple-600 hover:underline mt-2 inline-block text-sm">
          ← Retour à mes listes
        </Link>
      </div>
    );
  }

  const publicUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/liste/${list.slug}`;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Breadcrumb */}
      <Link
        href="/listes"
        className="text-sm text-gray-500 hover:text-purple-700 transition flex items-center gap-1"
      >
        ← Mes listes
      </Link>

      {/* Titre (éditable) */}
      <div>
        {editingName ? (
          <div className="flex gap-2 items-center">
            <input
              autoFocus
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRenameSubmit();
                if (e.key === "Escape") setEditingName(false);
              }}
              maxLength={60}
              className="flex-1 text-2xl font-bold border-b-2 border-purple-400 bg-transparent focus:outline-none text-gray-900 pb-1"
            />
            <button
              onClick={handleRenameSubmit}
              className="px-4 py-2 bg-purple-600 text-white text-sm rounded-xl hover:bg-purple-700 transition font-medium"
            >
              Sauvegarder
            </button>
            <button
              onClick={() => setEditingName(false)}
              className="px-4 py-2 text-gray-500 text-sm rounded-xl hover:bg-gray-100 transition"
            >
              Annuler
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{list.name}</h1>
            <button
              onClick={() => {
                setNameValue(list.name);
                setEditingName(true);
              }}
              className="text-gray-400 hover:text-purple-600 transition p-1 rounded-lg hover:bg-purple-50"
              title="Renommer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L6.75 6.774a2.75 2.75 0 0 0-.596.892l-.848 2.047a.75.75 0 0 0 .98.98l2.047-.848a2.75 2.75 0 0 0 .892-.596l4.261-4.263a1.75 1.75 0 0 0 0-2.474ZM4.75 13.5c-.69 0-1.25-.56-1.25-1.25v-6.5C3.5 5.06 4.06 4.5 4.75 4.5h3a.75.75 0 0 0 0-1.5h-3A2.75 2.75 0 0 0 2 5.75v6.5A2.75 2.75 0 0 0 4.75 15h6.5A2.75 2.75 0 0 0 14 12.25v-3a.75.75 0 0 0-1.5 0v3c0 .69-.56 1.25-1.25 1.25h-6.5Z" />
              </svg>
            </button>
          </div>
        )}
        <p className="text-gray-500 text-sm mt-1">
          {list.items.length} mot{list.items.length !== 1 ? "s" : ""}
          {list.copyCount > 0 && ` • Copiée ${list.copyCount} fois`}
        </p>
      </div>

      {/* Bouton Partager */}
      <div>
        <button
          onClick={() => setShowShare((v) => !v)}
          className="flex items-center gap-2 px-5 py-2.5 border border-purple-200 text-purple-700 font-semibold rounded-xl hover:bg-purple-50 transition"
        >
          <span>🔗</span> Partager cette liste
        </button>
        <AnimatePresence>
          {showShare && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 bg-purple-50 rounded-2xl border border-purple-100 p-4">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Lien public de ta liste :
                </p>
                <div className="flex gap-2 items-center">
                  <input
                    readOnly
                    value={publicUrl}
                    className="flex-1 text-sm bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none text-gray-600 truncate"
                    onFocus={(e) => e.target.select()}
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-xl hover:bg-purple-700 transition whitespace-nowrap"
                  >
                    Copier le lien
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Accessible sans compte. Les visiteurs peuvent copier tes mots dans leur Dictou.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Ajouter des mots */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-800 mb-3">Ajouter des mots</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <textarea
            value={addInput}
            onChange={(e) => setAddInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.metaKey) handleAddWords();
            }}
            placeholder="grenouille, papillon, anniversaire..."
            rows={2}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none"
          />
          <button
            onClick={handleAddWords}
            disabled={adding || !addInput.trim()}
            className="w-full sm:w-auto px-5 py-2.5 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition sm:self-start"
          >
            {adding ? "Ajout…" : "+ Ajouter"}
          </button>
        </div>
      </div>

      {/* Liste des mots */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {list.items.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="font-medium">Aucun mot dans cette liste.</p>
            <p className="text-sm mt-1">Ajoute des mots ci-dessus.</p>
          </div>
        ) : (
          <ul>
            <AnimatePresence initial={false}>
              {list.items.map((item) => (
                <motion.li
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, transition: { duration: 0.15 } }}
                  className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 group transition"
                >
                  <span className="font-medium text-gray-800 capitalize text-sm">
                    {item.word}
                  </span>
                  <button
                    onClick={() => handleDeleteItem(item.id, item.word)}
                    className="text-gray-300 group-hover:text-gray-400 hover:text-red-400 transition p-1 rounded text-base leading-none font-bold"
                    aria-label={`Retirer "${item.word}"`}
                  >
                    ×
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </div>
  );
}
