# Hướng dẫn triển khai offline (không có mạng)

> Triển khai NCA lên máy nội bộ **không có internet** — đóng gói trên máy dev, chuyển qua USB, chạy trên máy đích.

---

## Tổng quan

```
[Máy dev — có internet]
  ├── npm run build          → tạo .next/standalone/
  └── gói thành NCA-offline/ → copy ra USB

[Máy đích — KHÔNG có internet, có LAN]
  ├── C:\NCA-offline\        ← copy từ USB vào
  │   ├── start.bat          ← click đúp để chạy
  │   ├── prod.db            ← database
  │   └── server.js + .next/ ← code đã build sẵn
  └── Node.js 24 đã cài      ← chỉ yêu cầu duy nhất

[Các máy trong LAN]
  └── Trình duyệt → http://<IP-máy-đích>:3000
```

### Yêu cầu máy đích

| Yêu cầu  | Phiên bản           | Ghi chú                           |
| -------- | ------------------- | --------------------------------- |
| Node.js  | 24.x (cùng máy dev) | better-sqlite3 cần khớp phiên bản |
| Mạng LAN | có                  | để các máy khác truy cập          |
| Internet | **không cần**       | mọi thứ đã đóng gói sẵn           |

> **Quan trọng**: Node.js trên máy dev và máy đích phải cùng phiên bản major (cùng 24.x), vì `better-sqlite3` là native binary compile theo Node ABI.

---

## Phần 1 — Trên máy dev (có mạng)

### 1.1. Build production

```powershell
cd C:\NCA
npm run build
```

Build tạo ra `.next/standalone/` — bản độc lập, chỉ chứa file cần thiết (~80MB, không cần `node_modules` đầy đủ).

### 1.2. Tạo database production

```powershell
# Xóa DB cũ nếu có
Remove-Item prod.db -ErrorAction SilentlyContinue

# Tạo prod.db + chạy migration
DATABASE_URL="file:./prod.db" npx prisma migrate deploy

# (Tùy chọn) Seed dữ liệu mẫu
DATABASE_URL="file:./prod.db" npx prisma db seed
```

### 1.3. Đóng gói

```powershell
# Tạo thư mục gói
Remove-Item NCA-offline -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path NCA-offline -Force

# Copy standalone build
Copy-Item -Recurse .next\standalone\* NCA-offline\

# Copy static assets (CSS, JS client) — standalone không tự copy
Copy-Item -Recurse .next\static NCA-offline\.next\static

# Copy public assets (nếu có)
Copy-Item -Recurse public NCA-offline\public -ErrorAction SilentlyContinue

# Copy database
Copy-Item prod.db NCA-offline\prod.db

# Tạo file .env
Set-Content -Path NCA-offline\.env -Value 'DATABASE_URL="file:./prod.db"'

# Tạo script start.bat
Set-Content -Path NCA-offline\start.bat -Value @'
@echo off
cd /d %~dp0
node server.js
'@
```

### 1.4. Kiểm tra gói

```powershell
# Test chạy thử
cd NCA-offline
node server.js
# → mở http://localhost:3000, kiểm tra xong nhấn Ctrl+C
```

### 1.5. Copy ra USB

```powershell
# Copy toàn bộ NCA-offline ra USB (vd ổ E:)
Copy-Item -Recurse NCA-offline E:\NCA-offline
```

Kích thước gói khoảng **170MB**.

---

## Phần 2 — Trên máy đích (không có mạng)

### 2.1. Copy từ USB vào máy

```powershell
# Copy từ USB vào C:\
Copy-Item -Recurse E:\NCA-offline C:\NCA-offline
```

Hoặc dùng File Explorer kéo thả.

### 2.2. Chạy web

**Cách 1 — Click đúp:**

Click đúp file `C:\NCA-offline\start.bat`

**Cách 2 — Dòng lệnh:**

```powershell
cd C:\NCA-offline
node server.js
```

Khi thấy `▲ Next.js 16.2.10` và `- Local: http://localhost:3000` → server đang chạy.

### 2.3. Truy cập

- **Trên máy đích**: mở trình duyệt → `http://localhost:3000`
- **Từ máy khác trong LAN**: `http://<IP-máy-đích>:3000`

Tìm IP máy đích:

```powershell
ipconfig
# Tìm "IPv4 Address", ví dụ: 192.168.1.50
```

→ Các máy khác vào `http://192.168.1.50:3000`

### 2.4. Mở firewall (nếu máy khác không vào được)

```powershell
# PowerShell as Administrator
New-NetFirewallRule -DisplayName "NCA Web (port 3000)" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow -Profile Domain,Private
```

