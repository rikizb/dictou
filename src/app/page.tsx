"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { SignInButton, SignUpButton, useUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { Mascot } from "@/components/Mascot";

export default function LandingPage() {
  const { isSignedIn, isLoaded } = useUser();

  if (isLoaded && isSignedIn) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-4">
        <div className="flex items-center gap-2 text-2xl font-bold text-purple-700">
          <span>✏️</span>
          <span>Dictou</span>
        </div>
        <div className="flex gap-3">
          <SignInButton mode="modal">
            <button className="px-4 py-2 text-purple-700 font-medium hover:bg-purple-50 rounded-xl transition">
              Connexion
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="px-4 py-2 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition shadow-sm">
              S'inscrire
            </button>
          </SignUpButton>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center pb-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl"
        >
          <div className="flex justify-center mb-4">
            <Mascot size={140} mood="happy" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4 leading-tight">
            Apprends la dictée{" "}
            <span className="text-purple-600">en t'amusant !</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Des phrases intelligentes générées selon tes mots à apprendre.
            Progresse à ton rythme, gagne des étoiles, deviens champion de dictée !
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <SignUpButton mode="modal">
              <button className="px-8 py-4 bg-purple-600 text-white text-lg font-bold rounded-2xl hover:bg-purple-700 transition shadow-lg hover:shadow-xl hover:scale-105 active:scale-95">
                Commencer gratuitement 🚀
              </button>
            </SignUpButton>
            <SignInButton mode="modal">
              <button className="px-8 py-4 bg-white text-purple-700 text-lg font-bold rounded-2xl border-2 border-purple-200 hover:border-purple-400 transition">
                J'ai déjà un compte
              </button>
            </SignInButton>
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-3xl w-full"
        >
          {[
            {
              emoji: "🧠",
              title: "IA intelligente",
              desc: "Les phrases s'adaptent automatiquement aux mots que tu dois travailler",
            },
            {
              emoji: "⭐",
              title: "Gagne des étoiles",
              desc: "Chaque bonne réponse te rapproche de la maîtrise. Construis ton streak !",
            },
            {
              emoji: "📊",
              title: "Suis tes progrès",
              desc: "Un tableau de bord pour voir ta progression mot par mot",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-sm border border-white"
            >
              <div className="text-4xl mb-3">{f.emoji}</div>
              <h3 className="font-bold text-gray-900 mb-1">{f.title}</h3>
              <p className="text-gray-600 text-sm">{f.desc}</p>
            </div>
          ))}
        </motion.div>
      </main>
    </div>
  );
}
