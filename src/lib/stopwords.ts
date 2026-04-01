// Mots trop communs pour être intéressants à apprendre (articles, prépositions, conjonctions)
export const FRENCH_STOPWORDS = new Set([
  // Articles
  "le","la","les","l","un","une","des","du","de","d",
  // Conjonctions
  "et","ou","mais","donc","or","ni","car","que","qui","quoi","dont","où",
  "quoique","lorsque","puisque","parce","quand","comme","si","tandis","bien",
  // Prépositions
  "à","au","aux","en","dans","sur","sous","par","pour","avec","sans","entre",
  "vers","chez","jusqu","depuis","pendant","avant","après","contre","selon",
  "malgré","parmi","hormis","sauf","dès","hors","outre","via",
  // Pronoms personnels
  "il","elle","ils","elles","je","tu","nous","vous","on","me","te","se","lui","y","en",
  // Pronoms démonstratifs
  "ce","cet","cette","ces","ci","celui","celle","ceux","celles","ceci","cela","ça",
  // Pronoms possessifs (sources d'erreurs !)
  "mien","mienne","miens","miennes",
  "tien","tienne","tiens","tiennes",
  "sien","sienne","siens","siennes",
  "nôtre","vôtre","leur","leurs",
  // Adjectifs possessifs
  "mon","ma","mes","ton","ta","tes","son","sa","ses","notre","votre",
  // Verbes auxiliaires et courants
  "est","sont","était","étaient","a","ont","avait","avaient","été","avoir",
  "faire","fait","faite","faits","faites","être","aller","va","vais","vont","allait",
  "dire","dit","dite","voir","vu","venir","vient","venu",
  // Adverbes courants
  "se","si","ne","pas","plus","très","bien","aussi","même","tout","tous","toute","toutes",
  "moins","trop","assez","peu","beaucoup","encore","déjà","jamais","souvent","toujours",
  "puis","alors","ensuite","enfin","donc","ainsi","aussi","voilà","voici",
  "là","ici","ailleurs","partout","nulle","quelque",
  // Particules
  "oui","non","peut","doit","faut","soit",
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
    if (clean.length < 3) { isFirstToken = false; continue; }
    if (FRENCH_STOPWORDS.has(clean)) { isFirstToken = false; continue; }

    // Exclut les noms propres : mot avec majuscule qui n'est PAS en début de phrase
    const startsWithUpper = trimmed[0] === trimmed[0].toUpperCase() && trimmed[0] !== trimmed[0].toLowerCase();
    if (startsWithUpper && !isFirstToken) { isFirstToken = false; continue; }

    words.push(clean);
    isFirstToken = false;
  }

  return [...new Set(words)];
}
