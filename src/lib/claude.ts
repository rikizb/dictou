import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface GenerateSentenceParams {
  targetWords: string[];
  optionalWords?: string[];
  level?: "cp" | "ce1" | "ce2" | "cm1" | "cm2";
}

interface GeneratedSentence {
  text: string;
}

const LEVEL_GUIDES: Record<string, string> = {
  cp:  "CP (6-7 ans) : 5 à 7 mots, sujet + verbe simple + complément. Ex: « Le chat boit du lait. »",
  ce1: "CE1 (7-8 ans) : 7 à 10 mots, une seule idée claire. Ex: « La petite fille mange une pomme rouge. »",
  ce2: "CE2 (8-9 ans) : 9 à 13 mots, peut avoir une relative simple. Ex: « Le chien court dans le jardin et saute par-dessus la barrière. »",
  cm1: "CM1 (9-10 ans) : 11 à 15 mots, une proposition subordonnée simple. Ex: « Quand il fait beau, les enfants jouent au ballon dans la cour de l'école. »",
  cm2: "CM2 (10-11 ans) : 12 à 18 mots, structure variée. Ex: « Malgré la pluie, les trois amis décidèrent de partir en randonnée dans la forêt. »",
};

export async function generateDictationSentence(
  params: GenerateSentenceParams
): Promise<GeneratedSentence> {
  const { targetWords, optionalWords = [], level = "ce1" } = params;

  const levelGuide = LEVEL_GUIDES[level];
  const targetList = targetWords.join(", ");
  const optionalList = optionalWords.slice(0, 4).join(", ");

  const systemPrompt = `Tu es un expert en pédagogie française qui crée des phrases de dictée pour enfants.

RÈGLES ABSOLUES :
1. La phrase doit être 100% grammaticalement correcte en français
2. La phrase doit raconter quelque chose de concret et visuel qu'un enfant peut imaginer facilement
3. Chaque mot doit s'enchaîner naturellement : vérifie sujet + verbe accordé + compléments logiques
4. Si un mot imposé est un nom commun, construis une scène concrète autour de lui
5. Jamais de répétition du même mot ou structure bizarre
6. La phrase doit se lire à voix haute sans hésitation

EXEMPLES INTERDITS (phrases qui n'ont pas de sens) :
- "Le jouet ci est le sien de ma sœur." ❌
- "La grenouille du sien saute bien." ❌
- "Il mange le vite dans la cuisine." ❌
- "Le beau rouge enfant court jardin." ❌

EXEMPLES PARFAITS :
- "Le petit chien roux joue avec une balle rouge dans le jardin." ✅
- "Chaque matin, Léa prend son cartable et court jusqu'à l'école." ✅
- "La sorcière agite sa baguette magique et fait apparaître un château." ✅
- "Les enfants ramassent des châtaignes sous les grands arbres de la forêt." ✅
- "Mon frère a trouvé un beau caillou brillant au bord de la rivière." ✅`;

  const userPrompt = `Niveau : ${levelGuide}

Mots OBLIGATOIRES à inclure (tous doivent apparaître) : ${targetList}
${optionalList ? `Mots optionnels (utilise-en si ça aide) : ${optionalList}` : ""}

Génère UNE SEULE phrase de dictée qui :
- Utilise tous les mots obligatoires
- Est amusante ou imagée pour un enfant
- Est parfaitement correcte grammaticalement
- Termine par un point

Réponds UNIQUEMENT avec ce JSON (rien d'autre) :
{"sentence": "Ta phrase ici."}`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20251001",
    max_tokens: 200,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const content = response.content[0];
  if (content.type !== "text") throw new Error("Réponse Claude inattendue");

  const jsonMatch = content.text.match(/\{[\s\S]*?\}/);
  if (!jsonMatch) throw new Error("Format de réponse invalide");

  const parsed = JSON.parse(jsonMatch[0]);
  const sentence: string = parsed.sentence;

  // Vérifie que tous les mots cibles sont présents
  const sentenceLower = sentence.toLowerCase();
  const missingWords = targetWords.filter(
    (w) => !sentenceLower.includes(w.toLowerCase())
  );

  if (missingWords.length > 0) {
    return retryWithMissingWords(targetWords, missingWords, level, levelGuide, systemPrompt);
  }

  return { text: sentence };
}

async function retryWithMissingWords(
  targetWords: string[],
  missingWords: string[],
  level: string,
  levelGuide: string,
  systemPrompt: string
): Promise<GeneratedSentence> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20251001",
    max_tokens: 200,
    system: systemPrompt,
    messages: [{
      role: "user",
      content: `Niveau : ${levelGuide}

Tu DOIS inclure ces mots : ${targetWords.join(", ")}
Ces mots étaient manquants : ${missingWords.join(", ")} — ils DOIVENT être dans la phrase.

Génère une phrase courte, correcte et amusante pour un enfant.
Réponds UNIQUEMENT avec : {"sentence": "Ta phrase ici."}`,
    }],
  });

  const content = response.content[0];
  if (content.type !== "text") throw new Error("Erreur Claude");
  const jsonMatch = content.text.match(/\{[\s\S]*?\}/);
  if (!jsonMatch) throw new Error("Format invalide");
  return { text: JSON.parse(jsonMatch[0]).sentence };
}
