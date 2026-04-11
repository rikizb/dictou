"use client";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import Link from "next/link";

const GUEST_WORDS_KEY = "guest_words";
const GUEST_PREV_KEY = "guest_prev_sentences";
const GUEST_USED_KEY = "guest_used_sentences";
const LEVEL_KEY = "dictou_level";

// ─── Banque de phrases pré-rédigées par niveau ────────────────
// Servies en mode démo (pas de mots personnels). ~30 par niveau.
const DEMO_SENTENCES: Record<string, string[]> = {
  cp: [
    "Le lapin blanc saute dans le grand pré.",
    "Papa lit un livre sous le vieil arbre.",
    "Le chien roux dort près de la porte.",
    "Léa mange une pomme rouge après l'école.",
    "Le train roule vite sur les rails brillants.",
    "Maman cueille des fleurs dans le jardin.",
    "Les canards nagent sur l'étang calme.",
    "Jules court pieds nus sur le sable chaud.",
    "La lune brille dans le ciel noir.",
    "Le petit chat dort dans la corbeille.",
    "Paul boit son lait chaud avant de dormir.",
    "La neige tombe doucement sur les toits.",
    "Mia range ses jouets dans la boîte bleue.",
    "Le coq chante tôt le matin à la ferme.",
    "Le ballon rebondit dans la cour de récréation.",
    "Théo aide sa petite sœur à monter l'escalier.",
    "Les poules picorent les grains dans la cour.",
    "La petite fille dessine un soleil avec des craies.",
    "Le facteur pose une lettre dans la boîte rouge.",
    "Lola souffle ses bougies et fait un vœu.",
    "Le petit âne broute l'herbe fraîche du pré.",
    "Nina met ses bottes pour sauter dans les flaques.",
    "Le chat roux est assis sur le bord du toit.",
    "Les enfants jouent à cache-cache dans la grange.",
    "Grand-mère tricote près de la fenêtre ouverte.",
    "Le vélo rouge est appuyé contre le mur blanc.",
    "Les feuilles tombent une à une en automne.",
    "La pie vole avec un brin de laine dans le bec.",
    "Le bébé rit aux éclats dans son berceau.",
    "Tom a trouvé une belle plume bleue dans le jardin.",
  ],
  ce1: [
    "La maîtresse écrit les devoirs au tableau noir.",
    "Après la pluie, un bel arc-en-ciel illumine le ciel.",
    "Les enfants ramassent des marrons sous les grands arbres.",
    "Mon grand frère apprend à jouer de la guitare.",
    "Le fermier nourrit ses vaches chaque matin à l'aube.",
    "La vieille pendule sonne dix fois dans le couloir.",
    "Élodie a trouvé un joli caillou brillant au bord du ruisseau.",
    "Les cigognes reviennent chaque printemps nicher sur les cheminées.",
    "Le vent souffle fort et renverse les fleurs du balcon.",
    "Papa prépare une tarte aux pommes pour le goûter.",
    "Le chat observe les oiseaux depuis le rebord de la fenêtre.",
    "Thomas court aussi vite que le vent dans la cour.",
    "La grenouille plonge dans la mare avec un grand plouf.",
    "Camille apprend par cœur la poésie de la semaine.",
    "Un renard roux traverse le chemin sous la pleine lune.",
    "La petite souris a grignoté le coin du livre de classe.",
    "Tous les élèves ont colorié leur dessin avec beaucoup de soin.",
    "La rivière déborde après les grosses pluies d'automne.",
    "Les hirondelles volent très bas quand l'orage approche.",
    "La vieille dame promène son chien blanc sur la place du village.",
    "Hugo a oublié sa trousse et tous ses crayons de couleur.",
    "Les feuilles rousses forment un tapis dans l'allée du parc.",
    "Le voisin répare la clôture avec des planches de bois.",
    "La marmotte dort tout l'hiver au fond de son terrier.",
    "Inès a reçu un beau livre de contes pour son anniversaire.",
    "Mon oncle cultive de belles tomates dans son grand potager.",
    "Le soleil se couche derrière la colline en fin de journée.",
    "Les étoiles s'allument une à une dans le ciel du soir.",
    "Le boulangers sort des croissants dorés du four chaque matin.",
    "Emma a planté des graines et les arrose chaque jour.",
  ],
  ce2: [
    "L'explorateur a découvert une grotte cachée derrière la cascade.",
    "Pendant la tempête, les vagues s'écrasaient sur les rochers du port.",
    "La sorcière agite sa baguette et un château de lumière apparaît.",
    "Les chevaliers du Moyen Âge portaient de lourdes armures en métal.",
    "Au fond de la forêt, un vieil ermite vivait dans une cabane de bois.",
    "Le détective cherchait des indices dans la bibliothèque poussiéreuse.",
    "Les dauphins bondissent hors de l'eau devant la proue du bateau.",
    "Le vieux phare guide encore les marins dans la nuit d'orage.",
    "Juliette a passé la nuit à lire son roman de pirates sous les couvertures.",
    "Les fourmis transportent des charges dix fois plus lourdes qu'elles.",
    "L'archéologue a mis au jour un vase grec enfoui depuis des siècles.",
    "La montgolfière s'élève lentement dans le ciel rose de l'aurore.",
    "Les enfants ont construit un radeau pour traverser le lac.",
    "Le loup solitaire hurlait à la lune depuis le sommet du rocher.",
    "Dans l'aquarium, un poulpe curieux observait les visiteurs à travers la vitre.",
    "La caravane de chameaux traversait lentement le désert sous un soleil de plomb.",
    "Un éclair zébra le ciel et le tonnerre gronda dans toute la montagne.",
    "Les pingouins se serrent les uns contre les autres pour se réchauffer.",
    "Les enfants ont suivi la piste de miettes jusqu'à la maison en pain d'épice.",
    "Le château fort était entouré de douves profondes et d'un pont-levis.",
    "Au crépuscule, des milliers de chauves-souris quittent la grotte en nuage.",
    "L'ours cherchait des baies et du miel avant l'arrivée de l'hiver.",
    "Les enfants construisirent une cabane dans l'arbre avec des planches récupérées.",
    "La goélette filait sur les flots sous une brise légère et régulière.",
    "Le prestidigitateur fit disparaître la pièce sous les yeux ébahis du public.",
    "Les volcans en éruption projettent de la lave à des kilomètres à la ronde.",
    "La petite troupe de campeurs planta les tentes près de la rivière.",
    "Au marché du village, les étals débordaient de fruits aux mille couleurs.",
    "La bibliothécaire range soigneusement chaque livre à sa place exacte.",
    "Le charpentier taillait les poutres avec une précision remarquable.",
  ],
  cm1: [
    "La révolution industrielle a transformé les villes et les campagnes au XIXe siècle.",
    "Le navigateur consulta sa boussole avant de larguer les amarres sous la tempête.",
    "Un silence pesant régnait dans la salle d'examen ce matin-là.",
    "Les astronautes flottent en apesanteur à bord de la station spatiale internationale.",
    "Le jeune alpiniste fixa sa corde et attaqua la paroi avec méthode et courage.",
    "Dans la savane africaine, les éléphants migrent vers les points d'eau en saison sèche.",
    "Le sculpteur travaillait patiemment le marbre depuis des semaines dans son atelier.",
    "Les archéologues ont mis au jour les vestiges d'une cité romaine sous les champs.",
    "La fusée décolla en soulevant un nuage de fumée et une onde de chaleur intense.",
    "Le vieux sage racontait les légendes de la montagne depuis sa véranda.",
    "Les coraux forment de véritables forêts sous-marines peuplées de milliers d'espèces.",
    "La troupe de théâtre répétait sa pièce chaque soir dans la grange transformée.",
    "La rivière a creusé ce canyon profond au fil de millions d'années.",
    "Un faucon pèlerin plongea en piqué pour attraper l'étourneau en plein vol.",
    "Le cartographe dessinait avec soin les contours de la côte inexplorée.",
    "Les pyramides d'Égypte furent construites par des milliers d'ouvriers durant des décennies.",
    "Malgré le brouillard épais, le capitaine maintint le cap avec beaucoup de sang-froid.",
    "L'ingénieur vérifia chaque boulon avant le lancement du prototype.",
    "Les migrations d'oiseaux suivent des routes précises tracées depuis des millénaires.",
    "Le détective remarqua une empreinte dans la poussière derrière la bibliothèque.",
    "Les tremblements de terre libèrent une énergie colossale accumulée pendant des siècles.",
    "L'équipage du sous-marin n'avait pas vu la lumière du jour depuis trois semaines.",
    "Le marathon exige des mois d'entraînement rigoureux et une volonté de fer.",
    "Le chercheur notait ses observations dans un carnet couvert d'équations mystérieuses.",
    "La stratégie du général prit tout le monde par surprise au dernier moment.",
    "La formule chimique apprise en classe permit à Lucas de remporter le concours.",
    "Les troupes avancèrent à l'aube dans un brouillard dense et glacé.",
    "Le romancier noircissait des pages entières avant de trouver le premier mot du chapitre.",
    "La philosophe grecque Hypatie enseignait les mathématiques et l'astronomie à Alexandrie.",
    "Les forêts tropicales abritent plus de la moitié des espèces vivantes de la planète.",
  ],
  cm2: [
    "La bienveillance est une forme discrète de courage que l'on exerce chaque jour.",
    "L'émancipation des femmes au XXe siècle a profondément transformé nos sociétés.",
    "La métamorphose du papillon illustre à merveille la puissance du changement.",
    "Le philosophe affirmait que la véritable liberté commence par la connaissance de soi.",
    "La reconstruction du quartier ravagé exigea des années de labeur et de persévérance.",
    "L'astronome pointa son télescope vers la constellation d'Orion dans le ciel hivernal.",
    "La résistance acharnée des habitants força l'armée envahissante à rebrousser chemin.",
    "Dans l'obscurité absolue de la grotte, chaque son prenait une dimension amplifiée.",
    "La perpétuation des traditions orales assure la transmission d'une mémoire collective.",
    "Le déchiffrement des hiéroglyphes permit de révéler les mystères de la civilisation égyptienne.",
    "L'écrivaine relisait chaque phrase à voix haute pour en vérifier le rythme et la fluidité.",
    "La réconciliation des deux nations passa par un long processus de négociations délicates.",
    "L'enthousiasme des bénévoles compensa largement les moyens limités de l'association.",
    "Le capitaine maintint un calme souverain tandis que la tempête faisait rage autour du navire.",
    "La découverte de la pénicilline a sauvé des millions de vies au cours du XXe siècle.",
    "La cartographie satellitaire révèle des structures géologiques invisibles à l'œil nu.",
    "Le compositeur passa trois ans à orchestrer cette symphonie ambitieuse et novatrice.",
    "L'introspection nécessite un silence intérieur difficile à atteindre dans notre époque agitée.",
    "Les scientifiques estiment que l'univers est âgé de près de quatorze milliards d'années.",
    "La reforestation massive des zones déboisées contribue à ralentir le changement climatique.",
    "L'obstination du chercheur finit par payer : il publia sa théorie après dix ans de travail.",
    "Les jeux Olympiques modernes furent fondés par Pierre de Coubertin à la fin du XIXe siècle.",
    "La photosynthèse permet aux plantes de convertir la lumière solaire en énergie organique.",
    "La beauté d'une œuvre d'art réside parfois dans son imperfection délibérée et assumée.",
    "Le rapport entre la liberté individuelle et le bien commun a toujours divisé les philosophes.",
    "L'effondrement de l'empire romain d'Occident marqua la transition de l'Antiquité au Moyen Âge.",
    "La transmission du savoir de génération en génération est le fondement de toute civilisation.",
    "Un texte mal ponctué peut changer radicalement le sens d'une phrase entière.",
    "La diplomatie exige autant de patience que d'intelligence dans les moments de crise.",
    "La curiosité scientifique ne connaît pas de frontières géographiques ni de limites culturelles.",
  ],
};

