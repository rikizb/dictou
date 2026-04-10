# Stratégie de Monétisation Dictou — Long Terme

---

## Philosophie

**Le core reste gratuit à vie.** La dictée, les listes partagées, l'utilisation sans compte — tout ça ne se touche pas. C'est le moteur viral.

**On monétise la valeur ajoutée**, pas le produit de base. Les parents paient pour le suivi. Les enseignants paient pour le gain de temps. Les écoles paient pour la conformité institutionnelle.

---

## Phase 1 — Fondations (Mois 1-3)

### Stripe Checkout — Un seul plan pour commencer

**Plan Famille — 29€/an** (ou 3,99€/mois)
- Historique illimité (vs 30 jours gratuit)
- Rapport PDF hebdomadaire exportable
- Jusqu'à 3 enfants
- Pas de pub (si pub ajoutée en gratuit un jour)

**Argumentaire de vente :**
> "29€/an. C'est le prix d'un cahier de dictées. Mais celui-ci s'adapte aux mots de VOTRE enfant, génère des exercices infinis, et vous dit exactement quels mots retravailler."

**Déclencheur de conversion (paywall doux) :**
- Rapport de progression visible mais flou après 30 jours → upgrade pour déverrouiller
- Export PDF bloqué en gratuit
- Banner subtile dans le dashboard après 5 sessions : "📊 Voir la progression de [Prénom] cette semaine →"

**Implémentation technique :**
- Stripe Checkout (pas Stripe Elements — trop complexe)
- Webhook `/api/stripe/webhook` → champ `isPremium` en DB
- Pas de downgrade automatique brutal — grace period 7 jours après expiration

---

## Phase 2 — B2B Enseignants (Mois 3-6)

### Plan Professeur — 4,90€/mois ou 39€/an

**Fonctionnalités exclusives :**
- Dashboard classe (performances anonymisées des élèves abonnés)
- Listes privées non-copiables (mode "dictée officielle")
- Export CSV des résultats pour bulletin
- Badge "Classe de M./Mme X" sur la liste partagée
- Historique illimité des listes

**Pourquoi les enseignants paieront :**
- Gagnent 15 min/semaine de correction
- Argument : "moins cher qu'un café par semaine"
- L'établissement peut rembourser (budget pédagogique) — mettre une facture downloadable

**Acquisition enseignants :**
1. Stratégie réseaux sociaux (voir doc dédié)
2. Contenu SEO `/dictee-cp`, `/dictee-ce1`...
3. Café Pédagogique article/publi
4. Newsletter CAFIPEMF

---

## Phase 3 — B2B Établissements (Mois 6-18)

### Plan École — 199€/an à 499€/an

**Tiers selon taille :**
- Petite école (1-5 classes) : 199€/an
- École standard (6-15 classes) : 399€/an  
- École grande (15+ classes) : 499€/an + devis

**Fonctionnalités :**
- Toutes les classes sur un seul compte admin
- SSO ou code établissement simplifié
- Tableau de bord directeur (vue école anonymisée)
- Personnalisation : logo école, nom de l'établissement
- Reporting RGPD / DPO sur demande
- Facture pour comptabilité établissement

**Canal de vente :**
- Appels directs aux directeurs d'école (70 schools = 1 journée de phoning)
- Réseaux DANE (Délégation Académique au Numérique Éducatif)
- ENT (Espace Numérique de Travail) — intégration possible si volume
- Salons éducation : Educatec, Forum des Enseignants Innovants

**Processus commercial :**
1. Email personnalisé au directeur avec démo vidéo 2 min
2. Appel 15 min pour montrer l'outil
3. Période d'essai 1 mois classe entière
4. Conversion avec facture établissement

---

## Phase 4 — Produits Additionnels (Mois 12+)

### Mode Audio — Dictée Aveugle (différenciateur majeur)

**Ce que c'est :** L'enfant n'a plus la phrase sous les yeux. Il entend les mots dictés par une voix naturelle (TTS). Il écrit. Il valide.

**Pourquoi c'est crucial :**
- C'est une VRAIE dictée (pas juste lire et cocher)
- Différenciateur vs tous les concurrents
- Les parents l'attendent — c'est la demande n°1

**Stack technique :**
- OpenAI TTS (voix `onyx` ou `nova` — natural French): 0,015€/1000 chars
- Cache audio en base (même phrase = même audio)
- Coût estimé : ~0,002€ par session (20 mots, 200 chars)

**Positionnement :**
- Gratuit en mode limité (3 dictées audio/semaine)
- Illimité en plan Famille

**Calendrier :** Implémenter en parallèle du paywall. C'est LE déclencheur de conversion.

### Mode Examen — Dictée Chronométrée Officielle

- Temps imparti (comme en classe)
- Notation officielle /20
- Rapport PDF imprimable avec score
- "Simule la dictée du vendredi"
- **Premium uniquement**

### Profils Enfants Multiples

