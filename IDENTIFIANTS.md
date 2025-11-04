# 🔐 Identifiants de connexion

## ⚠️ IMPORTANT: Créez d'abord un compte!

### Étape 1: Créer un compte admin via Swagger

**SWAGGER EST DÉJÀ OUVERT DANS LE NAVIGATEUR** ✅

1. Dans Swagger UI (http://localhost:3000/api-docs)
2. Cherchez **`POST /api/auth/register`** (section Authentification)
3. Cliquez sur **"Try it out"**
4. Copiez-collez exactement ce JSON:
```json
{
  "email": "admin@eftg.dz",
  "password": "admin123",
  "role": "admin"
}
```
5. Cliquez sur **"Execute"**
6. ✅ Vous devriez voir une réponse `201 Created`

### Étape 2: Se connecter au frontend

1. Ouvrez http://localhost:5173
2. Utilisez ces identifiants:
   - **Email**: `admin@eftg.dz`
   - **Mot de passe**: `admin123`

---

## 📋 Comptes existants

### Compte 1 ✅
- **Email**: `youcef@gmail.com`  
- **Statut**: Déjà créé et fonctionnel

### Compte 2 (À créer)
- **Email**: `admin@eftg.dz`
- **Mot de passe**: `admin123`
- **Rôle**: admin

### Option 2: Via PowerShell
```powershell
$body = @{
    email = "admin@ecole.dz"
    password = "admin123"
    role = "admin"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" -Method POST -Body $body -ContentType "application/json"
```

---

## Se connecter au frontend

1. Ouvrez http://localhost:5173
2. Utilisez l'email et le mot de passe du compte créé
3. Cliquez sur "Se connecter"

---

## Résolution de problèmes

### Erreur: "Identifiants invalides"
- ✅ Vérifiez que le compte existe dans la base de données
- ✅ Vérifiez que vous utilisez le bon email et mot de passe
- ✅ Le compte actif est: `youcef@gmail.com`

### Créer un nouveau compte
Utilisez l'endpoint `/api/auth/register` avec Swagger ou PowerShell

---

## Accès rapide

- 🌐 Frontend: http://localhost:5173
- 🔌 Backend API: http://localhost:3000/api
- 📚 Swagger Docs: http://localhost:3000/api-docs

---

## Compte existant vérifié ✅

D'après les logs, vous avez déjà un compte:
- **Email**: `youcef@gmail.com`
- **Connexion réussie**: Oui ✅

Utilisez ce compte pour vous connecter au frontend!
