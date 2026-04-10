import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "À propos de Dictou",
  description: "L'histoire de Dictou — comment une application est née de la frustration d'un parent face aux dictées du soir.",
};

export default function AProposPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <header className="flex justify-between items-center px-6 py-4 max-w-4xl mx-auto">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-purple-700">
          <span>✏️</span>
          <span>Dictou</span>
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12 space-y-10">
        <div className="text-center space-y-3">
          <div className="text-5xl">✏️</div>
          <h1 className="text-4xl font-extrabold text-gray-900">L&apos;histoire de Dictou</h1>
          <p className="text-lg text-gray-500">Une dictée qui ne ressemble à aucune autre.</p>
        </div>

        <div className="prose prose-lg max-w-none space-y-6 text-gray-700 leading-relaxed">
          <p>
            Tout a commencé un soir de semaine. Une liste de mots froissée au fond du cartable,
            un enfant qui n&apos;a pas vraiment envie, et un parent qui improvise des phrases en essayant
            de rendre ça un peu moins ennuyeux. <em>&quot;La grenouille... mange... du chocolat ?&quot;</em>
          </p>

          <p>
            La vraie question ce soir-là n&apos;était pas &quot;comment mémoriser ces mots ?&quot;
            C&apos;était : <strong>pourquoi la dictée est-elle toujours une corvée ?</strong>
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8">Notre conviction</h2>

          <p>
            Les enfants apprennent mieux quand ils sont engagés. Une phrase rigolote, une histoire
            courte qui fait sens — et le mot &quot;chrysanthème&quot; devient soudain mémorable.
            Les enseignants le savent depuis toujours. Dictou leur donne un outil à la hauteur de cette intuition.
          </p>

          <p>
            On a créé Dictou pour que la dictée du soir devienne un moment de complicité plutôt qu&apos;un
            conflit. Pour que les profs puissent partager leurs listes de mots en deux clics.
            Pour que chaque enfant, du CP au CM2, progresse à son rythme avec des phrases taillées
            sur mesure pour lui.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8">Comment ça marche</h2>

          <div className="grid grid-cols-1 gap-4">
            {[
              { num: "1", title: "Les mots de ton enfant", desc: "Tu rentres les mots du carnet de dictée. Ceux de cette semaine, ceux qui posent problème, ceux que l'instit a envoyés." },
              { num: "2", title: "L'IA génère une phrase", desc: "Dictou crée une phrase adaptée au niveau scolaire, naturelle et engageante, qui intègre les mots à apprendre." },
              { num: "3", title: "L'enfant écrit, tu valides", desc: "Il écrit la phrase sur son cahier. Tu coches les mots bien écrits. Simple, rapide, efficace." },
            ].map((s) => (
              <div key={s.num} className="flex gap-4 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div className="w-8 h-8 bg-purple-100 text-purple-700 font-bold rounded-full flex items-center justify-center shrink-0">
                  {s.num}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{s.title}</p>
                  <p className="text-gray-500 text-sm mt-1">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mt-8">Nos valeurs</h2>

          <ul className="space-y-2">
            <li>🎯 <strong>Efficace :</strong> chaque minute compte. Pas de compte requis pour commencer.</li>
            <li>🔒 <strong>Privé :</strong> les données de tes enfants ne sont pas vendues, jamais.</li>
            <li>🆓 <strong>Accessible :</strong> l&apos;essentiel est gratuit, pour tous les enfants.</li>
            <li>🤝 <strong>Collaboratif :</strong> les enseignants peuvent partager leurs listes, les parents s&apos;y abonner.</li>
          </ul>
        </div>

        <div className="bg-purple-600 rounded-3xl p-8 text-white text-center space-y-4">
          <p className="text-xl font-bold">Prêt à rendre la dictée fun ?</p>
          <Link
            href="/jouer"
            className="inline-block px-8 py-3 bg-white text-purple-700 font-bold rounded-xl hover:bg-purple-50 transition"
          >
            🎯 Essayer sans compte
          </Link>
        </div>

        <div className="text-center text-sm text-gray-400 space-x-4">
          <Link href="/mentions-legales" className="hover:text-purple-600 transition">Mentions légales</Link>
          <span>·</span>
          <Link href="/confidentialite" className="hover:text-purple-600 transition">Confidentialité</Link>
          <span>·</span>
          <Link href="/cgu" className="hover:text-purple-600 transition">CGU</Link>
        </div>
      </main>
    </div>
  );
}
