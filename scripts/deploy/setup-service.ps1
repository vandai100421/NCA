#Requires -Version 5.1
<#
.SYNOPSIS
    Cai dat NCA nhu Windows Service dung nssm.
.DESCRIPTION
    - Tao service ten "NCA" chay `npm run start`
    - Auto-start khi may boot
    - Auto-restart khi crash (delay 5s)
    - Redirect stdout/stderr ra logs/
    - Mo firewall port 3000 cho LAN
.PREREQUISITES
    - nssm.exe trong PATH hoac o C:\nssm\nssm.exe
    - Da chay install.ps1 thanh cong
    - Chay PowerShell as Administrator
.EXAMPLE
    .\scripts\deploy\setup-service.ps1
    .\scripts\deploy\setup-service.ps1 -ServiceName "NCA-Prod" -Port 8080
#>

param(
    [string]$ServiceName = 'NCA',
    [int]$Port = 3000
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

# --- 0. Kiem tra Administrator ---
$isAdmin = ([Security.Principal.WindowsPrincipal] `
    [Security.Principal.WindowsIdentity]::GetCurrent()
).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Error 'Can chay PowerShell as Administrator.'
    exit 1
}

# --- 1. Tim nssm ---
$nssm = Get-Command nssm -ErrorAction SilentlyContinue
if (-not $nssm) {
    $nssmPath = 'C:\nssm\nssm.exe'
    if (Test-Path $nssmPath) {
        $nssm = $nssmPath
    } else {
        Write-Error @"
Khong tim thay nssm. Cai dat:
  1. Tai nssm.exe tu https://nssm.cc/download
  2. Giai nen vao C:\nssm\ (hoac them vao PATH)
  3. Chay lai script nay
"@
        exit 1
    }
} else {
    $nssm = $nssm.Source
}
Write-Host "nssm: $nssm" -ForegroundColor Green

# --- 2. Tim npm.cmd ---
$npmCmd = (Get-Command npm -ErrorAction SilentlyContinue)
if (-not $npmCmd) {
    Write-Error 'Khong tim thay npm trong PATH. Node.js da cai chua?'
    exit 1
}
$npmPath = $npmCmd.Source
Write-Host "npm: $npmPath" -ForegroundColor Green

# --- 3. Tao thu muc logs ---
$logsDir = Join-Path $projectRoot 'logs'
if (-not (Test-Path $logsDir)) {
    New-Item -ItemType Directory -Path $logsDir -Force | Out-Null
}
Write-Host "logs: $logsDir" -ForegroundColor Green

# --- 4. Xoa service cu neu co ---
$existing = & $nssm status $ServiceName 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Service '$ServiceName' da ton tai, dang xoa..." -ForegroundColor Yellow
    & $nssm stop $ServiceName 2>$null
    Start-Sleep -Seconds 2
    & $nssm remove $ServiceName confirm
    Start-Sleep -Seconds 2
}

# --- 5. Cai service moi ---
Write-Host "`n=== Cai service '$ServiceName' ===" -ForegroundColor Cyan
& $nssm install $ServiceName $npmPath 'run start'
if ($LASTEXITCODE -ne 0) { Write-Error 'nssm install that bai.'; exit 1 }

# --- 6. Cau hinh ---
& $nssm set $ServiceName AppDirectory $projectRoot
& $nssm set $ServiceName AppEnvironmentExtra NODE_ENV=production
& $nssm set $ServiceName Start SERVICE_AUTO_START
& $nssm set $ServiceName AppExit Default Restart
& $nssm set $ServiceName AppRestartDelay 5000
& $nssm set $ServiceName AppStdout (Join-Path $logsDir 'out.log')
& $nssm set $ServiceName AppStderr (Join-Path $logsDir 'err.log')
& $nssm set $ServiceName AppRotateFiles 1
& $nssm set $ServiceName AppRotateBytes 10485760

Write-Host 'Cau hinh xong.' -ForegroundColor Green

# --- 7. Mo firewall ---
Write-Host "`n=== Mo firewall port $Port ===" -ForegroundColor Cyan
$ruleName = "NCA Web (port $Port)"
$existingRule = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
if ($existingRule) {
    Write-Host "Firewall rule '$ruleName' da ton tai." -ForegroundColor Yellow
} else {
    New-NetFirewallRule -DisplayName $ruleName `
        -Direction Inbound -Protocol TCP -LocalPort $Port `
        -Action Allow -Profile Domain,Private | Out-Null
    Write-Host "Da mo port $Port." -ForegroundColor Green
}

# --- 8. Khoi dong service ---
Write-Host "`n=== Khoi dong service ===" -ForegroundColor Cyan
& $nssm start $ServiceName
Start-Sleep -Seconds 3
$status = & $nssm status $ServiceName
Write-Host "Trang thai: $status" -ForegroundColor Green

# --- 9. Hien thi IP ---
Write-Host "`n=== Thong tin truy cap ===" -ForegroundColor Cyan
$ips = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -ne '127.0.0.1' } | Select-Object -ExpandProperty IPAddress
foreach ($ip in $ips) {
    Write-Host "  http://${ip}:$Port" -ForegroundColor Yellow
}

Write-Host @"
`n=== HOAN THANH ===
Service '$ServiceName' da cai.
  - Stop:    nssm stop $ServiceName
  - Start:   nssm start $ServiceName
  - Restart: nssm restart $ServiceName
  - Status:  nssm status $ServiceName
  - Log:     $logsDir\out.log / err.log
  - Go bo:   nssm remove $ServiceName confirm
"@ -ForegroundColor Green
