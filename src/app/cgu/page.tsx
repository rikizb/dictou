import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation",
  description: "CGU de Dictou — les règles du jeu pour utiliser le service.",
};

export default function CguPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="flex items-center px-6 py-4 max-w-4xl mx-auto border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-purple-700">
          <span>✏️</span>
          <span>Dictou</span>
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12 space-y-8 text-gray-700">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-gray-900">Conditions Générales d&apos;Utilisation</h1>
          <p className="text-sm text-gray-400">Dernière mise à jour : avril 2026</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-gray-800">1. Présentation du service</h2>
          <p>
            Dictou (<strong>www.dictou.com</strong>) est un service d&apos;aide à l&apos;apprentissage
            de l&apos;orthographe pour les enfants du CP au CM2. Il génère des phrases personnalisées
            à partir des mots à apprendre, grâce à l&apos;intelligence artificielle.
          </p>
          <p>
            Le service est édité par <strong>[PRÉNOM NOM]</strong> —{" "}
            <a href="mailto:contact@dictou.com" className="text-purple-600 underline">contact@dictou.com</a>
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-gray-800">2. Accès au service</h2>
          <p>
            Dictou est accessible librement sans compte pour le mode invité (<em>/jouer</em>).
            La création d&apos;un compte est nécessaire pour sauvegarder sa progression, gérer des
            listes de mots et accéder à l&apos;historique.
          </p>
          <p>
            En créant un compte, l&apos;utilisateur certifie être âgé de 15 ans ou plus, ou avoir
            obtenu le consentement d&apos;un titulaire de l&apos;autorité parentale.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-gray-800">3. Compte utilisateur</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>L&apos;utilisateur est responsable de la confidentialité de ses identifiants.</li>
            <li>Un seul compte par personne est autorisé.</li>
            <li>Tout usage frauduleux doit être signalé immédiatement à contact@dictou.com.</li>
            <li>Dictou se réserve le droit de suspendre tout compte en cas d&apos;usage abusif.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-gray-800">4. Listes de mots partagées</h2>
          <p>
            Les utilisateurs peuvent créer des listes de mots et les partager via un lien unique.
            En partageant une liste, l&apos;utilisateur accepte qu&apos;elle soit accessible publiquement
            via ce lien et potentiellement indexable.
          </p>
          <p>
            L&apos;utilisateur reste responsable du contenu des listes qu&apos;il publie. Tout contenu
            inapproprié, offensant ou illégal est interdit et peut entraîner la suppression du compte.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-gray-800">5. Utilisation de l&apos;IA</h2>
          <p>
            Les phrases générées par Dictou sont produites par un modèle d&apos;intelligence artificielle
            (Anthropic Claude). Bien que nous appliquions des filtres de qualité, Dictou ne peut
            garantir l&apos;exactitude absolue de chaque phrase générée.
          </p>
          <p>
            Les mots saisis par l&apos;utilisateur sont transmis à l&apos;API Anthropic pour la génération.
            Aucune donnée personnelle identifiable n&apos;est transmise dans ces requêtes.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-gray-800">6. Disponibilité du service</h2>
          <p>
            Dictou s&apos;efforce d&apos;assurer une disponibilité continue du service mais ne peut garantir
            une disponibilité 24h/24, 7j/7. Des interruptions pour maintenance peuvent survenir
            sans préavis.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-gray-800">7. Propriété intellectuelle</h2>
          <p>
            Le service, son code, son design et sa marque sont la propriété de Dictou.
            Les contenus générés (phrases) sont mis à disposition de l&apos;utilisateur pour un usage
            strictement personnel et non commercial.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-gray-800">8. Limitation de responsabilité</h2>
          <p>
            Dictou est un outil d&apos;aide pédagogique et ne se substitue pas à un enseignant.
            Les résultats affichés (taux de réussite, historique) sont indicatifs.
            Dictou ne peut être tenu responsable des décisions prises sur la base de ces données.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-gray-800">9. Modifications des CGU</h2>
          <p>
            Dictou se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs
            seront informés par email en cas de changement substantiel. La poursuite de l&apos;utilisation
            du service vaut acceptation des nouvelles CGU.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-gray-800">10. Droit applicable</h2>
          <p>
            Les présentes CGU sont régies par le droit français. En cas de litige, et après
            tentative de résolution amiable, les tribunaux compétents sont ceux du ressort
            du domicile de l&apos;éditeur.
          </p>
        </section>

        <div className="pt-6 border-t border-gray-100 text-sm text-gray-400 space-x-4">
          <Link href="/" className="hover:text-purple-600 transition">Accueil</Link>
          <span>·</span>
          <Link href="/mentions-legales" className="hover:text-purple-600 transition">Mentions légales</Link>
          <span>·</span>
          <Link href="/confidentialite" className="hover:text-purple-600 transition">Confidentialité</Link>
        </div>
      </main>
    </div>
  );
}
