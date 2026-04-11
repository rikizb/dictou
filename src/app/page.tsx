"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { SignInButton, useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LandingPage() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace("/dashboard");
    }
  }, [isLoaded, isSignedIn, router]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "name": "Dictou",
        "description": "Application de dictée intelligente pour enfants du CP au CM2. L'IA génère des phrases personnalisées à partir des mots de l'enfant.",
        "url": "https://www.dictou.com",
        "applicationCategory": "EducationalApplication",
        "operatingSystem": "Web, iOS, Android",
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "EUR" },
        "audience": { "@type": "EducationalAudience", "educationalRole": "student", "audienceType": "Enfants 6-11 ans, parents, enseignants primaire" },
        "inLanguage": "fr",
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          { "@type": "Question", "name": "Dictou est-il gratuit ?", "acceptedAnswer": { "@type": "Answer", "text": "Oui, Dictou est 100% gratuit. Un compte gratuit permet de créer et partager des listes de mots dynamiques." } },
          { "@type": "Question", "name": "Les élèves ont-ils besoin d'un compte ?", "acceptedAnswer": { "@type": "Answer", "text": "Non. Les élèves s'entrainent directement via le lien partagé par l'enseignant, sans inscription." } },
          { "@type": "Question", "name": "Comment partager une liste à mes élèves ?", "acceptedAnswer": { "@type": "Answer", "text": "Créez votre liste, copiez le lien et partagez-le sur WhatsApp, par email ou sur l'ENT. Les élèves accèdent immédiatement." } },
        ],
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex flex-col">

        {/* Header */}
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
        <main className="flex-1 flex flex-col items-center justify-center px-6 text-center pb-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-xl w-full"
          >
            {/* Mascotte PNG */}
            <div className="flex justify-center mb-6">
              <Image
                src="/mascot.png"
                alt="Dictou mascotte"
                width={110}
                height={110}
                priority
                className="drop-shadow-md"
              />
            </div>

            {/* Titre */}
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-3 leading-tight tracking-tight">
              La dictée qui<br />
              <span className="text-purple-600">s'adapte à leur niveau.</span>
            </h1>

            <p className="text-lg text-gray-500 mb-8 leading-relaxed max-w-md mx-auto">
              Créez votre liste. Partagez le lien à votre classe.
              <br />L'IA génère les phrases en s'adaptant à la progression de chaque élève.
            </p>

            {/* CTA principal enseignant */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
              <Link
                href="/sign-up?redirect_url=/dashboard?create=list"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-purple-600 text-white text-lg font-bold rounded-2xl shadow-lg hover:bg-purple-700 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                ✏️ Créer ma liste dynamique
              </Link>
              <Link
                href="/jouer"
                className="inline-flex items-center justify-center gap-2 px-6 py-4 bg-white text-purple-700 text-base font-semibold rounded-2xl border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50 transition-all shadow-sm"
              >
                🎯 Dictée rapide
              </Link>
            </div>
            <p className="text-xs text-gray-400 mb-10">Gratuit</p>

            {/* Comment ça marche */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium uppercase tracking-widest">Comment ça marche</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left mb-10">
              {[
                { num: "1", emoji: "📝", title: "Créez votre liste", desc: "Ajoutez les mots de la semaine en quelques secondes" },
                { num: "2", emoji: "🔗", title: "Partagez le lien", desc: "WhatsApp, SMS, email — un lien unique pour toute la classe" },
                { num: "3", emoji: "🎯", title: "Vos élèves s'entrainent", desc: "L'IA génère des phrases sur-mesure. Chaque enfant progresse à son rythme." },
              ].map((s) => (
                <div key={s.num} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                  <div className="text-2xl mb-2">{s.emoji}</div>
                  <p className="font-semibold text-gray-800 text-sm mb-1">{s.title}</p>
                  <p className="text-xs text-gray-500">{s.desc}</p>
                </div>
              ))}
            </div>

            {/* Testimonial */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-left">
              <div className="flex items-center gap-1 mb-2 text-amber-400 text-sm">⭐⭐⭐⭐⭐</div>
              <p className="text-gray-700 text-sm leading-relaxed italic">
                &ldquo;Chaque semaine j&apos;ajoute 5 nouveaux mots à ma liste, et mes élèves s&apos;entraînent
                directement depuis le lien WhatsApp. La liste se met à jour automatiquement.&rdquo;
              </p>
              <p className="text-xs text-gray-400 mt-2">— Mme Dupont, institutrice CE2 — Lyon</p>
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
    </>
  );
}
