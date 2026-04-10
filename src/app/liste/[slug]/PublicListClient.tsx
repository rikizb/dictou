"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import { useState } from "react";

interface PublicListData {
  name: string;
  slug: string;
  copyCount: number;
  items: { id: string; word: string }[];
}

export default function PublicListClient({ list }: { list: PublicListData }) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [subscribing, setSubscribing] = useState(false);

  const handleUseList = async () => {
    if (!isLoaded) return;

    if (!user) {
      // Redirige vers sign-in avec redirect_url
      router.push(
        `/sign-in?redirect_url=${encodeURIComponent(`/liste/${list.slug}`)}`
      );
      return;
    }

    setSubscribing(true);
    try {
      const r = await fetch(`/api/public/lists/${list.slug}/copy`, {
        method: "POST",
      });

      if (!r.ok) throw new Error("Erreur");

      const data = await r.json() as { addedCount: number; skippedCount: number };
      toast.success(
        data.addedCount > 0
          ? `Abonné ! ${data.addedCount} nouveau${data.addedCount !== 1 ? "x" : ""} mot${data.addedCount !== 1 ? "s" : ""} synchronisé${data.addedCount !== 1 ? "s" : ""} ✓`
          : "Déjà abonné à cette liste !"
      );
      router.push("/dashboard");
    } catch {
      toast.error("Erreur lors de l'abonnement");
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Bandeau Dictou */}
      <header className="text-center mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-purple-700 font-bold text-xl hover:text-purple-900 transition"
        >
          <span className="text-2xl">✏️</span>
          <span>Dictou</span>
        </Link>
      </header>

      {/* Contenu principal */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
        {/* Titre */}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          {list.name}
        </h1>
        <p className="text-gray-500 text-sm mb-6">
          {list.items.length} mot{list.items.length !== 1 ? "s" : ""}
          {list.copyCount > 0 && (
            <span className="text-purple-600 ml-2">
              • {list.copyCount} abonné{list.copyCount > 1 ? "s" : ""}
            </span>
          )}
        </p>

        {/* Liste des mots en pills */}
        {list.items.length > 0 ? (
          <div className="flex flex-wrap gap-2 mb-8">
            {list.items.map((item) => (
              <span
                key={item.id}
                className="bg-purple-50 text-purple-800 border border-purple-100 px-3 py-1.5 rounded-full text-sm font-medium capitalize"
              >
                {item.word}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 italic mb-8">Cette liste est vide.</p>
        )}

        {/* CTA */}
        <div className="text-center">
          <button
            onClick={handleUseList}
            disabled={subscribing || !isLoaded}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-purple-600 text-white font-bold text-lg rounded-2xl hover:bg-purple-700 disabled:opacity-60 disabled:cursor-not-allowed transition shadow-md hover:shadow-lg"
          >
            {subscribing ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <span>✨</span>
            )}
            {user
              ? subscribing
                ? "Abonnement en cours…"
                : "Rejoindre cette liste"
              : "Rejoindre cette liste"}
          </button>
          {!user && isLoaded && (
            <p className="text-gray-400 text-sm mt-3">
              Inscription gratuite — moins d'une minute.
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-6 text-gray-400 text-xs">
        <Link href="/" className="hover:text-purple-600 transition">
          dictou.com — dictée IA pour les enfants
        </Link>
      </div>
    </div>
  );
}
