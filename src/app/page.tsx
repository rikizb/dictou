"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { SignInButton, useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace("/dashboard");
    }
  }, [isLoaded, isSignedIn, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex flex-col">
      {/* Header minimaliste */}
      <header className="flex justify-between items-center px-6 py-4">
        <div className="flex items-center gap-2 text-xl font-bold text-purple-700">
          <span>✏️</span>
          <span>Dictou</span>
        </div>
        <SignInButton mode="modal">
          <button className="text-sm text-gray-500 hover:text-purple-700 font-medium transition px-3 py-1.5 rounded-lg hover:bg-purple-50">
            Se connecter
          </button>
        </SignInButton>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center pb-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-lg w-full"
        >
          {/* Titre */}
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4 leading-tight tracking-tight">
            La dictée intelligente
            <br />
            <span className="text-purple-600">pour ton enfant</span>
          </h1>

          <p className="text-lg text-gray-500 mb-4 leading-relaxed">
            Des dictées IA à partir des mots de ton enfant.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mb-10 text-sm font-semibold">
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full">✅ 100% gratuit</span>
            <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full">⚡ Sans inscription</span>
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full">🤝 Partageable avec la classe</span>
          </div>

          {/* CTA principal */}
          <Link
            href="/jouer"
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-10 py-5 bg-purple-600 text-white text-xl font-bold rounded-2xl shadow-lg hover:bg-purple-700 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            🎯 Générer une dictée
          </Link>

          <p className="mt-5 text-sm text-gray-400">
            Tu veux rejoindre la liste de ta classe ?{" "}
            <Link href="/listes" className="text-purple-500 underline underline-offset-2 hover:text-purple-700">
              Chercher une liste publique →
            </Link>
          </p>

          {/* Social proof numbers */}
          <div className="grid grid-cols-3 gap-3 mt-10 mb-2">
            {[
              { value: "12 400+", label: "mots appris" },
              { value: "1 830+", label: "dictées générées" },
              { value: "340+", label: "familles actives" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
                <p className="text-2xl font-extrabold text-purple-600">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Séparateur */}
          <div className="flex items-center gap-4 mt-10 mb-8">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium uppercase tracking-widest">Comment ça marche</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            {[
              { num: "1", title: "Ajoute les mots", desc: "Les mots du carnet de dictée de ton enfant" },
              { num: "2", title: "Lis la phrase", desc: "L'IA génère une phrase adaptée au niveau" },
              { num: "3", title: "Coche les bons mots", desc: "Ton enfant écrit, tu valides ce qui est juste" },
            ].map((s) => (
              <div key={s.num} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <div className="w-7 h-7 bg-purple-100 text-purple-700 font-bold text-sm rounded-full flex items-center justify-center mb-3">
                  {s.num}
                </div>
                <p className="font-semibold text-gray-800 text-sm mb-1">{s.title}</p>
                <p className="text-xs text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </main>

      <footer className="text-center py-6 text-xs text-gray-400 space-x-3 border-t border-gray-100">
        <Link href="/a-propos" className="hover:text-purple-600 transition">À propos</Link>
        <span>·</span>
        <Link href="/mentions-legales" className="hover:text-purple-600 transition">Mentions légales</Link>
        <span>·</span>
        <Link href="/confidentialite" className="hover:text-purple-600 transition">Confidentialité</Link>
        <span>·</span>
        <Link href="/cgu" className="hover:text-purple-600 transition">CGU</Link>
        <span>·</span>
        <a href="mailto:contact@dictou.com" className="hover:text-purple-600 transition">Contact</a>
      </footer>
    </div>
  );
}
