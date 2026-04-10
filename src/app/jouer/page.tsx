"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import Link from "next/link";

const GUEST_WORDS_KEY = "guest_words";
const GUEST_PREV_KEY = "guest_prev_sentences";
const LEVEL_KEY = "dictou_level";

type WordState = "pending" | "correct";
type Level = "cp" | "ce1" | "ce2" | "cm1" | "cm2";
type Phase = "setup" | "loading" | "dictating";

interface GuestWord {
  text: string;
}

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

  // Charger les mots et le niveau depuis localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(GUEST_WORDS_KEY);
      if (raw) setGuestWords(JSON.parse(raw));
      const prev = localStorage.getItem(GUEST_PREV_KEY);
      if (prev) setPreviousSentences(JSON.parse(prev));
      const savedLevel = localStorage.getItem(LEVEL_KEY);
      if (savedLevel) setLevel(savedLevel as Level);
    } catch {
      // ignore
    }
  }, []);

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
      const targets = words.slice(0, 3);

      const r = await fetch("/api/sentences/guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ words, level, previousSentences }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Erreur");

      setSentence(data.sentence);
      setTargetWords(targets);
      // Initialiser les états des mots cibles
      const states: Record<string, WordState> = {};
      for (const w of targets) states[w] = "pending";
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

  // Render la phrase avec les mots cibles soulignés
  const renderSentence = () => {
    if (!sentence) return null;
    const targetSet = new Set(targetWords.map(w => w.toLowerCase()));
    const tokens = sentence.split(/(\s+|[,;:!?.«»""''()\-]+)/);
    return tokens.map((token, i) => {
      const clean = token.toLowerCase().replace(/[^a-zàâäéèêëîïôùûüç'-]/g, "");
      if (targetSet.has(clean)) {
        return (
          <span key={i} className="font-semibold text-purple-700 underline decoration-dotted decoration-purple-400 px-0.5">
            {token}
          </span>
        );
      }
      return <span key={i} className="text-gray-700">{token}</span>;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-4 bg-white/80 backdrop-blur border-b border-white/60">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-purple-700">
          <span>✏️</span>
          <span>Dictou</span>
        </Link>
        <Link
          href="/sign-up?redirect_url=/dashboard"
          className="px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-xl hover:bg-purple-700 transition shadow-sm"
        >
          Sauvegarder ma progression →
        </Link>
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
                <h1 className="text-3xl font-bold text-gray-900">🎯 Dictée sans compte</h1>
                <p className="text-gray-500 mt-1">Ajoute tes mots et c'est parti !</p>
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
                  <p className="text-xs text-gray-300 mt-2">
                    <span className="text-purple-500">soulignés</span> = mots de ta liste · <span className="opacity-60">autres</span> = contexte
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
