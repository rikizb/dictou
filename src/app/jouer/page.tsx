"use client";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import Link from "next/link";

const GUEST_WORDS_KEY = "guest_words";
const GUEST_PREV_KEY = "guest_prev_sentences";
const LEVEL_KEY = "dictou_level";

// Grand pool de mots par niveau — 5 tirés aléatoirement à chaque session
const WORD_POOLS: Record<string, string[]> = {
  cp:  [
    "lapin","canard","école","ballon","table","pomme","pain","nuit","lune","fleur",
    "nuage","pluie","verre","fête","porte","ferme","jardin","botte","herbe","carpe",
    "tigre","zèbre","girafe","fraise","cerise","bougie","bouche","oiseau","forêt","route",
  ],
  ce1: [
    "grenouille","papillon","cerise","fontaine","château","rivière","marché","bougie","printemps","chanson",
    "récréation","voisin","couleur","cadeau","campagne","gymnase","piscine","hirondelle","araignée","tonnerre",
    "calendrier","facteur","boulanger","dimanche","épouvantail","escargot","sorcière","fantôme","dinosaure","volcan",
  ],
  ce2: [
    "expédition","naufrage","avalanche","volcan","pirate","sorcière","chevalier","dragon","trésor","désert",
    "tempête","glacier","cascade","grotte","mystère","nébuleuse","labyrinthe","carnaval","archéologue","légende",
    "caravane","phare","naufragé","squelette","pirogue","explorateur","jungle","savane","médaille","tournoi",
  ],
  cm1: [
    "intrépide","équilibre","conquête","révolution","invention","stratégie","expédition","prophétie","illusion","sacrifice",
    "ambition","démocratie","philosophie","attraction","navigation","évolution","civilisation","architecture","astronaute","territoire",
    "migration","renaissance","mystification","cartographie","encyclopédie","perspicacité","téméraire","constellation","résilience","alchimiste",
  ],
  cm2: [
    "persévérance","ambiguïté","réconciliation","métamorphose","prestidigitateur","mélancolie","préjugé","souveraineté","irréversible","perspicacité",
    "accomplissement","bienveillance","circonspection","désillusion","émancipation","flamboyant","incandescent","magnanimité","obsolescence","quintessence",
    "transcendance","vertigineux","indépendance","épanouissement","contemporain","transmutation","enthousiasme","délibération","introspection","paragraphe",
  ],
};

function getDefaultWords(level: string): string[] {
  const pool = WORD_POOLS[level] || WORD_POOLS.cp;
  return [...pool].sort(() => Math.random() - 0.5).slice(0, 5);
}

type WordState = "pending" | "correct";
type Level = "cp" | "ce1" | "ce2" | "cm1" | "cm2";
type Phase = "setup" | "loading" | "dictating";

interface GuestWord {
  text: string;
}

const FUNCTION_WORDS = new Set([
  "le","la","les","de","du","des","un","une","en","au","aux","et","ou","à",
  "son","sa","ses","mon","ma","mes","ton","ta","tes","ce","cet","cette","ces",
  "il","elle","je","tu","on","nous","vous","ils","elles","lui","leur","leurs",
  "qui","que","qu","dont","où","car","ni","si","y","est","sont","a","ont","se",
  "me","te","ne","pas","plus","très","bien","par","sur","sous","dans","avec",
  "pour","lors","dès","chez","vers","sans","avant","après",
]);

const LEVELS: { key: Level; label: string }[] = [
  { key: "cp", label: "CP (6-7 ans)" },
  { key: "ce1", label: "CE1 (7-8 ans)" },
  { key: "ce2", label: "CE2 (8-9 ans)" },
  { key: "cm1", label: "CM1 (9-10 ans)" },
  { key: "cm2", label: "CM2 (10-11 ans)" },
];

