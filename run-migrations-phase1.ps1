# Script d'exécution des migrations - Phase 1 QR & Présences
# Date: 2025-11-10
# Tâche 9: Exécuter les migrations pour le système QR et présences

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   MIGRATIONS - PHASE 1 QR & PRÉSENCES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$DB_USER = "postgres"
$DB_PASSWORD = "eftg"
$DB_NAME = "ecole_formation"
$BACKUP_DIR = ".\backups"
$MIGRATION_DIR = ".\backend\migrations"

# Créer le dossier de backup s'il n'existe pas
if (-not (Test-Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Path $BACKUP_DIR | Out-Null
    Write-Host "✅ Dossier backups créé" -ForegroundColor Green
}

# Backup de la base de données
$BACKUP_FILE = "$BACKUP_DIR\backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').dump"
Write-Host "📦 Sauvegarde de la base de données..." -ForegroundColor Yellow
Write-Host "   Fichier: $BACKUP_FILE" -ForegroundColor Gray

$env:PGPASSWORD = $DB_PASSWORD

try {
    & pg_dump -U $DB_USER -d $DB_NAME -F c -f $BACKUP_FILE 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Backup créé avec succès" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Backup échoué (continuer quand même)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Backup échoué: $_" -ForegroundColor Yellow
    Write-Host "   Continuer quand même..." -ForegroundColor Gray
}

Write-Host ""
Write-Host "📋 Migrations à exécuter:" -ForegroundColor Cyan
Write-Host "   1. remove_sessionid_from_enrollments.sql" -ForegroundColor White
Write-Host "   2. add_qr_fields_to_students.sql" -ForegroundColor White
Write-Host "   3. add_qr_fields_to_sessions.sql" -ForegroundColor White
Write-Host "   4. create_attendances_table.sql" -ForegroundColor White
Write-Host "   5. create_attendance_reports_table.sql" -ForegroundColor White
Write-Host ""

# Liste des migrations dans l'ordre
$migrations = @(
    "remove_sessionid_from_enrollments.sql",
    "add_qr_fields_to_students.sql",
    "add_qr_fields_to_sessions.sql",
    "create_attendances_table.sql",
    "create_attendance_reports_table.sql"
)

$success_count = 0
$failed_count = 0

foreach ($migration in $migrations) {
    $migration_path = "$MIGRATION_DIR\$migration"
    
    if (-not (Test-Path $migration_path)) {
        Write-Host "❌ Fichier non trouvé: $migration" -ForegroundColor Red
        $failed_count++
        continue
    }
    
    Write-Host "🔄 Exécution: $migration" -ForegroundColor Yellow
    
    try {
        $result = & psql -U $DB_USER -d $DB_NAME -f $migration_path 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ Succès" -ForegroundColor Green
            $success_count++
        } else {
            Write-Host "   ❌ Erreur" -ForegroundColor Red
            Write-Host "   Détails: $result" -ForegroundColor Gray
            $failed_count++
        }
    } catch {
        Write-Host "   ❌ Exception: $_" -ForegroundColor Red
        $failed_count++
    }
    
    Write-Host ""
}

# Résumé
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "              RÉSUMÉ" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Réussies: $success_count" -ForegroundColor Green
Write-Host "❌ Échouées: $failed_count" -ForegroundColor Red
Write-Host "📦 Backup: $BACKUP_FILE" -ForegroundColor Yellow
Write-Host ""

if ($failed_count -eq 0) {
    Write-Host "🎉 Toutes les migrations ont réussi!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Certaines migrations ont échoué. Vérifiez les logs ci-dessus." -ForegroundColor Yellow
}
