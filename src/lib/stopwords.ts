// Mots trop communs pour être intéressants à apprendre (articles, prépositions, conjonctions)
export const FRENCH_STOPWORDS = new Set([
  "le","la","les","l","un","une","des","du","de","d",
  "et","ou","mais","donc","or","ni","car","que","qui","quoi","dont","où",
  "à","au","aux","en","dans","sur","sous","par","pour","avec","sans","entre",
  "vers","chez","jusqu","depuis","pendant","avant","après","contre",
  "il","elle","ils","elles","je","tu","nous","vous","on","me","te","se","lui","y","en",
  "ce","cette","ces","cet","mon","ma","mes","ton","ta","tes","son","sa","ses","notre",
  "votre","leur","leurs","mon","ma",
  "est","sont","était","étaient","a","ont","avait","avaient","été","avoir",
  "se","si","ne","pas","plus","très","bien","aussi","même","tout","tous","toute","toutes",
  "plus","moins","très","trop","assez","peu","beaucoup",
  "quand","comme","car","puis","alors","ensuite","enfin","donc",
  "là","ici","voici","voilà",
]);

// Nettoie un mot (minuscules, sans ponctuation)
export function cleanWord(word: string): string {
  return word.toLowerCase().replace(/[^a-zàâäéèêëîïôùûüç'-]/g, "");
}

// Tokenise une phrase en mots significatifs (exclut noms propres et stopwords)
export function extractSignificantWords(sentence: string): string[] {
  // Sépare les tokens en gardant les espaces pour détecter la position
  const tokens = sentence.split(/(\s+|[,;:!?.«»""''()\-]+)/);

  const words: string[] = [];
  let isFirstToken = true;

  for (const token of tokens) {
    const trimmed = token.trim();
    if (!trimmed || /^[\s,;:!?.«»""''()\-]+$/.test(trimmed)) {
      if (trimmed) isFirstToken = false;
      continue;
    }

    const clean = cleanWord(trimmed);
    if (clean.length < 2) { isFirstToken = false; continue; }
    if (FRENCH_STOPWORDS.has(clean)) { isFirstToken = false; continue; }

    // Exclut les noms propres : mot avec majuscule qui n'est PAS en début de phrase
    const startsWithUpper = trimmed[0] === trimmed[0].toUpperCase() && trimmed[0] !== trimmed[0].toLowerCase();
    if (startsWithUpper && !isFirstToken) { isFirstToken = false; continue; }

    words.push(clean);
    isFirstToken = false;
  }

  return [...new Set(words)];
}
