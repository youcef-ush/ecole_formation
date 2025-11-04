# 📚 Documentation API Swagger

## 🚀 Accès à la documentation

Une fois le serveur backend démarré, vous pouvez accéder à la documentation Swagger à l'adresse :

```
http://localhost:3000/api-docs
```

## 🔐 Authentification

La plupart des endpoints nécessitent une authentification JWT. Voici comment procéder :

### 1. Créer un compte (Register)
```bash
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "email": "admin@ecole.dz",
  "password": "password123",
  "role": "admin"
}
```

### 2. Se connecter (Login)
```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "admin@ecole.dz",
  "password": "password123"
}
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "admin@ecole.dz",
      "role": "admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 3. Utiliser le token dans Swagger

1. Copiez le `token` de la réponse
2. Dans Swagger UI, cliquez sur le bouton **🔒 Authorize** en haut à droite
3. Entrez : `Bearer VOTRE_TOKEN`
4. Cliquez sur **Authorize**

Maintenant vous pouvez tester tous les endpoints protégés ! 🎉

## 📋 Endpoints disponibles

### Authentification
- `POST /api/auth/register` - Créer un compte
- `POST /api/auth/login` - Se connecter

### Étudiants
- `GET /api/students` - Liste des étudiants
- `GET /api/students/:id` - Détails d'un étudiant
- `POST /api/students` - Créer un étudiant
- `PUT /api/students/:id` - Modifier un étudiant
- `DELETE /api/students/:id` - Supprimer un étudiant

### Formateurs
- `GET /api/trainers` - Liste des formateurs
- `GET /api/trainers/:id` - Détails d'un formateur
- `POST /api/trainers` - Créer un formateur
- `PUT /api/trainers/:id` - Modifier un formateur
- `DELETE /api/trainers/:id` - Supprimer un formateur

### Formations
- `GET /api/courses` - Liste des formations
- `GET /api/courses/:id` - Détails d'une formation
- `POST /api/courses` - Créer une formation
- `PUT /api/courses/:id` - Modifier une formation
- `DELETE /api/courses/:id` - Supprimer une formation

### Sessions
- `GET /api/sessions` - Liste des sessions
- `GET /api/sessions/:id` - Détails d'une session
- `POST /api/sessions` - Créer une session
- `PUT /api/sessions/:id` - Modifier une session
- `DELETE /api/sessions/:id` - Supprimer une session

### Inscriptions
- `GET /api/enrollments` - Liste des inscriptions
- `GET /api/enrollments/:id` - Détails d'une inscription
- `POST /api/enrollments` - Créer une inscription
- `PUT /api/enrollments/:id` - Modifier une inscription
- `DELETE /api/enrollments/:id` - Supprimer une inscription
- `POST /api/enrollments/:id/payment` - Enregistrer un paiement

### Dashboard
- `GET /api/dashboard/stats` - Statistiques globales

## 💡 Exemples d'utilisation

### Créer un étudiant
```bash
POST http://localhost:3000/api/students
Authorization: Bearer VOTRE_TOKEN
Content-Type: application/json

{
  "firstName": "Ahmed",
  "lastName": "Benali",
  "email": "ahmed@email.com",
  "password": "password123",
  "phone": "0555123456",
  "dateOfBirth": "2000-01-15",
  "address": "Alger, Algérie"
}
```

### Créer une formation
```bash
POST http://localhost:3000/api/courses
Authorization: Bearer VOTRE_TOKEN
Content-Type: application/json

{
  "title": "Développement Web Full Stack",
  "description": "Formation complète en développement web avec JavaScript, React et Node.js",
  "category": "programming",
  "duration": 120,
  "price": 50000,
  "isActive": true
}
```

### Créer une session
```bash
POST http://localhost:3000/api/sessions
Authorization: Bearer VOTRE_TOKEN
Content-Type: application/json

{
  "courseId": 1,
  "trainerId": 1,
  "startDate": "2025-12-01T09:00:00Z",
  "endDate": "2025-12-31T17:00:00Z",
  "capacity": 20,
  "status": "planned"
}
```

### Inscrire un étudiant à une session
```bash
POST http://localhost:3000/api/enrollments
Authorization: Bearer VOTRE_TOKEN
Content-Type: application/json

{
  "studentId": 1,
  "sessionId": 1
}
```

## 🛠️ Commandes utiles

### Démarrer le serveur backend
```bash
cd backend
npm run dev
```

Le serveur sera accessible sur `http://localhost:3000`

### Tester avec curl

#### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ecole.dz","password":"password123"}'
```

#### Lister les étudiants
```bash
curl -X GET http://localhost:3000/api/students \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

## 📊 Schémas de données

### Rôles utilisateurs
- `admin` - Accès complet
- `trainer` - Formateur
- `student` - Étudiant

### Statuts d'inscription
- `pending` - En attente de paiement
- `paid` - Payé
- `cancelled` - Annulé

### Statuts de session
- `planned` - Planifiée
- `ongoing` - En cours
- `completed` - Terminée
- `cancelled` - Annulée

### Catégories de formation
- `programming` - Programmation
- `design` - Design
- `business` - Business
- `marketing` - Marketing
- `languages` - Langues
- `other` - Autre

### Méthodes de paiement
- `cash` - Espèces
- `check` - Chèque
- `transfer` - Virement
- `card` - Carte bancaire

## 🔍 Filtres et pagination

La plupart des endpoints GET supportent des paramètres de requête pour filtrer et paginer les résultats :

```
GET /api/students?page=1&limit=10
GET /api/courses?category=programming&isActive=true
```

## ⚠️ Codes d'erreur HTTP

- `200` - Succès
- `201` - Créé avec succès
- `400` - Requête invalide
- `401` - Non authentifié
- `403` - Accès refusé
- `404` - Ressource non trouvée
- `409` - Conflit (ex: email déjà utilisé)
- `500` - Erreur serveur

## 📞 Support

Pour toute question ou problème, contactez : contact@ecole-formation.dz
