"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { SignInButton, useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mascot } from "@/components/Mascot";

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
          { "@type": "Question", "name": "Dictou est-il gratuit ?", "acceptedAnswer": { "@type": "Answer", "text": "Oui, Dictou est 100% gratuit et sans inscription pour la dictée rapide. Un compte gratuit permet de sauvegarder la progression." } },
          { "@type": "Question", "name": "Pour quel âge est Dictou ?", "acceptedAnswer": { "@type": "Answer", "text": "Dictou est adapté aux enfants du CP au CM2, soit de 6 à 11 ans." } },
          { "@type": "Question", "name": "Les enseignants peuvent-ils utiliser Dictou ?", "acceptedAnswer": { "@type": "Answer", "text": "Oui ! Les enseignants créent une liste dynamique de mots et partagent le lien à toute leur classe. Les parents voient toujours les mots à jour." } },
          { "@type": "Question", "name": "Faut-il s'inscrire ?", "acceptedAnswer": { "@type": "Answer", "text": "Non, la dictée rapide est accessible sans inscription. L'inscription gratuite permet de sauvegarder ses mots et suivre la progression." } },
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
            className="max-w-lg w-full"
          >
            {/* Mascotte */}
            <div className="flex justify-center mb-4">
              <Mascot size={90} mood="happy" />
            </div>

            {/* Titre */}
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-3 leading-tight tracking-tight">
              Fini les dictées ratées.
              <br />
              <span className="text-purple-600">L'IA s'adapte à SES mots.</span>
            </h1>

            <p className="text-lg text-gray-500 mb-5 leading-relaxed">
              Entre les mots du carnet de dictée, l'IA génère des phrases sur mesure.
              En 2 minutes, sans inscription.
            </p>

            <div className="flex flex-wrap justify-center gap-2 mb-8 text-sm font-semibold">
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full">✅ 100% gratuit</span>
              <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full">⚡ Sans inscription</span>
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full">🔄 Liste dynamique</span>
            </div>

            {/* Dual CTA */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/jouer"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-purple-600 text-white text-lg font-bold rounded-2xl shadow-lg hover:bg-purple-700 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                🎯 Générer une dictée maintenant
              </Link>
              <Link
                href="/listes"
                className="inline-flex items-center justify-center gap-2 px-6 py-4 bg-white text-purple-700 text-base font-semibold rounded-2xl border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50 transition-all shadow-sm"
              >
                🏫 Listes de classes
              </Link>
            </div>

            {/* Enseignant hook */}
            <div className="mt-4 text-sm text-center">
              <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
                <span>🍎</span>
                <span className="text-gray-600">
                  Tu es enseignant ?{" "}
                  <Link href="/sign-up?redirect_url=/dashboard" className="text-purple-600 font-semibold underline underline-offset-2 hover:text-purple-800">
                    Crée ta liste dynamique et partage-la à ta classe →
                  </Link>
                </span>
              </div>
            </div>

            {/* Testimonial */}
            <div className="mt-8 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-left">
              <div className="flex items-center gap-1 mb-2 text-amber-400 text-sm">⭐⭐⭐⭐⭐</div>
              <p className="text-gray-700 text-sm leading-relaxed italic">
                &ldquo;J&apos;ai créé une liste pour ma classe de CE2, partagé le lien sur le groupe WhatsApp parents,
                et le lundi matin les mots étaient bien appris. Fini les dictées du vendredi catastrophiques !&rdquo;
              </p>
              <p className="text-xs text-gray-400 mt-2">— Mme Dupont, institutrice CE2 — Lyon</p>
            </div>

            {/* Comment ça marche */}
            <div className="flex items-center gap-4 mt-10 mb-6">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium uppercase tracking-widest">Comment ça marche</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              {[
                { num: "1", emoji: "📝", title: "Entre les mots", desc: "Les mots du carnet de dictée ou de la liste de classe" },
                { num: "2", emoji: "🤖", title: "L'IA génère", desc: "Une phrase originale adaptée au niveau de l'enfant" },
                { num: "3", emoji: "✅", title: "Tu valides", desc: "L'enfant écrit, tu coches les mots bien orthographiés" },
              ].map((s) => (
                <div key={s.num} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                  <div className="text-2xl mb-2">{s.emoji}</div>
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
    </>
  );
}
