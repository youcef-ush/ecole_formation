# ============================================
# Script PowerShell - Réinitialisation Base de Données
# Inspired Academy by Nana
# ============================================

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   RÉINITIALISATION BASE DE DONNÉES" -ForegroundColor Yellow
Write-Host "   Inspired Academy by Nana" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Confirmation
Write-Host "⚠️  ATTENTION: Cette opération va:" -ForegroundColor Red
Write-Host "   - Supprimer TOUTES les tables" -ForegroundColor Yellow
Write-Host "   - Supprimer TOUTES les données" -ForegroundColor Yellow
Write-Host "   - Recréer toutes les tables vides" -ForegroundColor Yellow
Write-Host ""

$confirmation = Read-Host "Êtes-vous sûr de vouloir continuer? (tapez 'OUI' en majuscules)"

if ($confirmation -ne "OUI") {
    Write-Host "❌ Opération annulée" -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "🔄 Réinitialisation en cours..." -ForegroundColor Cyan

# Paramètres de connexion PostgreSQL
$DB_HOST = "localhost"
$DB_PORT = "5432"
$DB_NAME = "ecole_formation"
$DB_USER = "postgres"
$DB_PASSWORD = "eftg"  # Mot de passe corrigé

# Exécuter le script SQL avec encodage UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$env:PGPASSWORD = $DB_PASSWORD
$env:PGCLIENTENCODING = "UTF8"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "backend\migrations\reset_database.sql"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "✅ Base de données réinitialisée avec succès!" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Prochaines étapes:" -ForegroundColor Cyan
    Write-Host "   1. Seed admin: cd backend && npm run seed:admin" -ForegroundColor White
    Write-Host "   2. Seed données test: npm run seed" -ForegroundColor White
    Write-Host "   3. Démarrer backend: npm run dev" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Erreur lors de la réinitialisation" -ForegroundColor Red
    Write-Host "Vérifiez que PostgreSQL est démarré et les identifiants sont corrects" -ForegroundColor Yellow
}
