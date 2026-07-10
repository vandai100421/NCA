#Requires -Version 5.1
<#
.SYNOPSIS
    Backup prod.db ra thu muc backup/ voi timestamp.
.DESCRIPTION
    Copy prod.db (SQLite la file don) ra backup\prod-YYYYMMDD-HHmmss.db.
    Giu lai N ban gan nhat (mac dinh 14), xoa ban cu.
.PARAMETER Keep
    So ban backup giu lai (mac dinh 14).
.PARAMETER DbName
    Ten file DB (mac dinh prod.db).
.EXAMPLE
    .\scripts\deploy\backup-db.ps1
    .\scripts\deploy\backup-db.ps1 -Keep 30
    .\scripts\deploy\backup-db.ps1 -DbName dev.db
#>

param(
    [int]$Keep = 14,
    [string]$DbName = 'prod.db'
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$dbPath = Join-Path $projectRoot $DbName
$backupDir = Join-Path $projectRoot 'backup'

# Kiem tra DB ton tai
if (-not (Test-Path $dbPath)) {
    Write-Error "Khong tim thay $dbPath"
    exit 1
}

# Tao thu muc backup
if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
}

# Tao backup
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupPath = Join-Path $backupDir "$($DbName -replace '\.db$', '')-$timestamp.db"

# Dung SQLite backup API (VACUUM INTO) neu co sqlite3, nguoc lai copy file
$sqlite3 = Get-Command sqlite3 -ErrorAction SilentlyContinue
if ($sqlite3) {
    & $sqlite3 $dbPath "VACUUM INTO '$backupPath'"
    if ($LASTEXITCODE -ne 0) {
        Write-Host 'VACUUM INTO that bai, fallback sang copy file.' -ForegroundColor Yellow
        Copy-Item $dbPath $backupPath -Force
    }
} else {
    # Copy file (co the anh huong neu DB dang duoc ghi)
    Copy-Item $dbPath $backupPath -Force
}

Write-Host "Da backup: $backupPath" -ForegroundColor Green

# Xoa backup cu
$backups = Get-ChildItem -Path $backupDir -Filter "$($DbName -replace '\.db$', '')-*.db" |
    Sort-Object LastWriteTime -Descending
if ($backups.Count -gt $Keep) {
    $backups | Select-Object -Skip $Keep | ForEach-Object {
        Remove-Item $_.FullName -Force
        Write-Host "Da xoa backup cu: $($_.Name)" -ForegroundColor Yellow
    }
}

Write-Host "Tong con lai: $([Math]::Min($backups.Count, $Keep)) ban" -ForegroundColor Green
