# 📋 Guide d'utilisation - Page Inscriptions

## 🎯 Accès rapide
**Menu** → **Inscriptions** (2ème élément du menu)

---

## 📝 Workflow complet d'une inscription

### 1️⃣ **Nouvelle demande d'inscription**
```
Étudiant remplit le formulaire → Inscription créée (statut: EN_ATTENTE)
```

**Action :** Cliquer sur le bouton **"+ Nouvelle inscription"**

**Informations requises :**
- Prénom
- Nom
- Email (unique, généré automatiquement si doublon)
- Téléphone
- Formation souhaitée
- Notes (optionnel)

**Résultat :** Inscription créée avec statut **EN_ATTENTE**

---

### 2️⃣ **Validation de l'inscription** ⭐ ÉTAPE IMPORTANTE

**Bouton :** Cliquer sur l'icône ✅ (CheckCircle) dans la colonne "Actions"

**Ce qui se passe automatiquement :**

1. **Création du compte étudiant**
   - Email : généré automatiquement (ex: ahmed.belkacem@ecole.dz)
   - Mot de passe : "password123" (à changer)
   - QR Code : généré automatiquement (format: STU-{id}-{timestamp})

2. **Création de l'affectation (Enrollment)**
   - L'étudiant est affecté à la formation choisie
   - Statut : ACTIVE

3. **Statut inscription → VALIDEE**

4. **Affichage du reçu imprimable**
   - Informations étudiant
   - Formation
   - QR Code
   - Logo de l'école "Inspired Academy by Nana"

---

### 3️⃣ **Paiement des frais d'inscription** (Optionnel)

Si la formation nécessite des frais d'inscription :

**Bouton :** Cliquer sur l'icône 💳 (Payment) 

**Dialog de paiement :**
- Montant : (pré-rempli avec le montant des frais)
- Méthode : Espèces / Carte bancaire / Virement / Chèque
- Reçu par : Nom de l'admin

**Après paiement :**
- Statut paiement : ✅ Payé
- Date de paiement enregistrée
- Possibilité d'imprimer le reçu

---

### 4️⃣ **Génération de l'échéancier** (NOUVELLE FONCTIONNALITÉ)

**Après validation, deux options :**

#### Option A : Génération manuelle (ACTUEL)
1. Aller dans **"Étudiants"**
2. Trouver l'étudiant validé
3. Voir ses affectations
4. Depuis la page **"Échéanciers"**, filtrer par étudiant
5. Générer l'échéancier via API

#### Option B : Génération automatique (À IMPLÉMENTER)
L'échéancier sera créé automatiquement lors de la validation

---

## 🎨 Interface de la page Registrations

