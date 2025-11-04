# 🚀 Guide de Démarrage - Backend

## Installation

### 1. Installer les dépendances

```powershell
cd backend
npm install
```

### 2. Configurer la base de données PostgreSQL

#### Option A : Installation locale

1. Téléchargez PostgreSQL : https://www.postgresql.org/download/windows/
2. Installez PostgreSQL (version 14 ou supérieure)
3. Créez une base de données :

```sql
CREATE DATABASE ecole_formation;
```

#### Option B : Utiliser Docker (recommandé)

```powershell
# Créer et démarrer le conteneur PostgreSQL
docker run --name postgres-ecole -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=ecole_formation -p 5432:5432 -d postgres:14
```

### 3. Configurer les variables d'environnement

Le fichier `.env` a déjà été créé. Vérifiez les paramètres :

- **DB_HOST** : localhost (ou l'IP de votre serveur PostgreSQL)
- **DB_PORT** : 5432
- **DB_USERNAME** : postgres
- **DB_PASSWORD** : postgres (changez en production !)
- **DB_DATABASE** : ecole_formation

### 4. Démarrer le serveur en mode développement

```powershell
npm run dev
```

Le serveur démarrera sur **http://localhost:3000**

### 5. Créer un utilisateur administrateur

Une fois le serveur démarré, créez votre premier admin via l'API :

```powershell
# Utilisez PowerShell ou Postman
Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"email":"admin@ecole.com","password":"Admin123!","role":"admin"}'
```

### 6. Se connecter

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"email":"admin@ecole.com","password":"Admin123!"}'
```

## Scripts disponibles

- `npm run dev` - Démarre le serveur en mode développement avec hot-reload
- `npm run build` - Compile le TypeScript en JavaScript
- `npm start` - Démarre le serveur en production
- `npm run migration:generate` - Génère une nouvelle migration
- `npm run migration:run` - Exécute les migrations

## Structure de l'API

### Authentification
- `POST /api/auth/login` - Connexion
- `POST /api/auth/register` - Inscription (admin uniquement)

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

### Formations
- `GET /api/courses` - Liste des formations
- `GET /api/courses/:id` - Détails d'une formation
- `POST /api/courses` - Créer une formation

### Sessions
- `GET /api/sessions` - Liste des sessions
- `POST /api/sessions` - Créer une session

### Inscriptions
- `GET /api/enrollments` - Liste des inscriptions
- `POST /api/enrollments` - Créer une inscription
- `POST /api/enrollments/:id/pay` - Valider un paiement

### Dashboard
- `GET /api/dashboard/stats` - Statistiques générales

## Test de l'API

### Health Check

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/health"
```

### Exemple complet avec token

```powershell
# 1. Connexion
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"email":"admin@ecole.com","password":"Admin123!"}'

$token = $response.data.token

# 2. Récupérer les étudiants
Invoke-RestMethod -Uri "http://localhost:3000/api/students" -Method GET -Headers @{"Authorization"="Bearer $token"}
```

## Troubleshooting

### Erreur : "Cannot find module"
```powershell
rm -r node_modules
npm install
```

### Erreur de connexion à PostgreSQL
- Vérifiez que PostgreSQL est démarré
- Vérifiez les credentials dans `.env`
- Testez la connexion : `psql -U postgres -h localhost`

### Port 3000 déjà utilisé
Changez le PORT dans `.env` :
```
PORT=3001
```

## Prochaines étapes

Une fois le backend fonctionnel :
1. ✅ Testez toutes les routes avec Postman
2. ✅ Créez quelques données de test
3. ✅ Passez au développement du Frontend
