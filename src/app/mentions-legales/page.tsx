import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Mentions légales de Dictou",
};

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="flex items-center px-6 py-4 max-w-4xl mx-auto border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-purple-700">
          <span>✏️</span>
          <span>Dictou</span>
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12 space-y-8 text-gray-700">
        <h1 className="text-3xl font-extrabold text-gray-900">Mentions légales</h1>
        <p className="text-sm text-gray-400">Dernière mise à jour : avril 2026</p>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-gray-800">1. Éditeur du site</h2>
          <p>
            Le site <strong>www.dictou.com</strong> est édité par :<br />
            <strong>[PRÉNOM NOM]</strong><br />
            Adresse : <strong>[ADRESSE COMPLÈTE]</strong><br />
            Email : <strong>contact@dictou.com</strong>
          </p>
          <p>
            Directeur de la publication : <strong>[PRÉNOM NOM]</strong>
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-gray-800">2. Hébergement</h2>
          <p>
            Le site est hébergé par :<br />
            <strong>Vercel Inc.</strong><br />
            340 Pine Street, Suite 701, San Francisco, CA 94104, États-Unis<br />
            <a href="https://vercel.com" className="text-purple-600 underline">vercel.com</a>
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-gray-800">3. Propriété intellectuelle</h2>
          <p>
            L&apos;ensemble des contenus présents sur ce site (textes, graphismes, logo, images)
            sont la propriété exclusive de Dictou ou de ses partenaires et sont protégés par
            les lois relatives à la propriété intellectuelle.
          </p>
          <p>
            Toute reproduction, représentation, modification ou exploitation totale ou partielle
            des contenus est interdite sans autorisation préalable écrite.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-gray-800">4. Cookies</h2>
          <p>
            Dictou utilise des cookies techniques nécessaires au fonctionnement du service
            (authentification, préférences de niveau). Aucun cookie publicitaire ou de tracking
            tiers n&apos;est utilisé.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-gray-800">5. Liens hypertextes</h2>
          <p>
            Dictou ne peut être tenu responsable du contenu des sites externes vers lesquels
            des liens sont proposés.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-gray-800">6. Contact</h2>
          <p>
            Pour toute question relative aux mentions légales :{" "}
            <a href="mailto:contact@dictou.com" className="text-purple-600 underline">
              contact@dictou.com
            </a>
          </p>
        </section>

        <div className="pt-6 border-t border-gray-100 text-sm text-gray-400 space-x-4">
          <Link href="/" className="hover:text-purple-600 transition">Accueil</Link>
          <span>·</span>
          <Link href="/confidentialite" className="hover:text-purple-600 transition">Confidentialité</Link>
          <span>·</span>
          <Link href="/cgu" className="hover:text-purple-600 transition">CGU</Link>
        </div>
      </main>
    </div>
  );
}
