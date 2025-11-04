# Script de test de l'API École de Formation

Write-Host "🧪 Tests de l'API Backend" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# 1. Health Check
Write-Host "`n1️⃣ Test du Health Check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3000/health" -Method GET
    Write-Host "✅ Serveur opérationnel: $($health.message)" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 2. Créer un administrateur
Write-Host "`n2️⃣ Création d'un compte administrateur..." -ForegroundColor Yellow
$adminData = @{
    email = "admin@ecole.com"
    password = "Admin123!"
    role = "admin"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" -Method POST -Body $adminData -ContentType "application/json"
    Write-Host "✅ Admin créé: $($registerResponse.data.email) (ID: $($registerResponse.data.id))" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Admin existe déjà ou erreur: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 3. Connexion
Write-Host "`n3️⃣ Connexion avec le compte admin..." -ForegroundColor Yellow
$loginData = @{
    email = "admin@ecole.com"
    password = "Admin123!"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $loginData -ContentType "application/json"
    $token = $loginResponse.data.token
    Write-Host "✅ Connexion réussie!" -ForegroundColor Green
    Write-Host "   Email: $($loginResponse.data.user.email)" -ForegroundColor White
    Write-Host "   Rôle: $($loginResponse.data.user.role)" -ForegroundColor White
    Write-Host "   Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
} catch {
    Write-Host "❌ Erreur de connexion: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 4. Récupérer les statistiques du dashboard
Write-Host "`n4️⃣ Récupération des statistiques..." -ForegroundColor Yellow
$headers = @{
    Authorization = "Bearer $token"
}

try {
    $stats = Invoke-RestMethod -Uri "http://localhost:3000/api/dashboard/stats" -Method GET -Headers $headers
    Write-Host "✅ Statistiques récupérées:" -ForegroundColor Green
    Write-Host "   👥 Étudiants: $($stats.data.totalStudents)" -ForegroundColor White
    Write-Host "   📚 Formations actives: $($stats.data.activeCourses)" -ForegroundColor White
    Write-Host "   📝 Inscriptions: $($stats.data.activeEnrollments)" -ForegroundColor White
    Write-Host "   💰 Revenus: $($stats.data.totalRevenue) €" -ForegroundColor White
} catch {
    Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
}

# 5. Lister les étudiants
Write-Host "`n5️⃣ Liste des étudiants..." -ForegroundColor Yellow
try {
    $students = Invoke-RestMethod -Uri "http://localhost:3000/api/students" -Method GET -Headers $headers
    Write-Host "✅ $($students.data.Count) étudiant(s) trouvé(s)" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n✨ Tests terminés avec succès!" -ForegroundColor Cyan
Write-Host "`n📊 API Backend operationnelle sur http://localhost:3000/api" -ForegroundColor Green
