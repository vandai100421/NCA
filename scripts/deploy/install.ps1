#Requires -Version 5.1
<#
.SYNOPSIS
    Cai dat NCA len server moi (fresh install).
.DESCRIPTION
    Buoc chay:
      1. npm ci
      2. prisma generate
      3. prisma migrate deploy (tao prod.db)
      4. prisma db seed (du lieu mau)
      5. npm run build
    Chay script nay SAU khi da clone repo + tao .env.
.EXAMPLE
    .\scripts\deploy\install.ps1
#>

param(
    [switch]$SkipSeed
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $projectRoot

function Step($msg) { Write-Host "`n=== $msg ===" -ForegroundColor Cyan }

# --- 0. Kiem tra .env ---
Step '0. Kiem tra .env'
if (-not (Test-Path '.env')) {
    Write-Error 'Khong tim thay .env. Copy .env.example thanh .env va cau hinh DATABASE_URL="file:./prod.db" truoc khi chay.'
    exit 1
}
Write-Host '.env OK' -ForegroundColor Green

# --- 1. Kiem tra Node version ---
Step '1. Kiem tra Node'
$nodeVersion = (& node -v) -replace 'v', ''
$nodeMajor = [int]($nodeVersion -split '\.')[0]
if ($nodeMajor -lt 20) {
    Write-Error "Node $nodeVersion qua cu. Can Node >= 20.9."
    exit 1
}
Write-Host "Node $nodeVersion OK" -ForegroundColor Green

# --- 2. npm ci ---
Step '2. npm ci'
npm ci
if ($LASTEXITCODE -ne 0) { Write-Error 'npm ci that bai.'; exit 1 }

# --- 3. prisma generate ---
Step '3. prisma generate'
npx prisma generate
if ($LASTEXITCODE -ne 0) { Write-Error 'prisma generate that bai.'; exit 1 }

# --- 4. prisma migrate deploy ---
Step '4. prisma migrate deploy (tao prod.db)'
npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) { Write-Error 'migrate deploy that bai.'; exit 1 }

# --- 5. seed (tuy chon) ---
if (-not $SkipSeed) {
    Step '5. prisma db seed'
    npx prisma db seed
    if ($LASTEXITCODE -ne 0) { Write-Error 'db seed that bai.'; exit 1 }
} else {
    Write-Host '`n=== 5. Bo qua seed (-SkipSeed) ===' -ForegroundColor Yellow
}

# --- 6. build ---
Step '6. npm run build'
npm run build
if ($LASTEXITCODE -ne 0) { Write-Error 'build that bai.'; exit 1 }

# --- Done ---
Step 'HOAN THANH'
Write-Host @"
Cai dat xong. Buoc tiep theo:
  1. Test chay thu:  npm run start
  2. Cai service:    .\scripts\deploy\setup-service.ps1
"@ -ForegroundColor Green