### 2.5. Tự khởi động khi máy bật (tùy chọn)

```powershell
# PowerShell as Administrator
schtasks /create /sc onstart /tn "NCA AutoStart" /tr "C:\NCA-offline\start.bat" /rl HIGHEST /f
```

Từ giờ mỗi khi máy bật, NCA tự chạy. Tắt bằng:

```powershell
schtasks /delete /tn "NCA AutoStart" /f
```

---

## Phần 3 — Cập nhật code sau này

Khi sửa code trên máy dev, cập nhật lên máy đích:

```powershell
# === Trên máy dev ===
cd C:\NCA

# 1. Build lại
npm run build

# 2. Cập nhật gói (chỉ copy phần code, GIỮ NGUYÊN prod.db)
Copy-Item -Recurse -Force .next\standalone\* NCA-offline\
Copy-Item -Recurse -Force .next\static NCA-offline\.next\static
# Không copy prod.db — giữ dữ liệu hiện tại trên máy đích

# 3. Copy ra USB
Copy-Item -Recurse -Force NCA-offline E:\NCA-offline

# === Trên máy đích ===
# 4. Copy từ USB ghi đè (GIỮ NGUYÊN prod.db)
#    Chỉ copy server.js, .next/, node_modules/ — KHÔNG copy prod.db
```

> **Lưu ý**: Khi cập nhật, **không copy prod.db** từ máy dev sang máy đích — sẽ mất dữ liệu đang dùng. Chỉ ghi đè code (`.next/`, `server.js`, `node_modules/`).

---

## Cấu trúc gói NCA-offline

```
NCA-offline/              ~170MB
├── server.js             ← file chạy chính (Next.js standalone server)
├── start.bat             ← click đúp để chạy
├── .env                  ← cấu hình DATABASE_URL
├── prod.db               ← database SQLite (đã migrate + seed)
├── package.json
├── .next/
│   ├── (server code)     ← trace từ build
│   └── static/           ← CSS, JS client
├── node_modules/         ← chỉ file cần thiết (~50MB, đã trace)
└── public/               ← ảnh, icon (nếu có)
```

---

## Xử lý sự cố

### `node server.js` báo lỗi `better-sqlite3`

```
Error: The module was compiled against a different Node.js version
```

→ Node.js trên máy đích khác phiên bản với máy dev. Cài lại Node.js 24 trên máy đích (download installer từ máy dev trước khi chuyển USB).

### Máy khác trong LAN không vào được

1. Kiểm tra `start.bat` đang chạy (cửa sổ cmd còn mở)
2. Kiểm tra IP: `ipconfig`
3. Mở firewall: `New-NetFirewallRule -DisplayName "NCA Web (port 3000)" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow -Profile Domain,Private`
4. Test trên máy đích trước: `http://localhost:3000`

### Tắt web

Nhấn **Ctrl + C** trong cửa sổ cmd đang chạy `start.bat`, hoặc đóng cửa sổ đó.

### Backup database

```powershell
# Trên máy đích
Copy-Item C:\NCA-offline\prod.db C:\NCA-offline\backup\prod-$(Get-Date -Format 'yyyyMMdd').db
```

### Xem/sửa database trực tiếp

```powershell
# Trên máy dev (có prisma)
cd C:\NCA
npx prisma studio
# → mở http://localhost:5555
```

---

## Tóm tắt nhanh

```powershell
# === TRÊN MÁY DEV (có mạng) ===
cd C:\NCA
npm run build
# Tạo prod.db:
Remove-Item prod.db -ErrorAction SilentlyContinue
DATABASE_URL="file:./prod.db" npx prisma migrate deploy
DATABASE_URL="file:./prod.db" npx prisma db seed
# Gói:
Remove-Item NCA-offline -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path NCA-offline -Force
Copy-Item -Recurse .next\standalone\* NCA-offline\
Copy-Item -Recurse .next\static NCA-offline\.next\static
Copy-Item -Recurse public NCA-offline\public -ErrorAction SilentlyContinue
Copy-Item prod.db NCA-offline\prod.db
Set-Content -Path NCA-offline\.env -Value 'DATABASE_URL="file:./prod.db"'
Set-Content -Path NCA-offline\start.bat -Value "@echo off`ncd /d %~dp0`nnode server.js"
# Copy ra USB:
Copy-Item -Recurse NCA-offline E:\NCA-offline

# === TRÊN MÁY ĐÍCH (không mạng) ===
# Copy từ USB vào:
Copy-Item -Recurse E:\NCA-offline C:\NCA-offline
# Chạy:
cd C:\NCA-offline
.\start.bat
# → http://localhost:3000  hoặc  http://<IP>:3000
```
