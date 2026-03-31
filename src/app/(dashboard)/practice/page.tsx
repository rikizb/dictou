"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import confetti from "canvas-confetti";
import Link from "next/link";
import { levelToColor, levelToEmoji } from "@/lib/scoring";

type Level = "cp" | "ce1" | "ce2" | "cm1" | "cm2";

interface TargetWord {
  id: string;
  text: string;
  level: number;
}

interface Sentence {
  id: string;
  text: string;
  targetWords: TargetWord[];
}

type WordState = "pending" | "correct" | "wrong";

interface SessionStats {
  totalSentences: number;
  totalWords: number;
  correctWords: number;
  totalXp: number;
}

type Phase =
  | "setup"
  | "loading-sentence"
  | "dictating"
  | "reviewing"
  | "loading-next"
  | "finished";

const LEVELS: { key: Level; label: string }[] = [
  { key: "cp", label: "CP" },
  { key: "ce1", label: "CE1" },
  { key: "ce2", label: "CE2" },
  { key: "cm1", label: "CM1" },
  { key: "cm2", label: "CM2" },
];

export default function PracticePage() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [level, setLevel] = useState<Level>("ce1");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sentence, setSentence] = useState<Sentence | null>(null);
  const [wordStates, setWordStates] = useState<Record<string, WordState>>({});
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    totalSentences: 0,
    totalWords: 0,
    correctWords: 0,
    totalXp: 0,
  });
  const [lastXp, setLastXp] = useState<number | null>(null);
  const [showSentence, setShowSentence] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Démarre une session
  const startSession = async () => {
    setPhase("loading-sentence");
    try {
      const r = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Erreur");
      setSessionId(data.session.id);
      await fetchNextSentence(data.session.id);
    } catch (e: any) {
      toast.error(e.message || "Erreur lors du démarrage");
      setPhase("setup");
    }
  };

  // Récupère la prochaine phrase
  const fetchNextSentence = async (sid: string) => {
    setPhase("loading-sentence");
    setShowSentence(false);
    try {
      const r = await fetch("/api/sentences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sid, level }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Erreur");

      setSentence(data.sentence);
      // Initialise tous les mots cibles comme "pending"
      const states: Record<string, WordState> = {};
      for (const w of data.sentence.targetWords) {
        states[w.id] = "pending";
      }
      setWordStates(states);
      setPhase("dictating");
    } catch (e: any) {
      toast.error(e.message || "Impossible de générer une phrase");
      setPhase(sessionStats.totalSentences > 0 ? "finished" : "setup");
    }
  };

  // Toggle l'état d'un mot (pending → correct → wrong → pending)
  const toggleWord = (wordId: string) => {
    if (phase !== "dictating") return;
    setWordStates((prev) => {
      const current = prev[wordId];
      const next: WordState =
        current === "pending" ? "correct" : current === "correct" ? "wrong" : "pending";
      return { ...prev, [wordId]: next };
    });
  };

  // Valide la phrase courante
  const validateSentence = async () => {
    if (!sentence || !sessionId) return;

    // Vérifie que tous les mots ont été évalués
    const hasPending = Object.values(wordStates).some((s) => s === "pending");
    if (hasPending) {
      toast("Clique sur chaque mot pour indiquer s'il est correct ✅ ou faux ❌", {
        icon: "ℹ️",
      });
      return;
    }

    setPhase("reviewing");

    const results = sentence.targetWords.map((w) => ({
      wordId: w.id,
      correct: wordStates[w.id] === "correct",
    }));

    try {
      const r = await fetch("/api/sentences/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sentenceId: sentence.id, results }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);

      const correct = results.filter((r) => r.correct).length;
      const total = results.length;

      setSessionStats((prev) => ({
        totalSentences: prev.totalSentences + 1,
        totalWords: prev.totalWords + total,
        correctWords: prev.correctWords + correct,
        totalXp: prev.totalXp + data.xpEarned,
      }));

      setLastXp(data.xpEarned);

      // Confetti si parfait !
      if (correct === total && total > 0) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#a855f7", "#3b82f6", "#22c55e", "#f59e0b"],
        });
        toast.success("Parfait ! 🌟 Tous les mots corrects !", { icon: "🎉" });
      } else if (correct >= total / 2) {
        toast.success(`Bien ! ${correct}/${total} corrects 👍`);
      } else {
        toast("Continue à pratiquer ! 💪", { icon: "📚" });
      }
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de la validation");
    }
  };

  // Passe à la phrase suivante
  const nextSentence = async () => {
    if (!sessionId) return;
    setPhase("loading-next");
    setLastXp(null);
    await fetchNextSentence(sessionId);
  };

  // Termine la session
  const finishSession = async () => {
    if (sessionId) {
      await fetch("/api/sessions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
    }
    setPhase("finished");
  };

  // Parse la phrase en mots pour l'affichage (tokens)
  const parseSentenceTokens = (text: string, targetWords: TargetWord[]) => {
    // Tokenise la phrase en mots
    const tokens: Array<{ type: "word" | "space" | "punct"; text: string; wordRef?: TargetWord }> = [];
    const regex = /(\w+|[^\w\s]|\s+)/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      const token = match[0];
      if (/^\s+$/.test(token)) {
        tokens.push({ type: "space", text: token });
      } else if (/^\w+$/.test(token)) {
        const wordRef = targetWords.find(
          (w) => w.text.toLowerCase() === token.toLowerCase()
        );
        tokens.push({ type: "word", text: token, wordRef });
      } else {
        tokens.push({ type: "punct", text: token });
      }
    }
    return tokens;
  };

  // Setup screen
  if (phase === "setup") {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🎯 Nouvelle dictée</h1>
          <p className="text-gray-500 mt-1">
            Configure ta session et lance-toi !
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Niveau scolaire
            </label>
            <div className="flex gap-2 flex-wrap">
              {LEVELS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setLevel(key)}
                  className={`px-4 py-2 rounded-xl font-medium transition ${
                    level === key
                      ? "bg-purple-600 text-white shadow"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-purple-50 rounded-xl p-4 text-sm text-purple-800">
            <p className="font-semibold mb-1">Comment ça marche :</p>
            <ol className="list-decimal list-inside space-y-1 text-purple-700">
              <li>Une phrase est générée avec tes mots prioritaires</li>
              <li>Lis la phrase à voix haute à ton enfant</li>
              <li>L'enfant écrit la dictée sur papier</li>
              <li>Clique ✅ ou ❌ pour chaque mot cible</li>
              <li>Valide pour passer à la suivante</li>
            </ol>
          </div>

          <button
            onClick={startSession}
            className="w-full py-4 bg-purple-600 text-white font-bold text-lg rounded-xl hover:bg-purple-700 transition shadow hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
          >
            🚀 Commencer la dictée !
          </button>
        </div>
      </div>
    );
  }

  // Loading screen
  if (phase === "loading-sentence" || phase === "loading-next") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="text-5xl"
        >
          ✏️
        </motion.div>
        <p className="text-gray-500 text-lg font-medium">
          {phase === "loading-next" ? "Génération de la prochaine phrase..." : "Préparation de la dictée..."}
        </p>
        <p className="text-gray-400 text-sm">Claude réfléchit... 🤔</p>
      </div>
    );
  }

  // Finished screen
  if (phase === "finished") {
    const accuracy =
      sessionStats.totalWords > 0
        ? Math.round((sessionStats.correctWords / sessionStats.totalWords) * 100)
        : 0;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto text-center space-y-6"
      >
        <div className="bg-gradient-to-br from-purple-500 to-blue-500 rounded-3xl p-8 text-white shadow-xl">
          <div className="text-6xl mb-4">
            {accuracy === 100 ? "🏆" : accuracy >= 80 ? "🌟" : accuracy >= 60 ? "😊" : "💪"}
          </div>
          <h1 className="text-3xl font-bold mb-2">Session terminée !</h1>
          <p className="text-purple-200">Voici ton résultat :</p>

          <div className="grid grid-cols-3 gap-4 mt-6">
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
          <button
            onClick={() => {
              setPhase("setup");
              setSessionId(null);
              setSentence(null);
              setSessionStats({ totalSentences: 0, totalWords: 0, correctWords: 0, totalXp: 0 });
            }}
            className="px-6 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition"
          >
            🔄 Nouvelle session
          </button>
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-white text-purple-700 font-bold rounded-xl border-2 border-purple-200 hover:border-purple-400 transition"
          >
            🏠 Accueil
          </Link>
        </div>
      </motion.div>
    );
  }

  // Main practice screen
  const tokens = sentence ? parseSentenceTokens(sentence.text, sentence.targetWords) : [];
  const allEvaluated = sentence?.targetWords.every((w) => wordStates[w.id] !== "pending");

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Session progress bar */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>
          Phrase #{sessionStats.totalSentences + (phase === "reviewing" ? 0 : 1)}
        </span>
        <span>
          {sessionStats.totalXp} XP
          {lastXp && phase === "reviewing" && (
            <motion.span
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="ml-1 text-green-600 font-bold"
            >
              +{lastXp}
            </motion.span>
          )}
        </span>
      </div>

      {/* Sentence card */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-lg overflow-hidden">
        {/* Phrase display (masquée pendant la dictée, visible en review) */}
        <div className="p-6 border-b border-gray-50">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-600 text-sm uppercase tracking-wide">
              {phase === "dictating" ? "📖 Phrase à dicter" : "✅ Phrase complète"}
            </h2>
            {phase === "dictating" && (
              <button
                onClick={() => setShowSentence(!showSentence)}
                className="text-xs text-purple-500 hover:text-purple-700 underline"
              >
                {showSentence ? "Masquer" : "Afficher pour dicter"}
              </button>
            )}
          </div>

          <AnimatePresence>
            {(phase === "reviewing" || showSentence) && sentence && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-xl font-medium text-gray-800 leading-relaxed"
              >
                {tokens.map((token, i) => {
                  if (token.type === "space") return <span key={i}>{token.text}</span>;
                  if (token.type === "punct") return <span key={i} className="text-gray-600">{token.text}</span>;

                  if (token.wordRef && phase === "reviewing") {
                    const state = wordStates[token.wordRef.id];
                    return (
                      <span
                        key={i}
                        className={`font-bold px-1 rounded transition ${
                          state === "correct"
                            ? "bg-green-100 text-green-800"
                            : state === "wrong"
                            ? "bg-red-100 text-red-800 line-through"
                            : ""
                        }`}
                      >
                        {token.text}
                      </span>
                    );
                  }

                  if (token.wordRef) {
                    return (
                      <span key={i} className="font-bold text-purple-700 underline decoration-dotted">
                        {token.text}
                      </span>
                    );
                  }

                  return <span key={i}>{token.text}</span>;
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {phase === "dictating" && !showSentence && (
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-gray-400 text-sm">
                Clique sur "Afficher pour dicter" pour voir la phrase,<br />
                puis lis-la à voix haute à ton enfant.
              </p>
            </div>
          )}
        </div>

        {/* Word evaluation */}
        <div className="p-6">
          <h3 className="font-semibold text-gray-600 text-sm uppercase tracking-wide mb-4">
            {phase === "dictating"
              ? "🎯 Clique pour évaluer chaque mot"
              : "📊 Résultats"}
          </h3>

          {sentence?.targetWords.length === 0 ? (
            <p className="text-gray-400 text-sm">Aucun mot cible identifié.</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {sentence?.targetWords.map((word) => {
                const state = wordStates[word.id];
                return (
                  <motion.button
                    key={word.id}
                    onClick={() => toggleWord(word.id)}
                    disabled={phase === "reviewing"}
                    whileTap={phase === "dictating" ? { scale: 0.92 } : {}}
                    className={`
                      flex items-center gap-2 px-4 py-3 rounded-2xl border-2 text-base font-semibold
                      transition-all duration-200 cursor-pointer select-none
                      ${phase === "reviewing" ? "cursor-default" : ""}
                      ${
                        state === "correct"
                          ? "bg-green-100 border-green-400 text-green-800"
                          : state === "wrong"
                          ? "bg-red-100 border-red-400 text-red-800"
                          : "bg-white border-gray-200 text-gray-700 hover:border-purple-400 hover:bg-purple-50 hover:scale-105"
                      }
                    `}
                  >
                    <span>
                      {state === "correct" ? "✅" : state === "wrong" ? "❌" : "⬜"}
                    </span>
                    <span>{word.text}</span>
                    <span className="text-sm opacity-60">{levelToEmoji(word.level)}</span>
                  </motion.button>
                );
              })}
            </div>
          )}

          {phase === "dictating" && (
            <p className="text-xs text-gray-400 mt-3">
              Clique une fois = ✅ correct · deux fois = ❌ faux · trois fois = ⬜ pas encore
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3 justify-end">
          {phase === "dictating" && (
            <button
              onClick={validateSentence}
              className={`px-6 py-3 font-bold text-white rounded-xl transition ${
                allEvaluated
                  ? "bg-purple-600 hover:bg-purple-700 shadow-lg hover:scale-105"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              Valider ✓
            </button>
          )}

          {phase === "reviewing" && (
            <>
              <button
                onClick={finishSession}
                className="px-4 py-3 text-gray-600 font-medium rounded-xl border border-gray-200 hover:bg-gray-50 transition"
              >
                Terminer
              </button>
              <button
                onClick={nextSentence}
                className="px-6 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition shadow hover:scale-105"
              >
                Phrase suivante →
              </button>
            </>
          )}
        </div>
      </div>

      {/* Session mini stats */}
      {sessionStats.totalSentences > 0 && (
        <div className="flex gap-3 text-sm text-gray-500 justify-center">
          <span>📝 {sessionStats.totalSentences} phrase{sessionStats.totalSentences > 1 ? "s" : ""}</span>
          <span>·</span>
          <span>
            ✅ {sessionStats.totalWords > 0
              ? Math.round((sessionStats.correctWords / sessionStats.totalWords) * 100)
              : 0}% de précision
          </span>
          <span>·</span>
          <span>⭐ {sessionStats.totalXp} XP</span>
        </div>
      )}
    </div>
  );
}
