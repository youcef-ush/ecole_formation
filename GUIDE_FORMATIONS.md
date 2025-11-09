# 📚 Guide - Nouvelle Structure des Formations

## 🎯 Vue d'ensemble

Le système propose désormais **3 types de formations** avec des formulaires adaptés à chaque besoin.

---

## 1️⃣ COURS DE SOUTIEN (GROUPE) 👥

### Configuration automatique
Le **nom de la formation est généré automatiquement** selon ce format :

```
[Année Scolaire] - [Niveau] (Branche si lycée) - [Module] - Groupe X
```

### Exemples :
```
2025-2026 - 3ème année primaire - Mathématiques
2025-2026 - 1ère année secondaire (Sciences Expérimentales) - Physique
2025-2026 - 2ème année secondaire (Toutes branches) - Arabe
2025-2026 - 3ème année secondaire (Toutes branches) - Mathématiques - Groupe 2
```

### Champs du formulaire :

| Champ | Type | Description |
|-------|------|-------------|
| **Niveau Scolaire** | Sélection | Primaire (1AP-5AP), Collège (1AM-4AM), Lycée (1AS-3AS) |
| **Branche** | Sélection conditionnelle | **Affiché seulement pour 1AS** - Choix d'une branche |
| **Toutes Branches** | Auto-sélection | **Pour 2AS/3AS** - Toutes les branches sélectionnées automatiquement |
| **Module/Matière** | Sélection | Maths, Physique, Arabe, Français, etc. |
| **Professeur** | Sélection | Liste des formateurs |
| **Numéro de Groupe** | Nombre | Par défaut: 1 |
| **Prix par Mois (DA)** | Nombre | Abonnement mensuel |

### Fonctionnement des branches :

#### 🟢 1ère AS (1AS) - Tronc Commun
- **Une seule branche à sélectionner** parmi les 2 branches du tronc commun :
  - **Sciences et Technologie**
  - **Lettres et Langues Étrangères**

#### 🟢 2ème AS (2AS) et 3ème AS (3AS) - Spécialisation
- **Toutes les branches sont automatiquement sélectionnées**
- Pas de choix manuel
- Les 6 branches de spécialisation :
  - Sciences Expérimentales
  - Mathématiques  
  - Techniques Mathématiques
  - Gestion et Économie
  - Lettres et Philosophie
  - Langues Étrangères
- Le système génère : "(Toutes branches)" dans le titre

#### 🟢 Primaire et Collège
- **Aucune sélection de branche**
- Pas de champ branche affiché

### Résultat dans la base de données :

```json
{
  "title": "2025-2026 - 2ème année secondaire (Toutes branches) - Mathématiques",
  "type": "TUTORING_GROUP",
  "category": "Soutien scolaire",
  "schoolLevels": ["2AS"],
  "lyceeBranches": [
    "Sciences Expérimentales",
    "Mathématiques",
    "Techniques Mathématiques",
    "Gestion et Économie",
    "Lettres et Philosophie",
    "Langues Étrangères"
  ],
  "subjectModule": "Mathématiques",
  "trainerId": 5,
  "pricePerMonth": 3000,
  "durationMonths": 12
}
```

---

## 2️⃣ COURS INDIVIDUEL 👤

### Pour des cours personnalisés avec un seul étudiant

### Champs du formulaire :

| Champ | Type | Description |
|-------|------|-------------|
| **Étudiant** | Sélection | Choisir l'étudiant parmi la liste |
| **Professeur** | Sélection | Formateur assigné |
| **Module/Matière** | Sélection | Matière enseignée |
| **Créneau Horaire** | Sélection | Jour et heure du cours |
| **Prix par Heure (DA)** | Nombre | Tarif horaire |

### Nom généré automatiquement :
```
Cours Individuel - [Module] - [Prénom Nom de l'étudiant]
```

### Exemple :
```
Cours Individuel - Mathématiques - Ahmed Belkacem
```

### Résultat dans la base de données :

```json
{
  "title": "Cours Individuel - Mathématiques - Ahmed Belkacem",
  "type": "TUTORING_INDIVIDUAL",
  "category": "Soutien scolaire",
  "subjectModule": "Mathématiques",
  "trainerId": 3,
  "timeSlotId": 7,
  "pricePerSession": 500
}
```

---

## 3️⃣ FORMATION QUALIFIANTE 🎓

### Pour les formations professionnelles (école privée)

### Champs du formulaire :

| Champ | Type | Description |
|-------|------|-------------|
| **Nom de la Formation** | Texte | Nom complet de la formation |
| **Formateur** | Sélection | Responsable de la formation |
| **Durée (mois)** | Nombre | Durée totale en mois |
| **Nombre de Places** | Nombre | Capacité maximale |
| **Prix de la Formation (DA)** | Nombre | Coût total |
| **Description** | Texte long | Contenu détaillé |

### Exemples :
```
- Développement Web Fullstack (3 mois, 45 000 DA)
- Pâtisserie Professionnelle (6 mois, 90 000 DA)
- Comptabilité Générale (4 mois, 60 000 DA)
```

### Résultat dans la base de données :

```json
{
  "title": "Développement Web Fullstack",
  "type": "QUALIFYING",
  "category": "Formation professionnelle",
  "trainerId": 2,
  "durationMonths": 3,
  "maxStudents": 15,
  "price": 45000,
  "description": "Formation complète...",
  "certificate": "Certificat école"
}
```

