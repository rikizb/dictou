# Dictou — Spécifications fonctionnelles F4 & F5

**Version :** 1.0
**Date :** 2026-04-01
**Statut :** Draft — prêt pour développement
**Stack :** Next.js 15, Prisma/PostgreSQL, Clerk, Tailwind CSS

---

## Contexte DB existant (rappel)

```
User      → id (cuid), clerkId, name, avatar
Word      → id, userId, text, level (0-3), timesSeenInSentence,
            timesCorrect, timesWrong, addedAt, lastSeenAt,
            nextReviewAt, priorityScore
Session   → id, userId, startedAt, endedAt, totalSentences,
            totalWords, correctWords, xpEarned
Sentence  → id, sessionId, text, completedAt, score
SentenceWord → id, sentenceId, wordId, wasCorrect
Streak    → id, userId, current, best, lastActiveAt
```

Pas de champ `source` sur `Word` — un mot ne sait pas s'il a été saisi manuellement ou capturé en session. Ce point est structurant pour F4 (voir section modèle de données).

---

---

# F4 — UI liste de mots améliorée

## 1. User stories

| # | En tant que… | Je veux… | Pour… |
|---|---|---|---|
| US4-1 | parent | voir mes mots sous forme de liste avec une ligne par mot | lire les infos sans avoir à survoler chaque carte |
| US4-2 | parent | distinguer visuellement les mots que j'ai tapés de ceux capturés pendant les dictées | savoir d'où vient chaque mot |
| US4-3 | parent | voir pour chaque mot : son niveau, sa date d'ajout, et son taux de réussite | évaluer la progression de mon enfant au premier coup d'oeil |
| US4-4 | parent | supprimer un mot avec une confirmation explicite | éviter les suppressions accidentelles sur mobile |
| US4-5 | parent | trier ma liste par niveau, par date, ou par taux d'erreur | me concentrer sur les mots les plus problématiques |
| US4-6 | parent | chercher un mot précis dans ma liste | retrouver rapidement un mot sans scroller |

---

## 2. Modèle de données

### Modification de la table `Word`

Ajouter un champ `source` pour distinguer l'origine du mot.

```prisma
model Word {
  // ... champs existants inchangés ...

  source    WordSource @default(MANUAL)  // NOUVEAU
}

enum WordSource {
  MANUAL    // saisi par le parent dans l'interface
  CAPTURED  // détecté automatiquement pendant une dictée
}
```

**Migration Prisma :**
```
prisma migrate dev --name add_word_source
```

**Rétrocompatibilité :** Tous les mots existants reçoivent `MANUAL` par défaut (comportement de `@default(MANUAL)`). Les mots créés lors d'une session (via `/api/sentences/complete` ou toute route qui fait un `upsert` de `Word` hors saisie utilisateur) devront passer `source: "CAPTURED"` à la création.

**Fichiers à mettre à jour pour propager `CAPTURED` :**
- `src/app/api/sentences/complete/route.ts` — vérifier si des mots sont créés ici, forcer `source: CAPTURED`
- `src/app/api/words/route.ts` — le POST manuel reste `source: MANUAL` (déjà le défaut)

---

## 3. Comportement UI — vue liste

### 3.1 Structure de la page `/words`

La page reste à `src/app/(dashboard)/words/page.tsx`.

**Disposition générale (de haut en bas) :**
1. En-tête : titre + compteur total
2. Bloc "Ajouter des mots" (inchangé)
3. Barre d'outils : recherche + tri + filtre niveau (même pills qu'aujourd'hui)
4. Deux sections séparées si les deux types coexistent, ou une seule section si un seul type est présent
5. Liste des mots (voir 3.2)

### 3.2 Les deux sections

**Section A — "Mots ajoutés manuellement"**
- En-tête de section : libellé gris discret + compteur ex. `Ajoutés manuellement (12)`
- Visible uniquement si au moins 1 mot `MANUAL`

