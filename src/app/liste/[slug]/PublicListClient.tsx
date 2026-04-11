"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import { useState } from "react";
import Image from "next/image";

const GUEST_WORDS_KEY = "guest_words";

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

  // S'entraîner immédiatement sans compte : charge les mots dans localStorage
  const handlePracticeNow = () => {
    try {
      const words = list.items.map((i) => ({ text: i.word }));
      localStorage.setItem(GUEST_WORDS_KEY, JSON.stringify(words));
    } catch {
      // ignore si localStorage indisponible
    }
    router.push("/jouer");
  };

  const doSubscribe = async () => {
    setSubscribing(true);
    try {
      const r = await fetch(`/api/public/lists/${list.slug}/copy`, {
        method: "POST",
      });
      if (!r.ok) throw new Error("Erreur");
      const data = await r.json() as { addedCount: number; skippedCount: number };
      toast.success(
        data.addedCount > 0
          ? `${data.addedCount} mot${data.addedCount !== 1 ? "s" : ""} ajouté${data.addedCount !== 1 ? "s" : ""} à votre compte ✓`
          : "Vous êtes déjà abonné à cette liste !"
      );
      router.push("/dashboard");
    } catch {
      toast.error("Erreur lors de l'abonnement");
    } finally {
      setSubscribing(false);
    }
  };

  const handleSaveToAccount = async () => {
    if (!isLoaded) return;
    if (!user) {
      // Stocker le slug pour auto-rejoindre après l'inscription
      try { localStorage.setItem("dictou_pending_join", list.slug); } catch { /* ignore */ }
      router.push(`/sign-up?redirect_url=${encodeURIComponent("/dashboard")}`);
      return;
    }
    await doSubscribe();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex flex-col">
      {/* Header */}
      <header className="flex justify-center items-center px-6 py-5">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-purple-700 font-bold text-xl hover:text-purple-900 transition"
        >
          <Image src="/mascot.png" alt="Dictou" width={32} height={32} />
          <span>Dictou</span>
        </Link>
      </header>

      {/* Contenu principal */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
            {/* Badge liste */}
            <div className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-600 text-xs font-semibold px-3 py-1 rounded-full mb-4">
              📋 Liste de dictée
            </div>

            {/* Titre */}
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              {list.name}
            </h1>
            <p className="text-gray-400 text-sm mb-6">
              {list.items.length} mot{list.items.length !== 1 ? "s" : ""}
              {list.copyCount > 0 && (
                <span className="ml-2">
                  · {list.copyCount} élève{list.copyCount > 1 ? "s" : ""} s'entraîne{list.copyCount > 1 ? "nt" : ""}
                </span>
              )}
            </p>

            {/* Mots en pills */}
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

            {/* CTA principal : pratiquer sans compte */}
            <button
              onClick={handlePracticeNow}
              disabled={list.items.length === 0}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-purple-600 text-white font-bold text-lg rounded-2xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md hover:shadow-lg mb-3"
            >
              🎯 S'entraîner maintenant
            </button>
            <p className="text-center text-xs text-gray-400 mb-5">
              Aucun compte nécessaire
            </p>

            {/* Séparateur */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400">ou</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {/* CTA secondaire : sauvegarder la progression */}
            <button
              onClick={handleSaveToAccount}
              disabled={subscribing || !isLoaded}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white text-purple-700 font-semibold text-sm rounded-xl border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {subscribing ? (
                <span className="animate-spin">⏳</span>
              ) : (
                <span>💾</span>
              )}
              {user
                ? subscribing
                  ? "Ajout en cours…"
                  : "Ajouter à mon compte"
                : "Créer un compte pour sauvegarder ma progression"}
            </button>
            {!user && isLoaded && (
              <p className="text-center text-gray-400 text-xs mt-2">
                Gratuit — moins d'une minute
              </p>
            )}
          </div>
        </div>
      </main>

      <footer className="text-center py-4 text-xs text-gray-400">
        <Link href="/" className="hover:text-purple-600 transition">
          dictou.com
        </Link>
      </footer>
    </div>
  );
}
