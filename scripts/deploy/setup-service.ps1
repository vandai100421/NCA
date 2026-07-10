#Requires -Version 5.1
<#
.SYNOPSIS
    Cai dat NCA nhu Windows Service dung pm2.
.DESCRIPTION
    - Cai pm2 + pm2-windows-startup (qua npm, khong can tai file ngoai)
    - Tao process ten "NCA" chay `npm run start`
    - Auto-start khi may boot
    - Auto-restart khi crash
    - Log ra logs/ (pm2 co san log rotation)
    - Mo firewall port 3000 cho LAN
.PREREQUISITES
    - Da cai Node.js + npm
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
Set-Location $projectRoot

function Step($msg) { Write-Host "`n=== $msg ===" -ForegroundColor Cyan }

# --- 0. Kiem tra Administrator ---
$isAdmin = ([Security.Principal.WindowsPrincipal] `
    [Security.Principal.WindowsIdentity]::GetCurrent()
).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Error 'Can chay PowerShell as Administrator.'
    exit 1
}

# --- 1. Kiem tra npm ---
$npmCmd = (Get-Command npm -ErrorAction SilentlyContinue)
if (-not $npmCmd) {
    Write-Error 'Khong tim thay npm trong PATH. Node.js da cai chua?'
    exit 1
}
Write-Host "npm: $($npmCmd.Source)" -ForegroundColor Green

# --- 2. Cai pm2 + pm2-windows-startup (neu chua co) ---
Step '2. Cai pm2 + pm2-windows-startup'
$pm2Cmd = Get-Command pm2 -ErrorAction SilentlyContinue
if (-not $pm2Cmd) {
    Write-Host 'Dang cai pm2...'
    npm install -g pm2 pm2-windows-startup
    if ($LASTEXITCODE -ne 0) { Write-Error 'Cai pm2 that bai.'; exit 1 }
} else {
    Write-Host 'pm2 da cai.' -ForegroundColor Green
}

# Cai auto-startup service (pm2-windows-startup tao Windows Service "pm2")
Step '3. Cai pm2 auto-startup'
pm2-startup install
if ($LASTEXITCODE -ne 0) {
    Write-Host 'pm2-startup install co loi, thu lai...' -ForegroundColor Yellow
}
Write-Host 'Auto-startup da cai.' -ForegroundColor Green

# --- 4. Xoa process cu neu co ---
Step "4. Xoa process cu (neu co)"
pm2 delete $ServiceName 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host 'Khong co process cu.' -ForegroundColor Yellow
}

# --- 5. Tao process moi ---
Step "5. Tao process '$ServiceName'"
pm2 start npm --name $ServiceName -- run start
if ($LASTEXITCODE -ne 0) { Write-Error 'pm2 start that bai.'; exit 1 }

# --- 6. Cau hinh ---
Step '6. Cau hinh'
# Auto-restart khi crash
pm2 set $ServiceName:autorestart true
# Log directory
$logsDir = Join-Path $projectRoot 'logs'
if (-not (Test-Path $logsDir)) {
    New-Item -ItemType Directory -Path $logsDir -Force | Out-Null
}
pm2 set $ServiceName:log_file (Join-Path $logsDir 'out.log')
pm2 set $ServiceName:error_file (Join-Path $logsDir 'err.log')

# Luu process list de khoi phuc khi reboot
pm2 save
Write-Host 'Cau hinh xong.' -ForegroundColor Green

# --- 7. Mo firewall ---
Step "7. Mo firewall port $Port"
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

# --- 8. Kiem tra trang thai ---
Step '8. Kiem tra trang thai'
pm2 status

# --- 9. Hien thi IP ---
Step '9. Thong tin truy cap'
$ips = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -ne '127.0.0.1' } | Select-Object -ExpandProperty IPAddress
foreach ($ip in $ips) {
    Write-Host "  http://${ip}:$Port" -ForegroundColor Yellow
}

Write-Host @"
`n=== HOAN THANH ===
Process '$ServiceName' da cai voi pm2.
  - Stop:    pm2 stop $ServiceName
  - Start:   pm2 start $ServiceName
  - Restart: pm2 restart $ServiceName
  - Status:  pm2 status
  - Log:     pm2 logs $ServiceName
  - Go bo:   pm2 delete $ServiceName && pm2 save
"@ -ForegroundColor Green