```
┌──────────────────────────────────────────────────────────────────┐
│  📋 GESTION DES INSCRIPTIONS                                     │
│  ┌──────────────────┐  ┌──────────────────────────────────────┐ │
│  │ + Nouvelle       │  │ Filtrer par statut: [Tous ▼]         │ │
│  │   inscription    │  │                                       │ │
│  └──────────────────┘  └──────────────────────────────────────┘ │
│                                                                  │
│  📊 Statistiques :                                               │
│  🟡 En attente: 5  |  ✅ Validées: 12  |  ❌ Rejetées: 2        │
│                                                                  │
│  📋 TABLEAU DES INSCRIPTIONS                                     │
│  ┌─────────┬─────────┬────────────┬──────────┬────────┬───────┐│
│  │ Nom     │ Email   │ Formation  │ Statut   │ Frais  │Actions││
│  ├─────────┼─────────┼────────────┼──────────┼────────┼───────┤│
│  │ Ahmed B.│ ahmed@..│ Dev Web    │🟡EN_ATTENTE│❌Non  │✅❌👁💳││
│  │ Fatima K│ fatima@.│ Anglais    │✅VALIDEE  │✅Payé │  👁🖨  ││
│  │ Karim M.│ karim@..│ Comptab.   │🟡EN_ATTENTE│❌Non  │✅❌👁💳││
│  └─────────┴─────────┴────────────┴──────────┴────────┴───────┘│
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔑 Actions disponibles

### Pour une inscription **EN_ATTENTE** :

| Icône | Action | Description |
|-------|--------|-------------|
| ✅ | **Valider** | Crée l'étudiant + affectation + QR code |
| ❌ | **Rejeter** | Change le statut en REJETEE |
| 👁️ | **Détails** | Affiche toutes les infos |
| 💳 | **Paiement** | Enregistrer les frais d'inscription |

### Pour une inscription **VALIDEE** :

| Icône | Action | Description |
|-------|--------|-------------|
| 👁️ | **Détails** | Voir les informations complètes |
| 🖨️ | **Imprimer** | Imprimer le reçu avec QR code |
| 💳 | **Paiement** | Si frais non encore payés |

---

## 🎯 Filtres disponibles

Dans le menu déroulant "Filtrer par statut" :

- **Tous** : Affiche toutes les inscriptions
- **EN_ATTENTE** : À traiter (nécessitent validation/rejet)
- **VALIDEE** : Inscriptions acceptées
- **REJETEE** : Inscriptions refusées
- **ANNULEE** : Inscriptions annulées

---

## 🔔 Notifications Snackbar

Après chaque action, une notification apparaît :

- ✅ **Succès (Vert)** : "Inscription validée avec succès"
- ❌ **Erreur (Rouge)** : "Erreur lors de la validation"
- ⚠️ **Attention (Orange)** : "Cette inscription est déjà validée"
- ℹ️ **Info (Bleu)** : "Paiement enregistré"

---

## 🖨️ Reçu imprimable

Lors de la validation, un reçu s'affiche avec :

```
┌─────────────────────────────────────────┐
│  🎓 Inspired Academy by Nana            │
│     Bouinan, Blida                      │
│     +213 770 029 426 / 425              │
│                                         │
│  📋 REÇU D'INSCRIPTION                  │
│                                         │
│  Étudiant: Ahmed Belkacem               │
│  Email: ahmed.belkacem@ecole.dz         │
│  Téléphone: 0770123456                  │
│                                         │
│  Formation: Développement Web Fullstack │
│  Date: 09/11/2025                       │
│                                         │
│  [QR CODE]                              │
│  STU-123-1699545600                     │
│                                         │
│  Signature: _______________             │
└─────────────────────────────────────────┘
```

**Boutons disponibles :**
- 🖨️ Imprimer
- ⬇️ Télécharger PDF
- ✖️ Fermer

---

## 🚀 Workflow recommandé

### Pour traiter les inscriptions :

1. **Filtrer par "EN_ATTENTE"** pour voir les nouvelles demandes
2. **Cliquer sur 👁️** pour vérifier les détails
3. **Valider ✅** si tout est correct
4. **Le reçu s'affiche** automatiquement → Imprimer
5. **Enregistrer le paiement 💳** si nécessaire
6. **L'étudiant est créé** → Visible dans "Étudiants"
7. **Générer l'échéancier** depuis "Échéanciers"

---

## ⚠️ Points importants

### ✅ À faire :
- Valider les inscriptions rapidement
- Imprimer/envoyer le reçu à l'étudiant
- Vérifier que l'email est correct (communication future)
- Enregistrer les paiements des frais d'inscription
- Générer l'échéancier après validation

### ❌ À éviter :
- Ne pas rejeter sans raison (noter la raison dans les détails)
- Ne pas valider deux fois la même inscription
- Ne pas oublier d'enregistrer le paiement des frais

---

## 🔄 Prochaines améliorations

- ✅ Génération automatique de l'échéancier lors de la validation
- 📧 Envoi automatique d'email de confirmation à l'étudiant
- 📱 Envoi du QR code par SMS
- 🔔 Notifications pour nouvelles inscriptions
- 📊 Statistiques avancées (taux de conversion, délai moyen de traitement)

---

## 🆘 Besoin d'aide ?

**Contact :** 
- Téléphone : +213 770 029 426
- Téléphone : +213 770 029 425
- Adresse : Bouinan, Blida

---

**Dernière mise à jour :** 09 Novembre 2025
**Version :** 2.0 (Système d'échéanciers intégré)
