import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description: "Comment Dictou protège les données de vos enfants.",
};

export default function ConfidentialitePage() {
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
          <h1 className="text-3xl font-extrabold text-gray-900">Politique de confidentialité</h1>
          <p className="text-sm text-gray-400">Dernière mise à jour : avril 2026</p>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5 text-purple-800">
          <p className="font-semibold mb-1">Notre engagement en une phrase</p>
          <p className="text-sm">
            Dictou est conçu pour les enfants. Nous collectons le strict minimum, nous ne vendons
            aucune donnée, et vous pouvez supprimer votre compte à tout moment.
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-gray-800">1. Qui sommes-nous ?</h2>
          <p>
            Dictou (<strong>www.dictou.com</strong>) est un service d&apos;aide à la dictée pour enfants
            édité par <strong>Aymeric Bérenger (Les Evabres SAS)</strong>. En cas de questions relatives à vos données :{" "}
            <a href="mailto:contact@dictou.com" className="text-purple-600 underline">contact@dictou.com</a>
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-gray-800">2. Données collectées</h2>
          <h3 className="font-semibold text-gray-700">Sans compte (mode invité)</h3>
          <p>
            Aucune donnée personnelle n&apos;est collectée. Les mots saisis et préférences (niveau)
            sont stockés uniquement dans votre navigateur (localStorage) et n&apos;arrivent jamais
            sur nos serveurs.
          </p>
          <h3 className="font-semibold text-gray-700 mt-3">Avec un compte</h3>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li><strong>Email :</strong> pour la connexion (géré par Clerk)</li>
            <li><strong>Mots à apprendre :</strong> pour générer les dictées personnalisées</li>
            <li><strong>Historique des sessions :</strong> nb de phrases, taux de réussite par mot</li>
            <li><strong>Listes partagées :</strong> nom de la liste, mots, abonnements</li>
          </ul>
          <p className="text-sm text-gray-500 mt-2">
            Nous ne collectons pas de données sur les enfants eux-mêmes (prénom, âge, école).
            Le compte appartient au parent ou à l&apos;enseignant.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-gray-800">3. Pourquoi ces données ?</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-3 border border-gray-200 font-semibold">Donnée</th>
                  <th className="text-left p-3 border border-gray-200 font-semibold">Pourquoi</th>
                  <th className="text-left p-3 border border-gray-200 font-semibold">Base légale</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Email", "Authentification", "Contrat (service)"],
                  ["Mots à apprendre", "Génération des phrases IA", "Contrat (service)"],
                  ["Historique sessions", "Suivi de progression", "Intérêt légitime"],
                  ["Listes partagées", "Fonctionnalité collaborative", "Consentement"],
                ].map(([d, p, b]) => (
                  <tr key={d}>
                    <td className="p-3 border border-gray-200">{d}</td>
                    <td className="p-3 border border-gray-200">{p}</td>
                    <td className="p-3 border border-gray-200 text-gray-500">{b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-gray-800">4. Sous-traitants</h2>
          <div className="space-y-2 text-sm">
            {[
              { name: "Clerk", role: "Authentification (email, Google OAuth)", country: "🇺🇸 USA", link: "https://clerk.com/privacy" },
              { name: "Vercel", role: "Hébergement du site", country: "🇺🇸 USA", link: "https://vercel.com/legal/privacy-policy" },
              { name: "Anthropic", role: "Génération de phrases par IA (aucune donnée perso transmise)", country: "🇺🇸 USA", link: "https://www.anthropic.com/privacy" },
              { name: "Neon / Supabase", role: "Base de données", country: "🇺🇸 USA", link: "#" },
            ].map((s) => (
              <div key={s.name} className="flex justify-between items-start bg-gray-50 rounded-xl p-3">
                <div>
                  <span className="font-semibold">{s.name}</span>
                  <span className="text-gray-500 ml-2">{s.country}</span>
                  <p className="text-gray-500">{s.role}</p>
                </div>
                <a href={s.link} className="text-purple-600 text-xs underline shrink-0 mt-1" target="_blank" rel="noopener noreferrer">
                  Politique
                </a>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500">
            Ces transferts hors UE sont encadrés par les clauses contractuelles types de la
            Commission Européenne (RGPD Art. 46).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-gray-800">5. Durée de conservation</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>Données de compte : jusqu&apos;à suppression du compte</li>
            <li>Historique de sessions : 12 mois glissants</li>
            <li>Données de connexion (logs) : 30 jours</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-gray-800">6. Vos droits (RGPD)</h2>
          <p>Conformément au RGPD, vous disposez des droits suivants :</p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li><strong>Accès :</strong> obtenir une copie de vos données</li>
            <li><strong>Rectification :</strong> corriger des informations inexactes</li>
            <li><strong>Suppression :</strong> effacer votre compte et toutes vos données</li>
            <li><strong>Portabilité :</strong> recevoir vos données dans un format structuré</li>
            <li><strong>Opposition :</strong> vous opposer au traitement pour intérêt légitime</li>
          </ul>
          <p className="text-sm">
            Pour exercer ces droits :{" "}
            <a href="mailto:contact@dictou.com" className="text-purple-600 underline">contact@dictou.com</a>.
            Vous pouvez également introduire une réclamation auprès de la{" "}
            <a href="https://www.cnil.fr" className="text-purple-600 underline" target="_blank" rel="noopener noreferrer">CNIL</a>.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-gray-800">7. Enfants &amp; mineurs</h2>
          <p className="text-sm">
            Dictou s&apos;adresse aux parents et enseignants, pas directement aux enfants. Conformément
            à la loi française, les mineurs de moins de 15 ans ne peuvent pas créer de compte sans
            le consentement d&apos;un titulaire de l&apos;autorité parentale. En créant un compte, vous
            confirmez être majeur ou avoir obtenu ce consentement.
          </p>
        </section>

        <div className="pt-6 border-t border-gray-100 text-sm text-gray-400 space-x-4">
          <Link href="/" className="hover:text-purple-600 transition">Accueil</Link>
          <span>·</span>
          <Link href="/mentions-legales" className="hover:text-purple-600 transition">Mentions légales</Link>
          <span>·</span>
          <Link href="/cgu" className="hover:text-purple-600 transition">CGU</Link>
        </div>
      </main>
    </div>
  );
}
