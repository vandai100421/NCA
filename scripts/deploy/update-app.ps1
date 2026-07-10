#Requires -Version 5.1
<#
.SYNOPSIS
    Cap nhat NCA: stop service -> pull -> rebuild -> start service.
.DESCRIPTION
    Workflow cap nhat khi co code moi:
      1. Stop NCA service
      2. git pull
      3. npm ci (neu package-lock thay doi)
      4. npx prisma generate (neu schema thay doi)
      5. npx prisma migrate deploy (neu co migration moi)
      6. npm run build
      7. Start NCA service
.PARAMETER ServiceName
    Ten service nssm (mac dinh NCA).
.EXAMPLE
    .\scripts\deploy\update-app.ps1
    .\scripts\deploy\update-app.ps1 -ServiceName "NCA-Prod"
#>

param(
    [string]$ServiceName = 'NCA'
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $projectRoot

function Step($msg) { Write-Host "`n=== $msg ===" -ForegroundColor Cyan }

# --- 0. Kiem tra nssm ---
$nssm = Get-Command nssm -ErrorAction SilentlyContinue
if (-not $nssm) {
    $nssmPath = 'C:\nssm\nssm.exe'
    if (Test-Path $nssmPath) {
        $nssm = $nssmPath
    } else {
        Write-Error 'Khong tim thay nssm. Khong the quan ly service.'
        exit 1
    }
} else {
    $nssm = $nssm.Source
}

# --- 1. Stop service ---
Step "1. Stop service '$ServiceName'"
& $nssm stop $ServiceName 2>$null
Start-Sleep -Seconds 3
Write-Host 'Service da stop.' -ForegroundColor Green

# --- 2. git pull ---
Step '2. git pull'
git pull
if ($LASTEXITCODE -ne 0) { Write-Error 'git pull that bai.'; exit 1 }

# --- 3. npm ci ---
Step '3. npm ci'
npm ci
if ($LASTEXITCODE -ne 0) { Write-Error 'npm ci that bai.'; exit 1 }

# --- 4. prisma generate ---
Step '4. prisma generate'
npx prisma generate
if ($LASTEXITCODE -ne 0) { Write-Error 'prisma generate that bai.'; exit 1 }

# --- 5. prisma migrate deploy ---
Step '5. prisma migrate deploy'
npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) { Write-Error 'migrate deploy that bai.'; exit 1 }

# --- 6. build ---
Step '6. npm run build'
npm run build
if ($LASTEXITCODE -ne 0) { Write-Error 'build that bai.'; exit 1 }

# --- 7. Start service ---
Step "7. Start service '$ServiceName'"
& $nssm start $ServiceName
Start-Sleep -Seconds 3
$status = & $nssm status $ServiceName
Write-Host "Trang thai: $status" -ForegroundColor Green

Step 'HOAN THANH'
Write-Host 'Cap nhat xong.' -ForegroundColor Green