**Section B — "Mots appris en dictée"**
- En-tête de section : libellé gris discret + compteur ex. `Appris en dictée (8)`
- Petite icône distincte (ex. un éclair ou une note) à côté du titre
- Visible uniquement si au moins 1 mot `CAPTURED`

Si un seul type existe, afficher sans séparateur de section (pas d'en-tête de section inutile).

### 3.3 Ligne de mot (remplace les cards)

Chaque mot est affiché sur **une ligne horizontale** dans un tableau ou une liste `<ul>`. Hauteur fixe : `48px` (padding `py-3`).

**Colonnes (de gauche à droite) :**

| Colonne | Contenu | Largeur |
|---|---|---|
| Mot | Texte en `font-semibold`, capitalize | flex-1 |
| Niveau | Badge coloré (reprend `levelToColor` / `levelToLabel` existants) | `w-28` |
| Taux | `timesCorrect / timesSeenInSentence` en % arrondi, ou `—` si jamais vu | `w-16` text-right |
| Date | `addedAt` au format `dd/mm/yyyy` | `w-28` hidden sur mobile |
| Actions | Bouton supprimer (voir 3.4) | `w-10` |

**Responsive :**
- Mobile (< `sm`) : masquer la colonne Date ; le taux peut être réduit à `w-12`
- La grille actuelle (2→4 colonnes) est supprimée

### 3.4 Bouton supprimer — avec confirmation inline

Le bouton `×` actuel est remplacé par un flux en deux clics pour éviter les suppressions accidentelles.

**État 1 — bouton au repos :**
- Icône corbeille (`TrashIcon` Heroicons, 16px), couleur `text-gray-300`
- Visible au hover de la ligne (`group-hover:text-gray-400`) et toujours visible sur mobile
- Pas de tooltip nécessaire

**État 2 — après 1er clic :**
- La ligne passe en fond `bg-red-50`
- Le bouton corbeille est remplacé par deux boutons inline sur la même ligne :
  - "Annuler" : `text-gray-500 text-sm underline` (ou bouton ghost)
  - "Supprimer" : `bg-red-500 text-white text-sm px-3 py-1 rounded-lg`
- Timeout auto-annulation : si l'utilisateur ne confirme pas en **5 secondes**, l'état revient à l'état 1 sans suppression
- Un seul mot peut être en état 2 à la fois (un nouveau clic sur une autre corbeille annule le précédent)

**Après confirmation :**
- Suppression optimiste : la ligne disparaît immédiatement avec une animation `exit` Framer Motion (opacity + translateX)
- Appel `DELETE /api/words?id=xxx`
- Toast succès `"grenouille" supprimé`
- En cas d'erreur API : la ligne réapparaît et un toast d'erreur s'affiche

---

## 4. Barre d'outils (recherche + tri + filtre)

### Recherche
- Input texte, placeholder `Rechercher un mot…`
- Filtrage côté client en temps réel sur `word.text` (insensible à la casse)
- Pas d'appel API supplémentaire
- Si la recherche produit 0 résultat : message vide `Aucun mot ne correspond à "xxx"`

### Tri
- Sélecteur `<select>` ou groupe de boutons (selon espace disponible)
- Options :
  - `Date d'ajout (récent d'abord)` — défaut, équivalent au tri actuel `addedAt DESC`
  - `Alphabétique`
  - `Niveau (faible en premier)` — les mots `level 0` en tête
  - `Plus souvent raté` — tri par `timesWrong DESC`
- Tri côté client (les données sont déjà chargées)

### Filtre niveau
- Inchangé par rapport à l'UI actuelle (pills Tous / Nouveaux / En cours / Connus / Maîtrisés)
- Le filtre s'applique sur les deux sections simultanément

---

## 5. Endpoints API

Aucun nouvel endpoint pour F4. Modifications sur l'existant :

### `GET /api/words`
Ajouter `source` dans les champs retournés (automatique une fois la migration faite, Prisma sélectionne tous les champs par défaut).

### `POST /api/words`
Aucun changement — `source` prend `MANUAL` par défaut.

### Autres routes créant des `Word`
Identifier et patcher pour passer `source: "CAPTURED"` — à vérifier dans `sentences/complete/route.ts`.

---

## 6. Scope MVP vs hors scope

### Dans le scope F4
- Vue liste à la place de la grille cards
- Deux sections MANUAL / CAPTURED
- Suppression avec confirmation inline + timeout 5s
- Recherche côté client
- Tri côté client (4 options)
- Filtre par niveau (existant, conservé)
- Champ `source` en DB + migration

### Hors scope F4
- Modification du texte d'un mot (édition inline)
- Suppression en masse (multi-select + supprimer la sélection)
- Export de la liste (CSV, copier-coller)
- Pagination (à envisager si > 200 mots, pas MVP)
- Réordonner les mots par drag & drop
- Vue "card" comme option alternative (toggle liste/grille)

---

## 7. Critères d'acceptation

| ID | Critère | Vérifié par |
|---|---|---|
| CA4-1 | Un mot ajouté via l'interface apparaît dans la section "Ajoutés manuellement" | Test manuel |
| CA4-2 | Un mot découvert pendant une session apparaît dans "Appris en dictée" | Test manuel après une session |
| CA4-3 | Chaque ligne affiche : texte, badge niveau, taux de réussite (ou `—`), date d'ajout | Revue UI |
| CA4-4 | Sur mobile, la colonne Date est masquée, la ligne reste lisible | Devtools mobile 375px |
| CA4-5 | Cliquer une fois sur la corbeille met la ligne en fond rouge avec deux boutons (Annuler / Supprimer) | Test manuel |
| CA4-6 | Sans action, l'état de confirmation revient seul après 5 secondes | Test manuel (chrono) |
| CA4-7 | La confirmation supprime le mot et le retire de la liste instantanément (optimiste) | Test manuel |
| CA4-8 | Le champ de recherche filtre la liste en temps réel sans rechargement | Test manuel |
| CA4-9 | Les 4 options de tri réordonnent correctement la liste | Test par option |
| CA4-10 | Les filtres niveau + recherche + tri peuvent s'appliquer simultanément | Test combiné |
| CA4-11 | La migration Prisma s'exécute sans erreur sur la DB de staging | `prisma migrate deploy` |

---

---

# F5 — Listes collaboratives & partage viral

## 1. User stories

| # | En tant que… | Je veux… | Pour… |
|---|---|---|---|
| US5-1 | parent / enseignant | créer une liste nommée avec des mots | organiser mes mots par thème ou par semaine |
| US5-2 | parent / enseignant | obtenir une URL publique pour ma liste | la partager par message, email ou QR code |
| US5-3 | parent / visiteur | accéder à une liste partagée sans compte | voir les mots avant de décider de les copier |
| US5-4 | parent connecté | copier une liste partagée dans mon compte Dictou | l'utiliser comme point de départ pour les dictées de mon enfant |
| US5-5 | parent | renommer ou archiver une liste que j'ai créée | garder mon espace rangé |
| US5-6 | parent | voir toutes mes listes et combien de mots elles contiennent | avoir une vue d'ensemble |

---

## 2. Modèle de données

### Nouvelles tables

```prisma
model WordList {
  id        String   @id @default(cuid())
  slug      String   @unique  // ex: "mots-ce2-difficiles-a3f7"
  name      String            // ex: "Mots CE2 difficiles"
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  isPublic  Boolean  @default(true)   // false = liste privée (hors scope MVP)
  isArchived Boolean @default(false)  // liste archivée = masquée par défaut

  copyCount Int      @default(0)      // compteur de copies (stat virale)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  items     WordListItem[]
}

model WordListItem {
  id        String   @id @default(cuid())
  listId    String
  list      WordList @relation(fields: [listId], references: [id], onDelete: Cascade)

  word      String   // le texte du mot (dénormalisé, pas de FK vers Word)
  position  Int      @default(0)  // ordre d'affichage

  createdAt DateTime @default(now())

  @@unique([listId, word])
}
```

**Pourquoi `word` est dénormalisé dans `WordListItem` :**
- La liste partagée doit être lisible sans compte Dictou
- Un visiteur sans compte ne peut pas avoir de `Word` en DB
- Le lien `Word ↔ WordListItem` n'est pas nécessaire en MVP (la copie crée de nouveaux `Word` pour l'utilisateur qui copie)

