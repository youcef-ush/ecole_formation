# 🔧 Test de connexion

## ✅ Corrections appliquées

### Problème identifié
Le frontend restait bloqué sur la page de login car la structure de la réponse API ne correspondait pas.

### Solution appliquée
- ✅ Backend corrigé: renvoie maintenant `accessToken` dans la réponse
- ✅ Frontend corrigé: lit correctement `response.data.data.accessToken`

---

## 🧪 Pour tester maintenant

### 1. Vérifiez que les serveurs sont actifs
- Backend: http://localhost:3000 ✅
- Frontend: http://localhost:5173 ✅

### 2. Utilisez ces identifiants
- **Email**: `admin@eftg.dz`
- **Mot de passe**: `admin123`

### 3. Testez la connexion
1. Ouvrez http://localhost:5173
2. Entrez les identifiants ci-dessus
3. Cliquez sur "Se connecter"
4. ✅ Vous devriez être redirigé vers le Dashboard

---

## 🐛 Débogage

Si ça ne fonctionne toujours pas:

1. **Ouvrez la console du navigateur** (F12)
2. Allez dans l'onglet "Console"
3. Vous verrez des logs:
   - `Login response:` → La réponse de l'API
   - `Login error:` → L'erreur si ça échoue

4. **Vérifiez la réponse API directement**:
```powershell
$body = @{
    email = "admin@eftg.dz"
    password = "admin123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $body -ContentType "application/json"
```

Vous devriez voir:
```json
{
  "success": true,
  "data": {
    "user": { "id": 2, "email": "admin@eftg.dz", "role": "admin" },
    "accessToken": "eyJhbG...",
    "token": "eyJhbG...",
    "refreshToken": "eyJhbG..."
  }
}
```

---

## 📝 Notes

- Les logs de débogage (`console.log`) sont maintenant actifs dans le frontend
- Ils vous montreront exactement ce que l'API renvoie
- Après confirmation que ça fonctionne, on pourra les retirer
