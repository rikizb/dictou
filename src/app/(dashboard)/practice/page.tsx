"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import confetti from "canvas-confetti";
import Link from "next/link";
import { levelToEmoji } from "@/lib/scoring";
import { Mascot } from "@/components/Mascot";

const STORAGE_KEY = "dictou_active_session";

type Level = "cp" | "ce1" | "ce2" | "cm1" | "cm2";
type WordState = "pending" | "correct" | "wrong";

interface SentenceWord {
  id: string;
  text: string;
  level: number;
  isTarget: boolean;
}

interface Sentence {
  id: string;
  text: string;
  allWords: SentenceWord[];
}

interface SessionStats {
  totalSentences: number;
  totalWords: number;
  correctWords: number;
  totalXp: number;
}

type Phase = "setup" | "loading" | "dictating" | "finished";

const LEVELS: { key: Level; label: string }[] = [
  { key: "cp", label: "CP" },
  { key: "ce1", label: "CE1" },
  { key: "ce2", label: "CE2" },
  { key: "cm1", label: "CM1" },
  { key: "cm2", label: "CM2" },
];

function loadPersistedSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function PracticePage() {
  const persisted = typeof window !== "undefined" ? loadPersistedSession() : null;

  const [phase, setPhase] = useState<Phase>(persisted?.phase ?? "setup");
  const [level, setLevel] = useState<Level>(persisted?.level ?? "cp");
  const [sessionId, setSessionId] = useState<string | null>(persisted?.sessionId ?? null);
  const [sentence, setSentence] = useState<Sentence | null>(persisted?.sentence ?? null);
  const [wordStates, setWordStates] = useState<Record<string, WordState>>(persisted?.wordStates ?? {});
  const [sessionStats, setSessionStats] = useState<SessionStats>(
    persisted?.sessionStats ?? { totalSentences: 0, totalWords: 0, correctWords: 0, totalXp: 0 }
  );
  const [previousSentences, setPreviousSentences] = useState<string[]>(persisted?.previousSentences ?? []);
  const [mascotMood, setMascotMood] = useState<"happy" | "excited" | "thinking" | "celebrate">("happy");

  // Sauvegarde la session dans localStorage à chaque changement d'état pertinent
  useEffect(() => {
    if (phase === "dictating" && sessionId && sentence) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        phase, level, sessionId, sentence, wordStates, sessionStats, previousSentences,
      }));
    } else if (phase === "setup" || phase === "finished") {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [phase, level, sessionId, sentence, wordStates, sessionStats]);

  const startSession = async () => {
    setPhase("loading");
    try {
      const r = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Erreur");
      setSessionId(data.session.id);
      setPreviousSentences([]);
      await fetchNextSentence(data.session.id, []);
    } catch (e: any) {
      toast.error(e.message || "Erreur lors du démarrage");
      setPhase("setup");
    }
  };

  const fetchNextSentence = async (sid: string, prevSentences?: string[]) => {
    setPhase("loading");
    setMascotMood("thinking");
    const sentencesHistory = prevSentences ?? previousSentences;
    try {
      const r = await fetch("/api/sentences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sid, level, previousSentences: sentencesHistory }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Erreur");

      setSentence(data.sentence);
      // Initialise tous les mots comme "pending"
      const states: Record<string, WordState> = {};
      for (const w of data.sentence.allWords) states[w.id] = "pending";
      setWordStates(states);
      setMascotMood("happy");
      setPhase("dictating");
    } catch (e: any) {
      toast.error(e.message || "Impossible de générer une phrase");
      setPhase(sessionStats.totalSentences > 0 ? "finished" : "setup");
    }
  };

  // 1 clic = ✅ correct, 2e clic = retour à ⬜ (pas cliqué = ❌ au moment de Continuer)
  const toggleWord = (wordId: string) => {
    if (phase !== "dictating") return;
    setWordStates((prev) => {
      const cur = prev[wordId];
      const next: WordState = cur === "pending" ? "correct" : "pending";
      return { ...prev, [wordId]: next };
    });
  };

  // Valide + passe à la phrase suivante en un seul clic
  const continuer = async () => {
    if (!sentence || !sessionId) return;

    // Les mots non cochés (pending) = mal écrits
    const finalStates = { ...wordStates };
    for (const w of sentence.allWords) {
      if (finalStates[w.id] === "pending") finalStates[w.id] = "wrong";
    }

    const results = sentence.allWords.map((w) => ({
      wordId: w.id,
      correct: finalStates[w.id] === "correct",
    }));

    const correct = results.filter((r) => r.correct).length;
    const total = results.length;

    // Feedback immédiat
    if (correct === total && total > 0) {
      setMascotMood("celebrate");
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 },
        colors: ["#a855f7", "#3b82f6", "#22c55e", "#f59e0b", "#ec4899"] });
      toast.success("Parfait ! Tous les mots corrects ! 🌟", { icon: "🎉" });
    } else if (correct >= total * 0.75) {
      setMascotMood("excited");
      toast.success(`Très bien ! ${correct}/${total} corrects 👍`);
    } else {
      setMascotMood("happy");
      toast(`${correct}/${total} corrects — Continue à pratiquer ! 💪`, { icon: "📚" });
    }

    // Appel API en arrière-plan (non bloquant pour le passage à la suite)
    fetch("/api/sentences/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sentenceId: sentence.id, results }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.xpEarned) {
          setSessionStats((prev) => ({
            totalSentences: prev.totalSentences + 1,
            totalWords: prev.totalWords + total,
            correctWords: prev.correctWords + correct,
            totalXp: prev.totalXp + data.xpEarned,
          }));
        }
      })
      .catch(() => {
        // Stats non critiques, on continue quand même
        setSessionStats((prev) => ({
          totalSentences: prev.totalSentences + 1,
          totalWords: prev.totalWords + total,
          correctWords: prev.correctWords + correct,
          totalXp: prev.totalXp,
        }));
      });

    // Ajoute la phrase courante à l'historique (max 5)
    const updatedPrev = [...previousSentences, sentence.text].slice(-5);
    setPreviousSentences(updatedPrev);

    // Phrase suivante immédiatement
    await fetchNextSentence(sessionId, updatedPrev);
  };

  const finishSession = async () => {
    if (sessionId) {
      await fetch("/api/sessions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
    }
    localStorage.removeItem(STORAGE_KEY);
    setPhase("finished");
  };

  // ── Rendu de la phrase avec les mots cibles en surbrillance ──
  const renderSentenceTokens = () => {
    if (!sentence) return null;
    const wordMap = new Map(sentence.allWords.map((w) => [w.text.toLowerCase(), w]));
    const tokens = sentence.text.split(/(\s+|[,;:!?.«»""''()\-]+)/);

    return tokens.map((token, i) => {
      const clean = token.toLowerCase().replace(/[^a-zàâäéèêëîïôùûüç'-]/g, "");
      const wordRef = wordMap.get(clean);

      if (!wordRef) return <span key={i} className="text-gray-700">{token}</span>;

      return (
        <span
          key={i}
          className={`font-semibold px-0.5 rounded transition-colors duration-200 ${
            wordRef.isTarget
              ? "text-purple-700 underline decoration-dotted decoration-purple-400"
              : "text-gray-800"
          }`}
        >
          {token}
        </span>
      );
    });
  };

  // ────────────────────────────────────────────────────────────
  // ÉCRAN SETUP
  // ────────────────────────────────────────────────────────────
  if (phase === "setup") {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Mascot size={80} mood="excited" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">🎯 Nouvelle dictée</h1>
            <p className="text-gray-500 mt-1">Choisis le niveau et c'est parti !</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Niveau scolaire</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as Level)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white"
            >
              <option value="cp">CP (6-7 ans) — phrases courtes</option>
              <option value="ce1">CE1 (7-8 ans) — phrases simples</option>
              <option value="ce2">CE2 (8-9 ans) — phrases moyennes</option>
              <option value="cm1">CM1 (9-10 ans) — phrases longues</option>
              <option value="cm2">CM2 (10-11 ans) — phrases complexes</option>
            </select>
          </div>

          <div className="bg-purple-50 rounded-xl p-4 text-sm text-purple-800">
            <p className="font-semibold mb-1">Comment ça marche :</p>
            <ol className="list-decimal list-inside space-y-1 text-purple-700">
              <li>Une phrase est générée avec tes mots à travailler</li>
              <li>Lis la phrase à voix haute à ton enfant</li>
              <li>Ton enfant écrit la dictée sur papier</li>
              <li>Coche les mots bien écrits ✅ (les autres = ❌)</li>
              <li>Clique sur <strong>Continuer</strong> pour la phrase suivante</li>
            </ol>
          </div>

          <button onClick={startSession}
            className="w-full py-4 bg-purple-600 text-white font-bold text-lg rounded-xl hover:bg-purple-700 transition shadow hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]">
            🚀 Lancer la dictée !
          </button>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────
  // CHARGEMENT
  // ────────────────────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Mascot size={120} mood="thinking" />
        <p className="text-gray-600 text-lg font-medium">Génération de la phrase…</p>
        <p className="text-gray-400 text-sm">Dictou réfléchit 🤔</p>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────
  // FIN DE SESSION
  // ────────────────────────────────────────────────────────────
  if (phase === "finished") {
    const accuracy = sessionStats.totalWords > 0
      ? Math.round((sessionStats.correctWords / sessionStats.totalWords) * 100) : 0;

    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto text-center space-y-6">
        <div className="bg-gradient-to-br from-purple-500 to-blue-500 rounded-3xl p-8 text-white shadow-xl">
          <div className="flex justify-center mb-2">
            <Mascot size={110} mood="celebrate" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Session terminée !</h1>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="bg-white/20 rounded-2xl p-4">
              <div className="text-2xl font-bold">{sessionStats.totalSentences}</div>
              <div className="text-sm text-purple-200">phrases</div>
            </div>
            <div className="bg-white/20 rounded-2xl p-4">
              <div className="text-2xl font-bold">{accuracy}%</div>
              <div className="text-sm text-purple-200">précision</div>
            </div>
            <div className="bg-white/20 rounded-2xl p-4">
              <div className="text-2xl font-bold">+{sessionStats.totalXp}</div>
              <div className="text-sm text-purple-200">XP</div>
            </div>
          </div>
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={() => {
            localStorage.removeItem(STORAGE_KEY);
            setPhase("setup"); setSessionId(null); setSentence(null);
            setSessionStats({ totalSentences: 0, totalWords: 0, correctWords: 0, totalXp: 0 });
            setPreviousSentences([]);
          }} className="px-6 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition">
            🔄 Nouvelle session
          </button>
          <Link href="/dashboard"
            className="px-6 py-3 bg-white text-purple-700 font-bold rounded-xl border-2 border-purple-200 hover:border-purple-400 transition">
            🏠 Accueil
          </Link>
        </div>
      </motion.div>
    );
  }

  // ────────────────────────────────────────────────────────────
  // PRATIQUE PRINCIPALE
  // ────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Barre session */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>Phrase #{sessionStats.totalSentences + 1}</span>
        <select value={level} onChange={(e) => setLevel(e.target.value as Level)}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-500 bg-white">
          {LEVELS.map(({key, label}) => <option key={key} value={key}>{label}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-lg overflow-hidden">

        {/* ── Mascotte + Phrase ── */}
        <div className="p-6 border-b border-gray-50">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <Mascot size={70} mood={mascotMood} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                📖 Lis cette phrase à voix haute
              </p>
              <p className="text-xl font-medium leading-relaxed">
                {renderSentenceTokens()}
              </p>
            </div>
          </div>
        </div>

        {/* ── Évaluation des mots ── */}
        <div className="p-6">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
            Coche les mots bien écrits
          </h3>

          <div className="flex flex-wrap gap-2">
            {sentence?.allWords.map((word) => {
              const state = wordStates[word.id];
              return (
                <motion.button key={word.id}
                  onClick={() => toggleWord(word.id)}
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
                  <span>{word.text}</span>
                  <span className="opacity-50 text-xs">{levelToEmoji(word.level)}</span>
                </motion.button>
              );
            })}
          </div>

          <p className="text-xs text-gray-400 mt-3">
            1 clic = ✅ bien écrit · pas coché = ❌ mal écrit
          </p>
          <p className="text-xs text-gray-300 mt-2">
            <span className="text-purple-500">soulignés</span> = mots de ta liste · <span className="opacity-60">autres</span> = nouveaux capturés
          </p>
        </div>

        {/* ── Actions ── */}
        <div className="px-6 pb-6 flex gap-3 justify-end">
          <button onClick={finishSession}
            className="px-4 py-3 text-gray-600 font-medium rounded-xl border border-gray-200 hover:bg-gray-50 transition">
            Terminer
          </button>
          <button onClick={continuer}
            className="px-6 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition shadow hover:scale-105">
            Continuer →
          </button>
        </div>
      </div>

      {/* Mini stats */}
      {sessionStats.totalSentences > 0 && (
        <div className="flex gap-3 text-sm text-gray-500 justify-center">
          <span>📝 {sessionStats.totalSentences} phrase{sessionStats.totalSentences > 1 ? "s" : ""}</span>
          <span>·</span>
          <span>✅ {sessionStats.totalWords > 0 ? Math.round((sessionStats.correctWords / sessionStats.totalWords) * 100) : 0}%</span>
          <span>·</span>
          <span>⭐ {sessionStats.totalXp} XP</span>
        </div>
      )}
    </div>
  );
}
