# Dictou — Fiche features à développer

---

## F1 · Persistance de la session de dictée ✅ DONE

**Comportement :**
- Naviguer vers une autre page de Dictou (ex : "Mes mots") puis revenir sur "Dictée" retrouve exactement la même phrase et les mêmes mots déjà cochés
- L'état est sauvegardé dans `localStorage` à chaque changement (phase, phrase courante, mots cochés, stats)
- Le localStorage est vidé proprement quand on clique "Terminer" ou "Nouvelle session"

**Implémenté dans :** `src/app/(dashboard)/practice/page.tsx` (clé `dictou_active_session`)

---

## F2 · Système de clic simplifié ✅ DONE

**Comportement :**
- 1 clic sur un mot = ✅ bien écrit
- Mot non coché = ❌ mal écrit (automatiquement à la validation)
- Bouton unique "Continuer →" qui valide + charge la phrase suivante en un seul clic
- Suppression de l'ancienne phase "reviewing" (plus d'étape intermédiaire)

**Implémenté dans :** `src/app/(dashboard)/practice/page.tsx`

---

## F3 · Suppression de l'anneau violet sur les mots ✅ DONE

**Comportement :**
- Les mots "prioritaires" (issus de la liste de l'utilisateur) sont mis en avant uniquement dans le texte de la phrase : couleur violette + soulignage pointillé
- Dans les boutons de mots à cocher : plus de `ring` violet, tous les mots ont le même style visuel

**Implémenté dans :** `src/app/(dashboard)/practice/page.tsx`

---

## F4 · UI liste de mots améliorée

**Statut :** À faire
**Complexité :** Moyen

**Comportement souhaité :**
- Séparer visuellement les **mots saisis manuellement** des **mots auto-capturés** (appris pendant les dictées)
- Afficher les mots sous forme de liste (et non plus un tas de tags)
- Permettre la suppression individuelle de chaque mot
- Afficher des infos par mot : niveau de difficulté, date d'ajout, nb de fois raté

**Fichiers concernés :** `src/app/(dashboard)/words/` (page + composants)

---

## F5 · Listes collaboratives & partage viral

**Statut :** À faire
**Complexité :** Élevée

**Comportement souhaité :**
- Créer des **listes nommées** (ex : "Mots CE2 difficiles", "Vocabulaire de la semaine")
- Chaque liste a une **URL publique partageable** : `dictou.com/liste/[slug]`
- N'importe qui avec le lien peut **copier la liste** dans son propre compte Dictou
- Potentiel viral : les enseignants/parents partagent leurs listes
- Interface de gestion : créer, renommer, archiver, copier une liste

**Modèle de données à créer :**
- Table `WordList` : id, slug, name, userId, isPublic, createdAt
- Table `WordListItem` : id, listId, word, level
- Relation avec les sessions de dictée

**Fichiers à créer :** `src/app/liste/[slug]/`, API `/api/lists/`

---

## F6 · Auth simplifiée (magic link + pseudo)

**Statut :** À faire
**Complexité :** Élevée

**Comportement souhaité :**
- Connexion par **magic link email** uniquement (pas de mot de passe à retenir)
- L'utilisateur choisit un **pseudo public** affiché dans l'app (ex : "Papa de Léa") plutôt que son email brut
- Clerk gère déjà le magic link (passwordless) — à activer dans le dashboard Clerk
- Ajouter un champ "pseudo" dans le profil utilisateur (metadata Clerk ou table User en BDD)
- Afficher le pseudo dans la nav, le dashboard, les stats

**Fichiers concernés :** Clerk dashboard (config), `src/app/(dashboard)/layout.tsx`, potentiellement nouvelle page `/profil`

---

## Config & infra en attente

| Tâche | Détail |
|-------|--------|
| Clerk prod | Ajouter `dictou.com` et `www.dictou.com` aux URLs autorisées dans le dashboard Clerk (sinon auth cassée en prod) |
