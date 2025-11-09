# API des Échéanciers de Paiement

## Vue d'ensemble

Cette API gère automatiquement les échéanciers de paiement pour les affectations d'étudiants selon trois modèles différents :

1. **Soutien scolaire** : 12 échéances mensuelles
2. **Formations longues** (≥3 mois) : Paiements mensuels égaux
3. **Formations courtes** (<3 mois) : 2 échéances (50% au début, 50% à mi-parcours)

## Prérequis

Les cours (`courses`) doivent avoir les champs suivants remplis :
- `durationMonths` : Durée en mois de la formation
- `pricePerMonth` : Prix mensuel (pour le soutien scolaire)
- `price` : Prix total de la formation

## Endpoints

### 1. Générer un échéancier

**POST** `/api/payment-schedules/generate/:enrollmentId`

Génère automatiquement un échéancier complet pour une affectation.

**Paramètres URL :**
- `enrollmentId` : ID de l'affectation (enrollment)

**Réponse :**
```json
{
  "message": "Échéancier généré avec succès",
  "schedules": [
    {
      "id": 1,
      "enrollmentId": 5,
      "installmentNumber": 1,
      "amount": "5000.00",
      "dueDate": "2025-02-15",
      "status": "En attente",
      "paidAmount": "0.00",
      "paidDate": null,
      "paymentMethod": null,
      "notes": null
    }
  ],
  "summary": {
    "totalAmount": 15000,
    "numberOfInstallments": 3,
    "courseType": "Formation Qualifiante",
    "durationMonths": 3
  }
}
```

**Codes de statut :**
- `201` : Échéancier créé avec succès
- `400` : Échéancier existe déjà ou données manquantes
- `404` : Affectation non trouvée

---

### 2. Obtenir l'échéancier d'une affectation

**GET** `/api/payment-schedules/enrollment/:enrollmentId`

Récupère toutes les échéances d'une affectation spécifique avec statistiques.

**Réponse :**
```json
{
  "schedules": [...],
  "summary": {
    "totalAmount": 15000,
    "paidAmount": 5000,
    "remainingAmount": 10000,
    "totalInstallments": 3,
    "paidInstallments": 1,
    "overdueInstallments": 1
  }
}
```

---

### 3. Lister tous les échéanciers

**GET** `/api/payment-schedules?status=En attente&studentId=3`

Liste tous les échéanciers avec filtres optionnels.

**Query Params :**
- `status` (optionnel) : `En attente`, `Payé`, `En retard`, `Paiement partiel`, `Annulé`
- `studentId` (optionnel) : ID de l'étudiant

**Réponse :**
```json
[
  {
    "id": 1,
    "enrollmentId": 5,
    "enrollment": {
      "id": 5,
      "student": { "id": 3, "firstName": "Ahmed", "lastName": "Bensalem" },
      "course": { "id": 2, "title": "Formation Cuisine" }
    },
    "installmentNumber": 1,
    "amount": "5000.00",
    "dueDate": "2025-02-15",
    "status": "En attente"
  }
]
```

---

### 4. Obtenir les paiements en retard

**GET** `/api/payment-schedules/overdue`

Liste toutes les échéances en retard (date due passée et statut = En attente ou Paiement partiel).

**Réponse :**
```json
[
  {
    "id": 2,
    "enrollment": {
      "student": {
        "id": 3,
        "firstName": "Ahmed",
        "lastName": "Bensalem",
        "user": { "email": "ahmed.bensalem@inspiredacademy.dz" }
      },
      "course": { "title": "Formation Cuisine" }
    },
    "installmentNumber": 1,
    "amount": "5000.00",
    "dueDate": "2025-01-10",
    "status": "En retard",
    "paidAmount": "0.00"
  }
]
```

---

### 5. Enregistrer un paiement

**POST** `/api/payment-schedules/:scheduleId/pay`

Enregistre un paiement (complet ou partiel) pour une échéance.

**Corps de la requête :**
```json
{
  "amount": 5000,
  "paymentMethod": "Espèces",
  "paymentDate": "2025-01-15",
  "reference": "RECU-2025-001",
  "receivedBy": "Admin Mohammed",
  "notes": "Paiement en espèces"
}
```

**Réponse :**
```json
{
  "message": "Paiement enregistré avec succès",
  "schedule": {
    "id": 1,
    "status": "Payé",
    "paidAmount": "5000.00",
    "paidDate": "2025-01-15"
  },
  "transaction": {
    "id": 1,
    "amount": "5000.00",
    "paymentMethod": "Espèces",
    "reference": "RECU-2025-001"
  },
  "summary": {
    "totalAmount": 5000,
    "paidAmount": 5000,
    "remainingAmount": 0,
    "status": "Payé"
  }
}
```

**Notes :**
- Un paiement partiel changera le statut à `Paiement partiel`
- Un paiement complet changera le statut à `Payé` et remplira `paidDate`
- Chaque paiement crée une transaction dans l'historique

---

### 6. Obtenir l'historique des transactions

**GET** `/api/payment-schedules/:scheduleId/transactions`

Récupère toutes les transactions (paiements) effectuées pour une échéance.