// ─── Pool de mots (mode IA uniquement) ───────────────────────
const WORD_POOLS: Record<string, string[]> = {
  cp:  ["lapin","canard","ballon","pomme","pain","nuit","lune","fleur","nuage","pluie","verre","fête","porte","ferme","herbe","tigre","zèbre","fraise","cerise","bougie","bouche","oiseau","forêt","route","école","maison","soleil","jardin","livre","table"],
  ce1: ["grenouille","papillon","cerise","fontaine","château","rivière","marché","bougie","printemps","chanson","récréation","voisin","couleur","cadeau","campagne","gymnase","piscine","hirondelle","araignée","tonnerre","calendrier","facteur","boulanger","dimanche","épouvantail","escargot","sorcière","fantôme","dinosaure","volcan"],
  ce2: ["expédition","naufrage","avalanche","pirate","chevalier","dragon","trésor","désert","tempête","glacier","cascade","grotte","mystère","nébuleuse","labyrinthe","carnaval","archéologue","légende","caravane","phare","squelette","explorateur","jungle","savane","médaille","tournoi","volcan","sorcière","détective","pirogue"],
  cm1: ["intrépide","équilibre","conquête","révolution","invention","stratégie","expédition","illusion","sacrifice","ambition","démocratie","philosophie","attraction","navigation","évolution","civilisation","architecture","astronaute","territoire","migration","renaissance","cartographie","encyclopédie","perspicacité","téméraire","constellation","résilience","alchimiste","prototype","météorite"],
  cm2: ["persévérance","ambiguïté","réconciliation","métamorphose","mélancolie","préjugé","souveraineté","irréversible","perspicacité","accomplissement","bienveillance","circonspection","désillusion","émancipation","flamboyant","magnanimité","obsolescence","transcendance","vertigineux","indépendance","épanouissement","contemporain","enthousiasme","délibération","introspection","paragraphe","prestidigitateur","quintessence","imperceptible","inextricable"],
};

