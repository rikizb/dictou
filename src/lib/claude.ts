import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface GenerateSentenceParams {
  targetWords: string[];    // mots prioritaires à inclure obligatoirement
  optionalWords?: string[]; // autres mots de la liste si besoin
  level?: "cp" | "ce1" | "ce2" | "cm1" | "cm2"; // niveau scolaire
}

interface GeneratedSentence {
  text: string;
  wordsUsed: string[]; // mots de la liste effectivement utilisés dans la phrase
}

export async function generateDictationSentence(
  params: GenerateSentenceParams
): Promise<GeneratedSentence> {
  const { targetWords, optionalWords = [], level = "ce1" } = params;

  const levelDescriptions = {
    cp: "CP (6-7 ans, phrases très courtes de 5-7 mots, vocabulaire ultra simple)",
    ce1: "CE1 (7-8 ans, phrases courtes de 6-9 mots, vocabulaire simple)",
    ce2: "CE2 (8-9 ans, phrases de 8-12 mots, vocabulaire courant)",
    cm1: "CM1 (9-10 ans, phrases de 10-14 mots, vocabulaire varié)",
    cm2: "CM2 (10-11 ans, phrases de 12-16 mots, vocabulaire riche)",
  };

  const allWords = [...targetWords, ...optionalWords.slice(0, 5)];
  const wordList = targetWords.join(", ");
  const optionalList =
    optionalWords.length > 0 ? optionalWords.slice(0, 5).join(", ") : "aucun";

  const prompt = `Tu génères des phrases de dictée pour des enfants en France, niveau ${levelDescriptions[level]}.

MOTS OBLIGATOIRES à inclure dans la phrase (tous doivent apparaître): ${wordList}

MOTS OPTIONNELS de la liste (utilise-en si ça aide à construire une phrase naturelle): ${optionalList}

RÈGLES STRICTES:
1. La phrase doit avoir un sens logique et être amusante/imaginative pour un enfant
2. Tous les mots obligatoires DOIVENT apparaître dans la phrase
3. Utilise des mots simples pour le reste (mots hors liste = minimum)
4. La phrase doit être en français correct avec une bonne orthographe
5. Pas de contenu effrayant ou inapproprié
6. Une seule phrase, terminée par un point.

Réponds UNIQUEMENT avec un objet JSON dans ce format exact:
{
  "sentence": "La phrase ici.",
  "wordsUsed": ["liste", "des", "mots", "de", "la liste", "utilisés"]
}

Les "wordsUsed" doivent contenir uniquement les mots qui apparaissent dans la phrase ET qui faisaient partie de la liste fournie (obligatoires + optionnels).`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Réponse Claude inattendue");
  }

  // Parse le JSON
  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Format de réponse invalide");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  // Vérifie que tous les mots cibles sont présents
  const sentenceLower = parsed.sentence.toLowerCase();
  const missingWords = targetWords.filter(
    (w) => !sentenceLower.includes(w.toLowerCase())
  );

  if (missingWords.length > 0) {
    // Retry avec insistance
    return generateDictationSentenceRetry(params, missingWords);
  }

  return {
    text: parsed.sentence,
    wordsUsed: parsed.wordsUsed || targetWords,
  };
}

async function generateDictationSentenceRetry(
  params: GenerateSentenceParams,
  missingWords: string[]
): Promise<GeneratedSentence> {
  const { targetWords, level = "ce1" } = params;

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: `Génère une phrase courte et amusante pour un enfant de niveau ${level} en français qui contient OBLIGATOIREMENT ces mots: ${targetWords.join(", ")}.

Ces mots manquaient: ${missingWords.join(", ")}. Ils DOIVENT être dans la phrase.

Réponds avec un JSON: {"sentence": "...", "wordsUsed": [...]}`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") throw new Error("Erreur Claude");

  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Format invalide");

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    text: parsed.sentence,
    wordsUsed: parsed.wordsUsed || targetWords,
  };
}
