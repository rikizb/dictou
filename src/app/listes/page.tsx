"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

interface PublicList {
  id: string;
  slug: string;
  name: string;
  itemCount: number;
  copyCount: number;
}

export default function ListesPage() {
  const [query, setQuery] = useState("");
  const [lists, setLists] = useState<PublicList[]>([]);
  const [loading, setLoading] = useState(true);

  const search = async (q: string) => {
    setLoading(true);
    try {
      const r = await fetch(`/api/public/lists/search?q=${encodeURIComponent(q)}`);
      const data = await r.json();
      setLists(data.lists || []);
    } catch {
      setLists([]);
    } finally {
      setLoading(false);
    }
  };

  // Charger les listes populaires au montage
  useEffect(() => {
    search("");
  }, []);

  // Debounce la recherche
  useEffect(() => {
    const t = setTimeout(() => search(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-4 bg-white/80 backdrop-blur border-b border-white/60">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-purple-700">
          <span>✏️</span>
          <span>Dictou</span>
        </Link>
        <Link
          href="/sign-up?redirect_url=/dashboard"
          className="px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-xl hover:bg-purple-700 transition shadow-sm"
        >
          Créer mon compte →
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center px-4 py-10 pb-8">
        <div className="w-full max-w-lg space-y-6">
          {/* Titre */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-2"
          >
            <h1 className="text-3xl font-extrabold text-gray-900">🏫 Listes de la communauté</h1>
            <p className="text-gray-500">
              Rejoins la liste de ta classe ou explore les listes partagées par d&apos;autres profs et parents.
            </p>
          </motion.div>

          {/* Barre de recherche */}
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une liste (ex: CE1, Maîtresse Dupont…)"
              className="w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white shadow-sm"
              autoFocus
            />
          </div>

          {/* Résultats */}
          {loading ? (
            <div className="flex justify-center py-12 text-gray-400">
              <div className="text-4xl animate-bounce">✏️</div>
            </div>
          ) : lists.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <p className="text-2xl">😕</p>
              <p className="text-gray-500 font-medium">Aucune liste trouvée pour &quot;{query}&quot;</p>
              <p className="text-sm text-gray-400">
                Essaie avec le nom de ta classe ou du professeur.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {!query && (
                <p className="text-xs text-gray-400 text-center uppercase tracking-wide font-semibold">
                  🔥 Les plus populaires
                </p>
              )}
              {lists.map((list) => (
                <motion.div
                  key={list.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Link
                    href={`/liste/${list.slug}`}
                    className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:border-purple-300 hover:shadow-md transition group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-lg">
                        📋
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 group-hover:text-purple-700 transition">
                          {list.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {list.itemCount} mot{list.itemCount > 1 ? "s" : ""} · utilisée {list.copyCount} fois
                        </p>
                      </div>
                    </div>
                    <span className="text-purple-400 font-bold group-hover:translate-x-1 transition-transform">→</span>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

          {/* CTA créer sa liste */}
          <div className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl p-5 text-white text-center space-y-3">
            <p className="font-semibold">Tu es enseignant ou parent ?</p>
            <p className="text-sm text-purple-100">Crée ta liste et partage-la à ta classe en 1 clic.</p>
            <Link
              href="/sign-up?redirect_url=/dashboard"
              className="inline-block px-6 py-2.5 bg-white text-purple-700 font-bold text-sm rounded-xl hover:bg-purple-50 transition"
            >
              Créer une liste gratuitement →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