function getDefaultWords(level: string): string[] {
  const pool = WORD_POOLS[level] || WORD_POOLS.cp;
  return [...pool].sort(() => Math.random() - 0.5).slice(0, 5);
}

// ─── Tirage sans remise depuis la banque ─────────────────────
function pickDemoSentence(level: string, used: number[]): { sentence: string; newUsed: number[] } {
  const bank = DEMO_SENTENCES[level] || DEMO_SENTENCES.cp;
  const available = bank.map((_, i) => i).filter(i => !used.includes(i));
  // Si tout a été vu, on repart de zéro
  const pool = available.length > 0 ? available : bank.map((_, i) => i);
  const idx = pool[Math.floor(Math.random() * pool.length)];
  const newUsed = available.length > 0 ? [...used, idx] : [idx];
  return { sentence: bank[idx], newUsed };
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
  "pour","lors","dès","chez","vers","sans","avant","après","aussi","même","tout",
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
  // true = l'utilisateur n'a pas encore entré ses propres mots → mode démo
  const [isDemoMode, setIsDemoMode] = useState(true);

  const hasAutoStarted = useRef(false);
  const autoStartWords = useRef<GuestWord[] | null>(null);
  // Indices déjà servis dans la banque (évite les répétitions)
  const usedIndicesRef = useRef<number[]>([]);

  // Charger les mots et le niveau depuis localStorage
  useEffect(() => {
    let loadedWords: GuestWord[] = [];
    let loadedLevel: Level = "cp";
    let isDemo = true;
    try {
      const raw = localStorage.getItem(GUEST_WORDS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.length > 0) {
          loadedWords = parsed;
          isDemo = false; // des mots personnels existent
        }
      }
      const prev = localStorage.getItem(GUEST_PREV_KEY);
      if (prev) setPreviousSentences(JSON.parse(prev));
      const savedLevel = localStorage.getItem(LEVEL_KEY);
      if (savedLevel) loadedLevel = savedLevel as Level;
      const savedUsed = localStorage.getItem(`${GUEST_USED_KEY}_${loadedLevel}`);
      if (savedUsed) usedIndicesRef.current = JSON.parse(savedUsed);
    } catch {
      // ignore
    }
    setLevel(loadedLevel);
    setIsDemoMode(isDemo);
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
      fetchSentence(isDemoMode);
    }
  }, [guestWords]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sauvegarder les mots dans localStorage (pour import lors de la création de compte)
  useEffect(() => {
    localStorage.setItem(GUEST_WORDS_KEY, JSON.stringify(guestWords));
  }, [guestWords, isDemoMode]);

  const addWord = () => {
    const trimmed = wordInput.trim().toLowerCase();
    if (!trimmed) return;
    const newWords = trimmed.split(/[,;\s]+/).map(w => w.trim()).filter(w => w.length > 0);
    const toAdd = newWords.filter(w => !guestWords.some(gw => gw.text === w));
    if (toAdd.length === 0) {
      toast("Ce mot est déjà dans ta liste", { icon: "ℹ️" });
      return;
    }
    setIsDemoMode(false); // l'utilisateur entre ses propres mots
    setGuestWords(prev => [...prev, ...toAdd.map(text => ({ text }))]);
    setWordInput("");
  };

  const removeWord = (text: string) => {
    setGuestWords(prev => {
      const next = prev.filter(w => w.text !== text);
      if (next.length === 0) setIsDemoMode(true);
      return next;
    });
  };

  const fetchSentence = async (demo?: boolean) => {
    const useDemo = demo !== undefined ? demo : isDemoMode;
    if (guestWords.length < 2 && !useDemo) {
      toast.error("Ajoute au moins 2 mots pour commencer !");
      return;
    }
    setPhase("loading");

    if (useDemo) {
      // Mode démo : phrase pré-rédigée sans répétition
      const { sentence: s, newUsed } = pickDemoSentence(level, usedIndicesRef.current);
      usedIndicesRef.current = newUsed;
      try {
        localStorage.setItem(`${GUEST_USED_KEY}_${level}`, JSON.stringify(newUsed));
      } catch { /* ignore */ }
      applyNewSentence(s);
      return;
    }

    // Mode personnel : appel IA
    try {
      const shuffled = [...guestWords].sort(() => Math.random() - 0.5);
      const words = shuffled.map(w => w.text);
      const r = await fetch("/api/sentences/guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ words, level, previousSentences }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Erreur");
      applyNewSentence(data.sentence);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Impossible de générer une phrase";
      toast.error(msg);
      setPhase("setup");
    }
  };

  const applyNewSentence = (sentenceText: string) => {
    setSentence(sentenceText);
    const tokens = sentenceText.split(/[\s,;:!?.«»""''()\-]+/);
    const seen = new Set<string>();
    const orderedTargets: string[] = [];
    for (const token of tokens) {
      const clean = token.replace(/[^a-zàâäéèêëîïôùûüç'-]/gi, "").toLowerCase();
      if (clean.length >= 3 && !FUNCTION_WORDS.has(clean) && !seen.has(clean)) {
        seen.add(clean);
        orderedTargets.push(token.replace(/[^a-zA-ZàâäéèêëîïôùûüçÀÂÄÉÈÊËÎÏÔÙÛÜÇ'-]/g, ""));
      }
    }
    setTargetWords(orderedTargets);
    const states: Record<string, WordState> = {};
    for (const w of orderedTargets) states[w] = "pending";
    setWordStates(states);
    setPhase("dictating");
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
      toast.success("Parfait ! 🌟", { icon: "🎉" });
    } else {
      toast(`${correct}/${total} — continuez ! 💪`, { icon: "📚" });
    }
    const updated = [...previousSentences, sentence].slice(-5);
    setPreviousSentences(updated);
    try { localStorage.setItem(GUEST_PREV_KEY, JSON.stringify(updated)); } catch { /* ignore */ }
    setTotalDone(n => n + 1);
    await fetchSentence(isDemoMode);
  };

  const terminer = () => {
    setPhase("setup");
    setSentence("");
    setTargetWords([]);
    setWordStates({});
  };

  const handleLevelChange = (newLevel: Level) => {
    setLevel(newLevel);
    try {
      localStorage.setItem(LEVEL_KEY, newLevel);
      const savedUsed = localStorage.getItem(`${GUEST_USED_KEY}_${newLevel}`);
      usedIndicesRef.current = savedUsed ? JSON.parse(savedUsed) : [];
    } catch { /* ignore */ }
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
            className="px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-xl hover:bg-purple-700 transition shadow-sm"
          >
            Créer un compte →
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
                <p className="text-gray-500 mt-1">Ajoute les mots à travailler, l'IA génère les phrases.</p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
                {/* Sélecteur de niveau */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Niveau scolaire</label>
                  <select
                    value={level}
                    onChange={(e) => handleLevelChange(e.target.value as Level)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white"
                  >
                    {LEVELS.map(({ key, label }) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* Input mots */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Mots à travailler
                    {isDemoMode && <span className="ml-2 text-xs font-normal text-gray-400">(exemples — remplacez par vos mots)</span>}
                  </label>
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
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium border ${
                          isDemoMode
                            ? "bg-gray-50 border-gray-200 text-gray-500"
                            : "bg-purple-50 border-purple-200 text-purple-800"
                        }`}
                      >
                        {w.text}
                        <button
                          onClick={() => removeWord(w.text)}
                          className="text-gray-400 hover:text-gray-600 transition ml-0.5"
                          aria-label={`Supprimer ${w.text}`}
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => fetchSentence(isDemoMode)}
                  disabled={guestWords.length < 2 && !isDemoMode}
                  className="w-full py-4 bg-purple-600 text-white font-bold text-lg rounded-xl hover:bg-purple-700 transition shadow hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                >
                  🚀 Lancer la dictée !
                </button>

                {totalDone > 0 && (
                  <p className="text-center text-sm text-gray-400">
                    {totalDone} phrase{totalDone > 1 ? "s" : ""} cette session
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
              <p className="text-gray-500 text-base font-medium">Génération de la phrase…</p>
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
                <select
                  value={level}
                  onChange={(e) => handleLevelChange(e.target.value as Level)}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-500 bg-white"
                >
                  {LEVELS.map(({ key, label }) => <option key={key} value={key}>{label}</option>)}
                </select>
              </div>

              <div className="bg-white rounded-3xl border border-gray-100 shadow-lg overflow-hidden">
                {/* Phrase */}
                <div className="p-6 border-b border-gray-50">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                    📖 Phrase à dicter à l'enfant
                  </p>
                  <p className="text-xl font-medium leading-relaxed text-gray-800">
                    {sentence}
                  </p>
                </div>

                {/* Évaluation */}
                <div className="p-6">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
                    Coche les mots bien orthographiés
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
                    Coche tout ce que l'enfant a bien écrit — le reste est noté ❌
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
                    Phrase suivante →
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Bannière fixe inscription */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-purple-100 px-4 py-3 flex items-center justify-between gap-3 shadow-md z-40">
        <p className="text-sm text-gray-600">
          Compte gratuit — sauvegardez la progression de votre enfant.
        </p>
        <Link
          href="/sign-up?redirect_url=/dashboard"
          className="shrink-0 px-4 py-2 bg-purple-600 text-white font-bold text-sm rounded-xl hover:bg-purple-700 transition"
        >
          Créer un compte →
        </Link>
      </div>
    </div>
  );
}
