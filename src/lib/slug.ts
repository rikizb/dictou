/**
 * Génère un slug URL-safe à partir d'un nom + 4 caractères aléatoires
 * Ex: "Mots CE2 difficiles" → "mots-ce2-difficiles-a3f7"
 */
export function generateSlug(name: string): string {
  const base = name
    .normalize("NFD") // décompose les accents
    .replace(/[\u0300-\u036f]/g, "") // supprime les diacritiques
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // supprime les caractères spéciaux
    .trim()
    .replace(/[\s-]+/g, "-") // remplace espaces/tirets multiples par un tiret
    .slice(0, 50); // limite la longueur

  const suffix = Math.random().toString(36).substring(2, 6); // 4 chars aléatoires
  return `${base}-${suffix}`;
}