**Relation sur `User` à ajouter :**
```prisma
model User {
  // ... existant ...
  wordLists WordList[]  // AJOUTER
}
```

**Génération du slug :**
Format : `{name-slugifié}-{4 chars aléatoires}` ex. `mots-ce2-difficiles-a3f7`
- Le slug est généré à la création, jamais modifié ensuite (l'URL partagée reste stable)
- Slugification : minuscules, tirets, suppression accents et caractères spéciaux
- Unicité garantie par `@unique` — en cas de collision (très rare), regénérer

---

## 3. Flows utilisateur

### Flow A — Créer une liste

1. Le parent va sur `/listes` (nouvelle page dans le dashboard)
2. Il clique sur `+ Nouvelle liste`
3. Une modale (ou un formulaire inline) s'ouvre avec :
   - Champ texte : nom de la liste (requis, max 60 caractères)
   - Textarea : mots à ajouter (séparés par virgules/retours à la ligne), optionnel à la création
4. Il clique `Créer`
5. La liste est créée en DB avec le slug auto-généré
6. Il arrive sur la page de détail `/listes/[id]` (vue propriétaire, authentifiée)
7. Toast : `Liste "Mots CE2 difficiles" créée !`

### Flow B — Gérer les mots d'une liste

Depuis la page de détail `/listes/[id]` :
1. Affichage de tous les mots de la liste (vue liste simple : texte + bouton supprimer)
2. Champ d'ajout en haut : même textarea que la page `/words`, séparateurs virgules/retours
3. Cliquer `Ajouter` : les mots sont ajoutés à `WordListItem` (dédupliqués)
4. Bouton de suppression par mot (simple `×`, pas de confirmation — la liste est facilement recréée)
5. Le compteur de mots en en-tête se met à jour en temps réel

### Flow C — Partager une liste

Depuis la page de détail `/listes/[id]` :
1. Le parent clique sur `Partager`
2. Un bloc s'affiche (pas de modale, juste un encadré inline) avec :
   - L'URL complète : `https://dictou.com/liste/{slug}`
   - Bouton `Copier le lien` (copie dans le presse-papier via `navigator.clipboard`)
   - Toast : `Lien copié !`
3. L'URL est publique immédiatement (pas de toggle à activer)

### Flow D — Accéder à une liste partagée (visiteur / non connecté)

1. Le visiteur ouvre `https://dictou.com/liste/{slug}`
2. Il voit une page publique avec :
   - Le nom de la liste
   - Les mots listés (lecture seule)
   - Le nombre de fois que la liste a été copiée (`copyCount`)
   - Un bouton `Utiliser cette liste dans Dictou`
3. S'il clique le bouton sans être connecté : redirect vers `/sign-in?redirect_url=/liste/{slug}`
4. Après connexion, retour sur `/liste/{slug}` (Clerk gère le redirect)

### Flow E — Copier une liste dans son compte (utilisateur connecté)

Depuis `https://dictou.com/liste/{slug}` :
1. L'utilisateur connecté voit le bouton `Copier dans mes mots`
2. Il clique
3. Les mots de `WordListItem` sont ajoutés à sa table `Word` via `upsert` (doublons ignorés)
4. `copyCount` de la liste est incrémenté de 1
5. Toast : `12 mots ajoutés à ta liste !`
6. Optionnel MVP : proposer aussi `Créer une copie de la liste` (duplique la `WordList` dans son compte) — à arbitrer

### Flow F — Gérer ses listes (vue globale)

1. Le parent va sur `/listes`
2. Il voit toutes ses listes non archivées, triées par `updatedAt DESC`
3. Chaque carte de liste affiche : nom, nombre de mots, date de création, lien `Partager`
4. Bouton `...` (menu contextuel) sur chaque carte : Renommer / Archiver / Supprimer
5. Section "Archivées" en bas de page, repliée par défaut

---

## 4. Routes de pages (Next.js App Router)

| Route | Type | Accès | Description |
|---|---|---|---|
| `/listes` | Authenticated | Connecté | Dashboard — vue de toutes ses listes |
| `/listes/[id]` | Authenticated | Propriétaire seulement | Détail + gestion d'une liste |
| `/liste/[slug]` | Public | Tout le monde | Vue publique partageable |

**Note sur les routes :**
- `/listes` (pluriel, authentifié) = espace de gestion du propriétaire
- `/liste/[slug]` (singulier, public) = URL de partage — intentionnellement différente
- `/listes/[id]` prend l'`id` cuid (pas le slug) pour l'espace authentifié — l'id ne change jamais

**Emplacement des fichiers :**
```
src/app/(dashboard)/listes/page.tsx          — liste de ses listes
src/app/(dashboard)/listes/[id]/page.tsx     — détail propriétaire
src/app/liste/[slug]/page.tsx                — page publique (hors layout dashboard)
```

---

## 5. Endpoints API

### `GET /api/lists`
Retourne toutes les listes de l'utilisateur connecté (sans archivées par défaut).

**Query params :** `?includeArchived=true` pour inclure les archivées.

**Réponse :**
```json
{
  "lists": [
    {
      "id": "clx...",
      "slug": "mots-ce2-difficiles-a3f7",
      "name": "Mots CE2 difficiles",
      "isPublic": true,
      "isArchived": false,
      "copyCount": 14,
      "itemCount": 12,
      "createdAt": "2026-03-15T10:00:00Z",
      "updatedAt": "2026-03-20T14:30:00Z"
    }
  ]
}
```

### `POST /api/lists`
Crée une nouvelle liste.

**Body :**
```json
{
  "name": "Mots CE2 difficiles",
  "words": ["grenouille", "papillon"]  // optionnel
}
```

**Réponse :** `201` + la liste créée (avec `id` et `slug`).

**Validation :** `name` requis, 1-60 caractères. `words` optionnel, tableau de strings.

### `GET /api/lists/[id]`
Retourne le détail d'une liste (avec ses items). Accès réservé au propriétaire.

**Réponse :**
```json
{
  "list": {
    "id": "clx...",
    "name": "...",
    "slug": "...",
    "items": [
      { "id": "cli...", "word": "grenouille", "position": 0 }
    ]
  }
}
```

### `PATCH /api/lists/[id]`
Renomme ou archive une liste. Accès réservé au propriétaire.

**Body (partiel) :**
```json
{ "name": "Nouveau nom" }
// ou
{ "isArchived": true }
```

**Réponse :** `200` + liste mise à jour.

### `DELETE /api/lists/[id]`
Supprime définitivement une liste et ses items. Accès réservé au propriétaire.

**Réponse :** `200 { "success": true }`

### `POST /api/lists/[id]/items`
Ajoute des mots à une liste existante. Accès réservé au propriétaire.

**Body :**
```json
{ "words": ["grenouille", "papillon", "anniversaire"] }
```

**Réponse :** `201` + items créés (doublons ignorés via `upsert`).

### `DELETE /api/lists/[id]/items/[itemId]`
Supprime un mot d'une liste. Accès réservé au propriétaire.

**Réponse :** `200 { "success": true }`

### `GET /api/public/lists/[slug]`
Route publique — retourne une liste par son slug. **Pas d'authentification requise.**

**Réponse :**
```json
{
  "list": {
    "name": "Mots CE2 difficiles",
    "slug": "mots-ce2-difficiles-a3f7",
    "copyCount": 14,
    "items": [
      { "word": "grenouille" },
      { "word": "papillon" }
    ]
  }
}
```

**Erreur si liste inexistante ou archivée :** `404 { "error": "Liste introuvable" }`

### `POST /api/public/lists/[slug]/copy`
Copie les mots d'une liste publique dans le compte de l'utilisateur connecté. **Authentification requise.**

**Body :** vide.

**Comportement :**
1. Vérifie que la liste existe et `isPublic: true`
2. Fait un `upsert` de chaque mot dans la table `Word` de l'utilisateur courant (source: `MANUAL`)
3. Incrémente `WordList.copyCount` de 1 (requête atomique `increment`)
4. Retourne le nombre de mots réellement ajoutés (hors doublons)

**Réponse :**
```json
{ "addedCount": 10, "skippedCount": 2 }
```

---

## 6. Page publique `/liste/[slug]`

### Metadata (SEO)
```typescript
export async function generateMetadata({ params }) {
  const list = await fetchList(params.slug)
  return {
    title: `${list.name} — Dictou`,
    description: `Liste de ${list.items.length} mots à dicter. Copiez-la gratuitement sur Dictou.`,
    openGraph: {
      title: list.name,
      description: `${list.items.length} mots • Copiée ${list.copyCount} fois`,
    }
  }
}
```

Cette page est un **Server Component** (ISR ou dynamique). Elle ne nécessite pas de JavaScript pour afficher les mots (bon pour le partage sur réseaux sociaux / WhatsApp preview).

### Contenu de la page publique

**Bandeau en haut :**
Logo Dictou + "L'app de dictée pour les enfants" + lien `dictou.com`

**Corps :**
- Nom de la liste en `h1`
- Compteur : `{n} mots • Copiée {copyCount} fois`
- Liste des mots (format pills ou liste simple, non interactif)
- CTA centré en bas : bouton violet `Utiliser cette liste dans Dictou`

**Comportement du CTA :**
- Si non connecté : `href="/sign-in?redirect_url=/liste/{slug}"`
- Si connecté : déclenche `POST /api/public/lists/{slug}/copy` puis toast + éventuellement redirect vers `/words`

**Note :** La page est en dehors du layout `(dashboard)`. Elle a son propre layout minimal (`src/app/liste/layout.tsx`) sans la navigation latérale du dashboard.

---

## 7. Scope MVP vs hors scope

### Dans le scope F5

- Création de liste nommée avec un slug auto-généré
- Ajout / suppression de mots dans une liste
- Renommage d'une liste
- Archivage d'une liste (masquage soft, pas de suppression)
- Suppression définitive d'une liste
- Page publique `/liste/[slug]` lisible sans compte
- Copie des mots d'une liste publique dans sa liste `Word` (upsert)
- Incrément du `copyCount`
- Bouton "Copier le lien" dans l'interface propriétaire
- SEO basique sur la page publique (generateMetadata)

### Hors scope F5 (post-MVP)

- Listes privées (`isPublic: false`) — la colonne existe mais pas l'UI pour basculer
- Duplication de la liste entière (créer sa propre `WordList` depuis une liste partagée)
- Démarrer une dictée directement depuis une liste (lier `WordList` à une `Session`)
- QR code généré en app (peut être fait côté enseignant avec n'importe quel générateur externe)
- Commentaires ou likes sur les listes publiques
- Recherche dans les listes publiques (annuaire)
- Partage de liste vers un autre utilisateur Dictou spécifique (sans URL)
- Notifications quand une liste est copiée
- Analytics détaillées par liste (qui a copié, quand)
- Historique des versions d'une liste

---

## 8. Critères d'acceptation

| ID | Critère | Vérifié par |
|---|---|---|
| CA5-1 | Un parent peut créer une liste nommée depuis `/listes` | Test manuel |
| CA5-2 | La liste créée apparaît dans la page `/listes` avec le bon nom et le bon compteur de mots | Test manuel |
| CA5-3 | Le slug généré est unique et stable (ne change pas si on renomme la liste) | Vérification en DB |
| CA5-4 | L'ajout de mots dans une liste (avec virgules / retours) fonctionne et déduplique | Test manuel |
| CA5-5 | La suppression d'un mot dans une liste retire uniquement ce mot | Test manuel |
| CA5-6 | Le renommage met à jour `name` sans changer le `slug` | Test manuel + vérification DB |
| CA5-7 | L'archivage masque la liste de la vue principale | Test manuel |
| CA5-8 | La page `/liste/{slug}` est accessible sans connexion et affiche les mots | Test navigateur privé |
| CA5-9 | La page `/liste/{slug}` retourne 404 si le slug n'existe pas | Test URL invalide |
| CA5-10 | Un visiteur non connecté cliquant "Utiliser cette liste" est redirigé vers `/sign-in` avec le bon `redirect_url` | Test manuel non connecté |
| CA5-11 | Après connexion, l'utilisateur atterrit bien sur `/liste/{slug}` | Test flow complet |
| CA5-12 | "Copier dans mes mots" ajoute les mots absents et ignore les doublons | Test avec mots partiellement déjà présents |
| CA5-13 | `copyCount` est incrémenté de 1 à chaque copie | Vérification DB après copie |
| CA5-14 | `addedCount` et `skippedCount` dans la réponse API sont corrects | Test API (Postman ou test d'intégration) |
| CA5-15 | Le bouton "Copier le lien" copie bien l'URL dans le presse-papier | Test manuel sur Chrome/Safari |
| CA5-16 | La page publique a un titre et une description OG corrects (visible via outil de debug OG) | Test via `https://opengraph.xyz` |
| CA5-17 | La suppression d'une liste supprime aussi tous ses `WordListItem` (cascade) | Vérification DB |
| CA5-18 | Un utilisateur ne peut pas modifier/supprimer la liste d'un autre utilisateur (403) | Test API avec token d'un autre compte |

---

## Résumé des fichiers à créer / modifier

### F4
| Fichier | Action |
|---|---|
| `prisma/schema.prisma` | Ajouter `enum WordSource` + champ `source` sur `Word` |
| `prisma/migrations/...` | Nouvelle migration `add_word_source` |
| `src/app/(dashboard)/words/page.tsx` | Refonte complète (vue liste, deux sections, confirmation suppression, recherche, tri) |
| `src/app/api/sentences/complete/route.ts` | Passer `source: "CAPTURED"` lors de la création de mots |

### F5
| Fichier | Action |
|---|---|
| `prisma/schema.prisma` | Ajouter `WordList`, `WordListItem`, relation `User.wordLists` |
| `prisma/migrations/...` | Nouvelle migration `add_word_lists` |
| `src/app/(dashboard)/listes/page.tsx` | CRÉER — vue de toutes ses listes |
| `src/app/(dashboard)/listes/[id]/page.tsx` | CRÉER — détail propriétaire |
| `src/app/liste/[slug]/page.tsx` | CRÉER — page publique (Server Component) |
| `src/app/liste/layout.tsx` | CRÉER — layout minimal sans dashboard nav |
| `src/app/api/lists/route.ts` | CRÉER — GET + POST |
| `src/app/api/lists/[id]/route.ts` | CRÉER — GET + PATCH + DELETE |
| `src/app/api/lists/[id]/items/route.ts` | CRÉER — POST |
| `src/app/api/lists/[id]/items/[itemId]/route.ts` | CRÉER — DELETE |
| `src/app/api/public/lists/[slug]/route.ts` | CRÉER — GET public |
| `src/app/api/public/lists/[slug]/copy/route.ts` | CRÉER — POST copie |
| `src/app/(dashboard)/layout.tsx` | Ajouter lien "Mes listes" dans la navigation |
| `src/lib/slug.ts` | CRÉER — utilitaire de génération de slug |
