# 🎯 École de Formation - Guide de Démarrage

## 📋 Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- **Node.js** 18+ : https://nodejs.org/
- **PostgreSQL** 14+ : https://www.postgresql.org/download/
- **Git** : https://git-scm.com/downloads
- **(Optionnel) Docker** : https://www.docker.com/products/docker-desktop

---

## 🚀 Option 1 : Démarrage Rapide avec Docker (Recommandé)

### 1. Cloner le projet

```powershell
git clone [URL_DU_REPO]
cd ecole_formation
```

### 2. Démarrer tous les services

```powershell
docker-compose up -d
```

Cette commande va :
- ✅ Créer la base de données PostgreSQL
- ✅ Démarrer le backend sur http://localhost:3000
- ✅ Démarrer le frontend sur http://localhost:5173

### 3. Créer le premier administrateur

```powershell
# Attendre que les services soient prêts (30 secondes)
Start-Sleep -Seconds 30

# Créer l'admin
Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"email":"admin@ecole.com","password":"Admin123!","role":"admin"}'
```

### 4. Accéder à l'application

- **Frontend** : http://localhost:5173
- **Backend API** : http://localhost:3000/api
- **PostgreSQL** : localhost:5432

### Arrêter les services

```powershell
docker-compose down
```

---

## 🛠️ Option 2 : Installation Manuelle

### A. Backend

#### 1. Installer PostgreSQL

```powershell
# Télécharger et installer PostgreSQL depuis :
# https://www.postgresql.org/download/windows/

# Créer la base de données
psql -U postgres
CREATE DATABASE ecole_formation;
\q
```

#### 2. Configurer le Backend

```powershell
cd backend

# Installer les dépendances
npm install

# Copier et configurer .env (déjà fait)
# Vérifier que les paramètres DB correspondent à votre config PostgreSQL

# Démarrer le serveur
npm run dev
```

Le backend sera disponible sur **http://localhost:3000**

#### 3. Créer l'administrateur

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"email":"admin@ecole.com","password":"Admin123!","role":"admin"}'
```

### B. Frontend

#### 1. Configurer le Frontend

```powershell
cd frontend

# Installer les dépendances
npm install

# Vérifier le fichier .env
# VITE_API_URL=http://localhost:3000/api

# Démarrer l'application
npm run dev
```

Le frontend sera disponible sur **http://localhost:5173**

---

## 📊 Test de l'Installation

### 1. Vérifier le Backend

```powershell
# Health check
Invoke-RestMethod -Uri "http://localhost:3000/health"
```

Résultat attendu :
```json
{
  "status": "OK",
  "message": "Server is running"
}
```

### 2. Se connecter

```powershell
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"email":"admin@ecole.com","password":"Admin123!"}'

Write-Host "Token: $($response.data.token)"
```

### 3. Tester une route protégée

```powershell
$token = $response.data.token

Invoke-RestMethod -Uri "http://localhost:3000/api/dashboard/stats" `
  -Method GET `
  -Headers @{"Authorization"="Bearer $token"}
```

---

## 📚 Structure du Projet

```
ecole_formation/
├── backend/                # API Node.js + Express + TypeScript
│   ├── src/
│   │   ├── entities/       # Modèles TypeORM
│   │   ├── routes/         # Routes Express
│   │   ├── middleware/     # Middleware (auth, error)
│   │   ├── config/         # Configuration (DB, etc.)
│   │   ├── app.ts          # Configuration Express
│   │   └── server.ts       # Point d'entrée
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
│
├── frontend/               # Application React (à créer)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.tsx
│   ├── package.json
│   └── .env
│
├── docs/                   # Documentation
│   ├── USER_GUIDE.md
│   ├── ARCHITECTURE.md
│   └── SPECIFICATIONS.md
│
├── docker-compose.yml      # Docker configuration
├── README.md
└── PRESENTATION.md
```

---

## 🎯 Prochaines Étapes

### 1. Backend ✅ (Fait)
- [x] Structure du projet
- [x] Entités TypeORM (7 entités)
- [x] Routes API (authentification, CRUD)
- [x] Middleware d'authentification JWT
- [x] Configuration PostgreSQL

### 2. Frontend 🔨 (À faire)
- [ ] Initialiser React + Vite + TypeScript
- [ ] Installer Material-UI
- [ ] Créer le layout (Header, Sidebar)
- [ ] Créer la page de connexion
- [ ] Créer le Dashboard
- [ ] Créer les pages CRUD (Étudiants, Formateurs, etc.)

### 3. Fonctionnalités avancées 🚀 (V2+)
- [ ] Paiement en ligne (Stripe)
- [ ] Portail étudiant (LMS)
- [ ] Quiz et certificats
- [ ] Analytics et IA

---

## 🐛 Dépannage

### Erreur : Port 3000 déjà utilisé

```powershell
# Trouver le processus
netstat -ano | findstr :3000

# Arrêter le processus (remplacer PID)
taskkill /PID [PID] /F

# Ou changer le port dans backend/.env
PORT=3001
```

### Erreur : PostgreSQL ne démarre pas

```powershell
# Vérifier le service
Get-Service -Name postgresql*

# Démarrer le service
Start-Service postgresql-x64-14
```

### Erreur : Cannot find module

```powershell
cd backend
Remove-Item -Recurse -Force node_modules
npm install
```

---

## 📞 Support

Pour toute question ou problème :
- 📧 Email : support@ecole-formation.com
- 📚 Documentation : [docs/](./docs)
- 🐛 Issues : GitHub Issues

---

## 📝 Commandes Utiles

### Backend

```powershell
# Développement
npm run dev

# Production
npm run build
npm start

# Migrations
npm run migration:generate -- -n NomMigration
npm run migration:run
```

### Frontend

```powershell
# Développement
npm run dev

# Build production
npm run build
npm run preview
```

### Docker

```powershell
# Démarrer
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter
docker-compose down

# Rebuild
docker-compose up -d --build
```

---

**Bon développement ! 🚀**
