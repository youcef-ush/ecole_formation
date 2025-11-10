# Migrations Phase 1 - QR & Presences
# Date: 2025-11-10

Write-Host "========================================"
Write-Host "   MIGRATIONS - PHASE 1 QR & PRESENCES"
Write-Host "========================================"
Write-Host ""

$env:PGPASSWORD = "eftg"
$DB_USER = "postgres"
$DB_NAME = "ecole_formation"

Write-Host "Migrations a executer:"
Write-Host "  1. remove_sessionid_from_enrollments.sql"
Write-Host "  2. add_qr_fields_to_students.sql"
Write-Host "  3. add_qr_fields_to_sessions.sql"
Write-Host "  4. create_attendances_table.sql"
Write-Host "  5. create_attendance_reports_table.sql"
Write-Host ""

$migrations = @(
    "remove_sessionid_from_enrollments.sql",
    "add_qr_fields_to_students.sql",
    "add_qr_fields_to_sessions.sql",
    "create_attendances_table.sql",
    "create_attendance_reports_table.sql"
)

$success = 0
$failed = 0

foreach ($migration in $migrations) {
    $path = ".\backend\migrations\$migration"
    
    if (-not (Test-Path $path)) {
        Write-Host "X Fichier non trouve: $migration" -ForegroundColor Red
        $failed++
        continue
    }
    
    Write-Host "Execution: $migration" -ForegroundColor Yellow
    
    $result = & psql -U $DB_USER -d $DB_NAME -f $path 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  OK Succes" -ForegroundColor Green
        $success++
    } else {
        Write-Host "  X Erreur" -ForegroundColor Red
        Write-Host "  Details: $result" -ForegroundColor Gray
        $failed++
    }
    
    Write-Host ""
}

Write-Host "========================================"
Write-Host "              RESUME"
Write-Host "========================================"
Write-Host "Reussies: $success" -ForegroundColor Green
Write-Host "Echouees: $failed" -ForegroundColor Red
Write-Host ""

if ($failed -eq 0) {
    Write-Host "Toutes les migrations ont reussi!" -ForegroundColor Green
} else {
    Write-Host "Certaines migrations ont echoue." -ForegroundColor Yellow
}