---

## 📊 Tableau comparatif

| Caractéristique | Cours Groupe | Cours Individuel | Formation |
|----------------|--------------|------------------|-----------|
| **Nom** | ✅ Auto-généré | ✅ Auto-généré | ❌ Manuel |
| **Durée** | 12 mois (année scolaire) | À la séance | X mois |
| **Prix** | Par mois | Par heure | Total |
| **Étudiants** | Groupe illimité | 1 seul | X places max |
| **Branches** | ✅ Gestion auto | ❌ Non | ❌ Non |
| **Créneau** | ❌ Non (à définir via session) | ✅ Oui | ❌ Non |

---

## 🔧 Configuration requise

### Avant de créer une formation :

1. **Créer des Formateurs** (Menu "Formateurs")
   - Ajouter les professeurs/formateurs

2. **Créer des Créneaux** (Menu "Créneaux") - *Pour cours individuels*
   - Définir les horaires disponibles

3. **Avoir des Étudiants** (Menu "Étudiants") - *Pour cours individuels*
   - Les étudiants doivent être validés via Inscriptions

---

## 💡 Cas d'usage

### Scénario 1 : Cours de soutien en Maths pour toute la 2AS
```
Type: Cours de Soutien (Groupe)
Niveau: 2ème année secondaire
→ Toutes les branches sélectionnées automatiquement
Module: Mathématiques
Prof: M. Karim
Prix: 3000 DA/mois
→ Nom généré: "2025-2026 - 2ème année secondaire (Toutes branches) - Mathématiques"
```

### Scénario 2 : Cours d'Arabe pour 1AS Sciences
```
Type: Cours de Soutien (Groupe)
Niveau: 1ère année secondaire
Branche: Sciences et Technologie (choix manuel - tronc commun)
Module: Arabe
Prof: Mme Fatima
Prix: 3000 DA/mois
→ Nom généré: "2025-2026 - 1ère année secondaire (Sciences et Technologie) - Arabe"
```

### Scénario 3 : Cours particulier pour Ahmed
```
Type: Cours Individuel
Étudiant: Ahmed Belkacem
Prof: M. Karim
Module: Physique
Créneau: Lundi 14h-16h
Prix: 500 DA/heure
→ Nom généré: "Cours Individuel - Physique - Ahmed Belkacem"
```

### Scénario 4 : Formation professionnelle
```
Type: Formation Qualifiante
Nom: Développement Web Fullstack
Prof: M. Yacine
Durée: 3 mois
Places: 15
Prix: 45 000 DA
Description: "Formation complète incluant HTML, CSS, JavaScript..."
```

---

## 🎨 Aperçu visuel du formulaire

### Cours de Soutien (Groupe)
```
┌──────────────────────────────────────────────┐
│ Type: [Cours de Soutien (Groupe) ▼]         │
│                                              │
│ ℹ️ Le nom sera généré automatiquement       │
│                                              │
│ Niveau Scolaire: [2ème année secondaire ▼]  │
│                                              │
│ ✅ Toutes les branches sélectionnées :      │
│ [Sciences Exp.] [Maths] [Tech. Maths]...    │
│                                              │
│ Module: [Mathématiques ▼]                   │
│ Professeur: [M. Karim ▼]                    │
│ Groupe: [1]                                  │
│ Prix/mois: [3000] DA                         │
│                                              │
│ 📝 Nom: 2025-2026 - 2ème année secondaire   │
│         (Toutes branches) - Mathématiques    │
└──────────────────────────────────────────────┘
```

---

## ⚠️ Points importants

### ✅ À retenir :
- **1AS (Tronc commun)** : Sélection d'**une des 2 branches** (Sciences et Technologie OU Lettres et Langues Étrangères)
- **2AS/3AS (Spécialisation)** : **Toutes les 6 branches** sélectionnées automatiquement (pas de choix)
- **Primaire/Collège** : **Pas de branche** (champ masqué)
- Le **numéro de groupe** permet de créer plusieurs groupes pour le même niveau/module
- Le **prix par mois** pour cours de groupe est un abonnement mensuel
- Les **cours individuels** nécessitent un étudiant et un créneau défini

### ❌ Erreurs courantes à éviter :
- Ne pas essayer de modifier manuellement les branches pour 2AS/3AS
- Ne pas oublier de sélectionner la branche pour 1AS
- Vérifier que le formateur existe avant de créer la formation
- S'assurer que les créneaux sont créés pour les cours individuels

---

## 🚀 Workflow recommandé

### Pour créer un cours de soutien :
1. Cliquer sur "Ajouter une Formation"
2. Sélectionner "Cours de Soutien (Groupe)"
3. Choisir le niveau scolaire
4. **Si 1AS** : Choisir UNE des 2 branches du tronc commun
5. **Si 2AS/3AS** : Les 6 branches de spécialisation sont auto-sélectionnées
6. Sélectionner module, prof, prix
7. Vérifier le nom généré
8. Créer

### Pour créer un cours individuel :
1. S'assurer que l'étudiant existe
2. S'assurer qu'un créneau est disponible
3. Sélectionner étudiant, prof, module, créneau
4. Définir le prix par heure
5. Créer

### Pour créer une formation :
1. Préparer le nom complet
2. Définir la durée et le prix
3. Rédiger une description détaillée
4. Créer

---

**Dernière mise à jour :** 09 Novembre 2025  
**Version :** 3.0 - Nouvelle structure des formations