export default function JouerPage() {
  const [guestWords, setGuestWords] = useState<GuestWord[]>([]);
  const [wordInput, setWordInput] = useState("");
  const [phase, setPhase] = useState<Phase>("setup");
  const [level, setLevel] = useState<Level>("cp");
  const [sentence, setSentence] = useState<string>("");
  const [targetWords, setTargetWords] = useState<string[]>([]);
  const [wordStates, setWordStates] = useState<Record<string, WordState>>({});
  const [previousSentences, setPreviousSentences] = useState<string[]>([]);
  const [totalDone, setTotalDone] = useState(0);

  const hasAutoStarted = useRef(false);
  const autoStartWords = useRef<GuestWord[] | null>(null);

  // Charger les mots et le niveau depuis localStorage
  useEffect(() => {
    let loadedWords: GuestWord[] = [];
    let loadedLevel: Level = "cp";
    try {
      const raw = localStorage.getItem(GUEST_WORDS_KEY);
      if (raw) loadedWords = JSON.parse(raw);
      const prev = localStorage.getItem(GUEST_PREV_KEY);
      if (prev) setPreviousSentences(JSON.parse(prev));
      const savedLevel = localStorage.getItem(LEVEL_KEY);
      if (savedLevel) loadedLevel = savedLevel as Level;
    } catch {
      // ignore
    }
    setLevel(loadedLevel);
    // Si aucun mot sauvegardé, tirer 5 mots aléatoires du pool du niveau
    if (loadedWords.length === 0) {
      loadedWords = getDefaultWords(loadedLevel).map(text => ({ text }));
    }
    setGuestWords(loadedWords);
    autoStartWords.current = loadedWords;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-lancer dès que les mots sont chargés
  useEffect(() => {
    if (!hasAutoStarted.current && guestWords.length >= 2 && autoStartWords.current !== null) {
      hasAutoStarted.current = true;
      fetchSentence();
    }
  }, [guestWords]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sauvegarder les mots dans localStorage
  useEffect(() => {
    localStorage.setItem(GUEST_WORDS_KEY, JSON.stringify(guestWords));
  }, [guestWords]);

  const addWord = () => {
    const trimmed = wordInput.trim().toLowerCase();
    if (!trimmed) return;
    const newWords = trimmed.split(/[,;\s]+/).map(w => w.trim()).filter(w => w.length > 0);
    const toAdd = newWords.filter(w => !guestWords.some(gw => gw.text === w));
    if (toAdd.length === 0) {
      toast("Ce mot est déjà dans ta liste", { icon: "ℹ️" });
      return;
    }
    setGuestWords(prev => [...prev, ...toAdd.map(text => ({ text }))]);
    setWordInput("");
  };

  const removeWord = (text: string) => {
    setGuestWords(prev => prev.filter(w => w.text !== text));
  };

  const fetchSentence = async () => {
    if (guestWords.length < 2) {
      toast.error("Ajoute au moins 2 mots pour commencer !");
      return;
    }
    setPhase("loading");
    try {
      // Mélanger les mots pour varier
      const shuffled = [...guestWords].sort(() => Math.random() - 0.5);
      const words = shuffled.map(w => w.text);

      const r = await fetch("/api/sentences/guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ words, level, previousSentences }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Erreur");
      const sentenceText: string = data.sentence;

      setSentence(sentenceText);

      // Extraire tous les mots significatifs de la phrase, dans l'ordre
      const tokens = sentenceText.split(/[\s,;:!?.«»""''()\-]+/);
      const seen = new Set<string>();
      const orderedTargets: string[] = [];
      for (const token of tokens) {
        const clean = token.replace(/[^a-zàâäéèêëîïôùûüç'-]/gi, "").toLowerCase();
        if (clean.length >= 3 && !FUNCTION_WORDS.has(clean) && !seen.has(clean)) {
          seen.add(clean);
          // Conserver la casse originale du token
          orderedTargets.push(token.replace(/[^a-zA-ZàâäéèêëîïôùûüçÀÂÄÉÈÊËÎÏÔÙÛÜÇ'-]/g, ""));
        }
      }

      setTargetWords(orderedTargets);
      // Initialiser les états des mots cibles
      const states: Record<string, WordState> = {};
      for (const w of orderedTargets) states[w] = "pending";
      setWordStates(states);
      setPhase("dictating");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Impossible de générer une phrase";
      toast.error(msg);
      setPhase("setup");
    }
  };

  const toggleWord = (word: string) => {
    setWordStates(prev => ({
      ...prev,
      [word]: prev[word] === "pending" ? "correct" : "pending",
    }));
  };

  const continuer = async () => {
    const correct = Object.values(wordStates).filter(s => s === "correct").length;
    const total = targetWords.length;
    if (correct === total && total > 0) {
      toast.success("Parfait ! Tous les mots corrects ! 🌟", { icon: "🎉" });
    } else {
      toast(`${correct}/${total} corrects — Continue ! 💪`, { icon: "📚" });
    }

    const updated = [...previousSentences, sentence].slice(-5);
    setPreviousSentences(updated);
    localStorage.setItem(GUEST_PREV_KEY, JSON.stringify(updated));
    setTotalDone(n => n + 1);
    await fetchSentence();
  };

  const terminer = () => {
    setPhase("setup");
    setSentence("");
    setTargetWords([]);
    setWordStates({});
  };

  const renderSentence = () => {
    if (!sentence) return null;
    return <span className="text-gray-800">{sentence}</span>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-4 bg-white/80 backdrop-blur border-b border-white/60">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-purple-700">
          <span>✏️</span>
          <span>Dictou</span>
        </Link>
        {totalDone >= 1 && (
          <Link
            href="/sign-up?redirect_url=/dashboard"
            className="px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-xl hover:bg-purple-700 transition shadow-sm animate-pulse"
          >
            Sauvegarder mes {totalDone} phrase{totalDone > 1 ? "s" : ""} →
          </Link>
        )}
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 pb-24">
        <div className="w-full max-w-lg">

          {/* SETUP */}
          {phase === "setup" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900">🎯 Dictée rapide</h1>
                <p className="text-gray-500 mt-1">Entre les mots de ton enfant et c'est parti !</p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
                {/* Sélecteur de niveau */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Niveau scolaire</label>
                  <select
                    value={level}
                    onChange={(e) => { setLevel(e.target.value as Level); localStorage.setItem(LEVEL_KEY, e.target.value); }}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white"
                  >
                    {LEVELS.map(({ key, label }) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* Input mots */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tes mots à travailler</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={wordInput}
                      onChange={(e) => setWordInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") addWord(); }}
                      placeholder="grenouille, papillon..."
                      className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                    />
                    <button
                      onClick={addWord}
                      disabled={!wordInput.trim()}
                      className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 disabled:opacity-50 transition text-sm"
                    >
                      Ajouter
                    </button>
                  </div>
                </div>

                {/* Liste des mots */}
                {guestWords.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {guestWords.map((w) => (
                      <span
                        key={w.text}
                        className="flex items-center gap-1 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-full text-sm text-purple-800 font-medium"
                      >
                        {w.text}
                        <button
                          onClick={() => removeWord(w.text)}
                          className="text-purple-400 hover:text-purple-700 transition ml-0.5"
                          aria-label={`Supprimer ${w.text}`}
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {guestWords.length < 2 && (
                  <p className="text-sm text-gray-400 text-center">
                    Ajoute au moins 2 mots pour commencer
                  </p>
                )}

                <button
                  onClick={fetchSentence}
                  disabled={guestWords.length < 2}
                  className="w-full py-4 bg-purple-600 text-white font-bold text-lg rounded-xl hover:bg-purple-700 transition shadow hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                >
                  🚀 Lancer la dictée !
                </button>

                {totalDone > 0 && (
                  <p className="text-center text-sm text-gray-400">
                    {totalDone} phrase{totalDone > 1 ? "s" : ""} faite{totalDone > 1 ? "s" : ""} cette session
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* LOADING */}
          {phase === "loading" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center gap-4 py-20"
            >
              <div className="text-6xl animate-bounce">✏️</div>
              <p className="text-gray-600 text-lg font-medium">Génération de la phrase…</p>
              <p className="text-gray-400 text-sm">Dictou réfléchit 🤔</p>
            </motion.div>
          )}

          {/* DICTATING */}
          {phase === "dictating" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Barre session */}
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Phrase #{totalDone + 1}</span>
                <select value={level} onChange={(e) => { setLevel(e.target.value as Level); localStorage.setItem(LEVEL_KEY, e.target.value); }}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-500 bg-white">
                  {LEVELS.map(({key, label}) => <option key={key} value={key}>{label}</option>)}
                </select>
              </div>

              <div className="bg-white rounded-3xl border border-gray-100 shadow-lg overflow-hidden">
                {/* Phrase */}
                <div className="p-6 border-b border-gray-50">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                    📖 Lis cette phrase à voix haute
                  </p>
                  <p className="text-xl font-medium leading-relaxed">
                    {renderSentence()}
                  </p>
                </div>

                {/* Évaluation */}
                <div className="p-6">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
                    Coche les mots bien écrits
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {targetWords.map((word) => {
                      const state = wordStates[word];
                      return (
                        <motion.button
                          key={word}
                          onClick={() => toggleWord(word)}
                          whileTap={{ scale: 0.9 }}
                          className={`
                            flex items-center gap-1.5 px-3 py-2.5 rounded-xl border-2 font-medium text-sm
                            transition-all duration-150 select-none cursor-pointer
                            ${state === "correct"
                              ? "bg-green-100 border-green-400 text-green-800"
                              : "bg-white border-gray-200 text-gray-700 hover:border-purple-400 hover:bg-purple-50"
                            }
                          `}
                        >
                          <span>{state === "correct" ? "✅" : "⬜"}</span>
                          <span>{word}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-400 mt-3">
                    1 clic = ✅ bien écrit · pas coché = ❌ mal écrit
                  </p>
                </div>

                {/* Actions */}
                <div className="px-6 pb-6 flex gap-3 justify-end">
                  <button
                    onClick={terminer}
                    className="px-4 py-3 text-gray-600 font-medium rounded-xl border border-gray-200 hover:bg-gray-50 transition"
                  >
                    Terminer
                  </button>
                  <button
                    onClick={continuer}
                    className="px-6 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition shadow hover:scale-105"
                  >
                    Continuer →
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Bannière fixe inscription */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-purple-600 to-indigo-500 text-white px-4 py-3 flex items-center justify-between gap-3 shadow-lg z-40">
        <p className="text-sm font-medium">
          💾 Sauvegardez votre progression et accédez à toutes les fonctionnalités !
        </p>
        <Link
          href="/sign-up?redirect_url=/dashboard"
          className="shrink-0 px-4 py-2 bg-white text-purple-700 font-bold text-sm rounded-xl hover:bg-purple-50 transition"
        >
          S'inscrire gratuitement
        </Link>
      </div>
    </div>
  );
}