- Compte parent → plusieurs profils enfants
- Chaque enfant a ses mots, son niveau, son historique
- Compétition fraternelle
- **Débloque le plan "Famille Duo" à 5,99€/mois**

### Bibliothèque de Listes Certifiées

- Listes officielles par niveau, programme, semaine
- Créées par des enseignants certifiés Dictou
- Labellisées "Listes Dictou Officiel"
- Gratuites pour les abonnés
- Les enseignants contributeurs gagnent une commission (marketplace)

---

## Modèle Économique Cible (An 2)

### Hypothèses conservatives

| Segment | Utilisateurs | Conversion | Prix | MRR |
|---|---|---|---|---|
| Familles gratuites | 5 000 | 8% | 2,42€/mois (29€/an) | 970€ |
| Familles premium | 400 | — | 3,99€/mois | 1 596€ |
| Enseignants | 150 | — | 3,25€/mois (39€/an) | 487€ |
| Écoles | 20 | — | 25€/mois moy. | 500€ |
| **Total MRR** | | | | **~3 500€** |
| **Total ARR** | | | | **~42 000€** |

### Hypothèses optimistes (si stratégie enseignant fonctionne)

| Segment | Utilisateurs | MRR |
|---|---|---|
| Familles premium | 1 500 | 6 000€ |
| Enseignants | 500 | 1 625€ |
| Écoles | 80 | 2 500€ |
| **Total MRR** | | **~10 000€** |
| **Total ARR** | | **~120 000€** |

---

## Gestion des Coûts

### Coût variable principal : Claude API

**Situation actuelle :**
- ~0,005€ par phrase générée (Sonnet 4.6, ~300 tokens input + 100 output)
- 1 session = 5-8 phrases = ~0,03€
- 1 000 sessions/mois = ~30€ (marginal)

**Optimisation si volume :**
1. Cache PostgreSQL des phrases : stocker les phrases générées par (niveau, mots_hash). Si un utilisateur a les mêmes mots, réutiliser. Réduction estimée : 40-60%.
2. Haiku pour CP/CE1 (niveau simple) : 10x moins cher que Sonnet. Basculer automatiquement selon le niveau.
3. Rate limiting : max 50 phrases/jour/compte gratuit.

**Règle :** Le coût Claude ne doit pas dépasser 25% du MRR.

### Infrastructure

- Vercel : gratuit jusqu'à 100K requêtes/mois, puis ~20€/mois Pro
- Neon/Supabase : gratuit jusqu'à 0.5GB, puis ~20€/mois
- Clerk : gratuit jusqu'à 10K MAU, puis ~25€/mois
- Resend (emails) : 3 000 emails/mois gratuit, puis ~20€/mois

**Break-even infra :** ~85€/mois — atteint avec ~35 abonnés famille.

---

## Risques & Mitigation

### 1. Dépendance Anthropic
- **Risque :** Changement de pricing, disponibilité
- **Mitigation :** Cache phrases + fallback vers GPT-4o-mini si API down

### 2. Concurrence institutionnelle
- **Risque :** Larousse/Bescherelle/Nathan lance quelque chose de similaire
- **Mitigation :** Vitesse d'exécution + moat communautaire (listes partagées) + B2B enseignants établi avant qu'ils réagissent

### 3. RGPD enfants
- **Risque :** CNIL sanction si données enfants mal gérées
- **Mitigation :** Ajouter checkbox "ce compte représente un enfant de moins de 15 ans" + consentement parental explicite avant levée/partenariat institutionnel

### 4. Dépendance Clerk
- **Risque :** Bloquant pour contrats ENT/Education Nationale
- **Mitigation :** Architecture permet migration vers NextAuth sans changer la DB (clerkId peut devenir userId générique)

---

## Roadmap Technique Monétisation

### Sprint 1 (2 semaines)
- [ ] Stripe Checkout intégration (plan Famille 29€/an)
- [ ] Webhook Stripe → champ `isPremium` sur User
- [ ] Paywall doux : export PDF bloqué + banner après 5 sessions
- [ ] Page /premium avec argumentaire

### Sprint 2 (2 semaines)
- [ ] Mode audio (OpenAI TTS) — 3 dictées/semaine gratuit
- [ ] Streak journalier (champ `lastPracticeDate` + flamme dashboard)
- [ ] Email hebdo automatique via Resend

### Sprint 3 (1 mois)
- [ ] Plan Professeur 39€/an
- [ ] Dashboard classe (vues anonymisées performances élèves abonnés)
- [ ] Listes privées non-copiables

### Sprint 4 (2 mois)
- [ ] Profils enfants multiples
- [ ] Plan Famille Duo 5,99€/mois
- [ ] Rapport PDF exportable

### Sprint 5 (3-6 mois)
- [ ] Plan École + facturation établissement
- [ ] Bibliothèque listes certifiées
- [ ] Mode Examen avec notation

---

*Document mis à jour : avril 2026*