**Réponse :**
```json
[
  {
    "id": 1,
    "scheduleId": 1,
    "amount": "2500.00",
    "paymentMethod": "Espèces",
    "paymentDate": "2025-01-10",
    "reference": "RECU-2025-001",
    "receivedBy": "Admin Mohammed",
    "notes": "Premier versement",
    "createdAt": "2025-01-10T14:30:00Z"
  },
  {
    "id": 2,
    "scheduleId": 1,
    "amount": "2500.00",
    "paymentMethod": "Carte bancaire",
    "paymentDate": "2025-01-15",
    "reference": "RECU-2025-002",
    "receivedBy": "Admin Mohammed",
    "notes": "Solde",
    "createdAt": "2025-01-15T10:15:00Z"
  }
]
```

---

### 7. Obtenir toutes les transactions d'un étudiant

**GET** `/api/payment-schedules/student/:studentId/transactions`

Récupère l'historique complet des paiements d'un étudiant.

**Réponse :**
```json
{
  "transactions": [...],
  "summary": {
    "totalTransactions": 5,
    "totalPaid": 25000
  }
}
```

---

### 8. Mettre à jour une échéance

**PUT** `/api/payment-schedules/:scheduleId`

Modifie les détails d'une échéance (montant, date, statut, notes).

**Corps de la requête :**
```json
{
  "amount": 6000,
  "dueDate": "2025-02-20",
  "status": "En attente",
  "notes": "Date modifiée suite à accord"
}
```

---

### 9. Supprimer un échéancier

**DELETE** `/api/payment-schedules/enrollment/:enrollmentId`

Supprime toutes les échéances d'une affectation (uniquement si aucun paiement effectué).

**Codes de statut :**
- `200` : Échéancier supprimé
- `400` : Impossible de supprimer (paiements effectués)
- `404` : Échéancier non trouvé

---

## Statuts d'échéance

| Statut | Description |
|--------|-------------|
| `En attente` | Aucun paiement effectué |
| `Paiement partiel` | Paiement partiel effectué (paidAmount < amount) |
| `Payé` | Échéance payée intégralement |
| `En retard` | Date due passée (automatique via trigger SQL) |
| `Annulé` | Échéance annulée manuellement |

---

## Méthodes de paiement

- `Espèces`
- `Carte bancaire`
- `Virement bancaire`
- `Chèque`

---

## Workflow typique

### 1. Création d'un étudiant via inscription
```
POST /api/registrations (status: PENDING)
POST /api/registrations/:id/pay (frais d'inscription)
POST /api/registrations/:id/validate (crée l'étudiant)
```

### 2. Affectation à une formation
```
POST /api/enrollments
{
  "studentId": 3,
  "courseId": 5
}
```

### 3. Génération automatique de l'échéancier
```
POST /api/payment-schedules/generate/7
```
*Note : Peut être automatisé dans le endpoint d'affectation*

### 4. Gestion des paiements
```
GET /api/payment-schedules/overdue (vérifier les retards)
POST /api/payment-schedules/2/pay (enregistrer un paiement)
GET /api/payment-schedules/student/3/transactions (voir historique)
```

---

## Base de données

### Table `payment_schedules`
- **Contrainte unique** : (enrollmentId, installmentNumber)
- **Trigger SQL** : `update_payment_schedule_status()` - Met à jour automatiquement le statut `En retard` chaque nuit

### Table `payment_transactions`
- Historique complet de tous les paiements
- Relations vers `payment_schedules`, `enrollments`, `students`

### Vue `overdue_payments`
```sql
SELECT * FROM overdue_payments;
```
Vue SQL pré-configurée pour lister les paiements en retard avec informations complètes.

---

## Exemples d'intégration

### Génération automatique lors de l'affectation

Dans `enrollments.routes.ts` :
```typescript
router.post('/', authenticate, async (req, res) => {
  // ... créer l'enrollment
  
  // Générer automatiquement l'échéancier
  const scheduleGenerator = /* appeler l'endpoint ou la fonction */;
  await scheduleGenerator.generate(enrollment.id);
  
  return res.status(201).json({ enrollment, schedules });
});
```

### Notification des retards

```typescript
// Cronjob quotidien
const overdueSchedules = await fetch('/api/payment-schedules/overdue');
for (const schedule of overdueSchedules) {
  // Envoyer email/SMS à l'étudiant
  sendNotification(schedule.enrollment.student.user.email);
}
```

---

## Sécurité

- Toutes les routes nécessitent un token JWT valide (`authenticate` middleware)
- Seuls les administrateurs peuvent supprimer des échéanciers
- Les transactions sont immuables (pas de suppression, uniquement ajout)

---

## Tests recommandés

1. **Test formation courte** : Créer un cours de 2 mois → Générer échéancier → Vérifier 2 échéances de 50%
2. **Test formation longue** : Créer un cours de 6 mois → Générer échéancier → Vérifier 6 échéances mensuelles
3. **Test soutien scolaire** : Créer un cours type tutoring → Générer échéancier → Vérifier 12 échéances
4. **Test paiement partiel** : Payer 50% d'une échéance → Vérifier statut `Paiement partiel`
5. **Test paiement complet** : Compléter le paiement → Vérifier statut `Payé`
6. **Test historique** : Effectuer plusieurs paiements → Vérifier la liste des transactions
