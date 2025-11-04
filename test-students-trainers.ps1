# Script de test pour vérifier les routes students et trainers

$baseUrl = "http://localhost:3000/api"

Write-Host "=== Test de connexion ===" -ForegroundColor Cyan
$loginBody = @{
    email = "admin@ecole.dz"
    password = "admin123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.data.token
    Write-Host "✓ Connexion réussie" -ForegroundColor Green
    Write-Host "Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
} catch {
    Write-Host "✗ Erreur de connexion: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== Test GET /api/students ===" -ForegroundColor Cyan
try {
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    $studentsResponse = Invoke-RestMethod -Uri "$baseUrl/students" -Method Get -Headers $headers
    Write-Host "✓ Requête réussie" -ForegroundColor Green
    Write-Host "Nombre d'étudiants: $($studentsResponse.data.Count)" -ForegroundColor Yellow
    
    if ($studentsResponse.data.Count -gt 0) {
        Write-Host "`nPremier étudiant:" -ForegroundColor White
        $student = $studentsResponse.data[0]
        Write-Host "  ID: $($student.id)" -ForegroundColor Gray
        Write-Host "  Nom: $($student.firstName) $($student.lastName)" -ForegroundColor Gray
        Write-Host "  Email: $($student.user.email)" -ForegroundColor Gray
        Write-Host "  Téléphone: $($student.phone)" -ForegroundColor Gray
    } else {
        Write-Host "⚠ Aucun étudiant trouvé" -ForegroundColor Yellow
    }
} catch {
    Write-Host "✗ Erreur GET students: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Détails: $($_.ErrorDetails.Message)" -ForegroundColor Red
}

Write-Host "`n=== Test GET /api/trainers ===" -ForegroundColor Cyan
try {
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    $trainersResponse = Invoke-RestMethod -Uri "$baseUrl/trainers" -Method Get -Headers $headers
    Write-Host "✓ Requête réussie" -ForegroundColor Green
    Write-Host "Nombre de formateurs: $($trainersResponse.data.Count)" -ForegroundColor Yellow
    
    if ($trainersResponse.data.Count -gt 0) {
        Write-Host "`nPremier formateur:" -ForegroundColor White
        $trainer = $trainersResponse.data[0]
        Write-Host "  ID: $($trainer.id)" -ForegroundColor Gray
        Write-Host "  Nom: $($trainer.firstName) $($trainer.lastName)" -ForegroundColor Gray
        Write-Host "  Spécialité: $($trainer.specialty)" -ForegroundColor Gray
        Write-Host "  Téléphone: $($trainer.phone)" -ForegroundColor Gray
    } else {
        Write-Host "⚠ Aucun formateur trouvé" -ForegroundColor Yellow
    }
} catch {
    Write-Host "✗ Erreur GET trainers: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Détails: $($_.ErrorDetails.Message)" -ForegroundColor Red
}

Write-Host "`n=== Résumé ===" -ForegroundColor Cyan
Write-Host "Base de données PostgreSQL contient:" -ForegroundColor White
Write-Host "  - 15 étudiants (vérifié via SQL)" -ForegroundColor Gray
Write-Host "  - 6 formateurs (vérifié via SQL)" -ForegroundColor Gray
Write-Host "API retourne:" -ForegroundColor White
Write-Host "  - $($studentsResponse.data.Count) étudiants" -ForegroundColor Gray
Write-Host "  - $($trainersResponse.data.Count) formateurs" -ForegroundColor Gray
