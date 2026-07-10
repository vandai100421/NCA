# DEPLOY — Hướng dẫn build & triển khai NCA trên máy nội bộ (LAN)

> Web nội bộ, 1 admin. Server chạy như service (pm2), truy cập từ mọi máy trong LAN.

## Kiến trúc triển khai

```
[Máy server nội bộ Windows]
  ├── NCA app (Next.js production server, port 3000)
  │     ├── pm2 process — auto-start + auto-restart
  │     └── logs/out.log, err.log
  ├── prod.db (SQLite) — DB production riêng
  └── backup/prod-*.db — backup hằng ngày (Scheduled Task)

[Máy admin / các máy trong LAN]
  └── Trình duyệt → http://<server-ip>:3000
```

## Yêu cầu máy server

| Yêu cầu                   | Phiên bản                               | Ghi chú                                 |
| ------------------------- | --------------------------------------- | --------------------------------------- |
| Node.js                   | 20.9+ (khuyến nghị 22 LTS hoặc 24)      | `better-sqlite3` cần match              |
| npm                       | 10+                                     | Kèm theo Node                           |
| Git                       | bất kỳ                                  | để clone / pull                         |
| VS Build Tools + Python 3 | chỉ nếu `better-sqlite3` thiếu prebuilt | workload "Desktop development with C++" |

> **pm2** (process manager) được cài tự động qua `npm install -g pm2` — không cần tải file ngoài.

> **Mẹo né native compile**: Nếu `npm ci` lỗi ở bước `better-sqlite3`, cài Node 22 LTS (có prebuilt binary sẵn) thay vì Node 24.

---

## Bước 1 — Chuẩn bị máy server

### 1.1 Cài Node.js

Tải Node.js LTS từ https://nodejs.org, cài mặc định.

```powershell
node -v   # phải >= 20.9
npm -v
```

### 1.2 Cài Git

Tải Git từ https://git-scm.com/download/win, cài mặc định.

```powershell
git --version
```

### 1.3 Clone repo

```powershell
git clone https://github.com/vandai100421/NCA.git C:\NCA
cd C:\NCA
```

### 1.4 Tạo `.env` cho production

```powershell
# Chỉ cần DATABASE_URL cho app (CUSTOM_API_KEY là của opencode, không dùng trên server)
# Nội dung .env:
#   DATABASE_URL="file:./prod.db"

# Tạo nhanh:
Set-Content -Path .env -Value 'DATABASE_URL="file:./prod.db"'
```

---

## Bước 2 — Cài đặt (fresh install)

```powershell
cd C:\NCA

# Chạy script tự động: npm ci → prisma generate → migrate deploy → seed → build
.\scripts\deploy\install.ps1

# Nếu KHÔNG muốn seed dữ liệu mẫu:
.\scripts\deploy\install.ps1 -SkipSeed
```

Script thực hiện:

1. `npm ci` — cài deps đúng phiên bản từ lockfile
2. `npx prisma generate` — generate Prisma client (bị gitignore)
3. `npx prisma migrate deploy` — áp dụng migrations, tạo `prod.db`
4. `npx prisma db seed` — (tùy chọn) dữ liệu mẫu
5. `npm run build` — build production (kèm typecheck)

---

## Bước 3 — Test chạy thủ công

```powershell
npm run start
```

- Mở `http://localhost:3000` trên server (tự redirect → `/tong-quan`)
- Từ máy khác trong LAN: `http://<server-ip>:3000`
- Kiểm tra: tạo/sửa/xóa nhu cầu, filter, export CSV, dashboard

Nếu OK → nhấn `Ctrl+C` → sang Bước 4.

---

## Bước 4 — Cài service tự khởi động (pm2)

```powershell
# CHẠY POWERSHELL AS ADMINISTRATOR
cd C:\NCA
.\scripts\deploy\setup-service.ps1
```

Script thực hiện:

1. Cài `pm2` + `pm2-windows-startup` toàn cục (qua npm, không cần tải file ngoài)
2. Cài auto-startup (tạo Windows Service "pm2" tự bật khi máy boot)
3. Tạo process tên `NCA` chạy `npm run start`
4. Auto-restart khi crash
5. Redirect log → `logs/out.log`, `logs/err.log`
6. Mở firewall port 3000 cho LAN (profile Domain, Private)
7. `pm2 save` — lưu process list để khôi phục khi reboot
8. Hiển thị IP truy cập

Tham số tùy chọn:

```powershell
.\scripts\deploy\setup-service.ps1 -ServiceName "NCA-Prod" -Port 8080
```

Lệnh quản lý service:

```powershell
pm2 stop NCA           # dừng
pm2 start NCA          # khởi động
pm2 restart NCA        # khởi động lại
pm2 status             # xem trạng thái tất cả process
pm2 logs NCA           # xem log realtime
pm2 delete NCA         # xóa process
```

---

## Bước 5 — Cấu hình backup DB

### 5.1 Backup thủ công (test)

```powershell
cd C:\NCA
.\scripts\deploy\backup-db.ps1
# → tạo backup\prod-20260710-143000.db, giữ 14 bản gần nhất
```

### 5.2 Backup tự động hằng ngày (Scheduled Task)

Mở Task Scheduler (taskschd.msc) → Create Basic Task:

| Thông số       | Giá trị                                                                          |
| -------------- | -------------------------------------------------------------------------------- |
| Name           | `NCA Backup DB`                                                                  |
| Trigger        | Daily, 02:00 AM                                                                  |
| Action         | Start a program                                                                  |
| Program/script | `powershell.exe`                                                                 |
| Arguments      | `-NoProfile -ExecutionPolicy Bypass -File "C:\NCA\scripts\deploy\backup-db.ps1"` |
| Start in       | `C:\NCA`                                                                         |

Hoặc tạo bằng PowerShell (as Admin):

```powershell
$action = New-ScheduledTaskAction -Execute 'powershell.exe' `
    -Argument '-NoProfile -ExecutionPolicy Bypass -File "C:\NCA\scripts\deploy\backup-db.ps1"' `
    -WorkingDirectory 'C:\NCA'
$trigger = New-ScheduledTaskTrigger -Daily -At 2am
Register-ScheduledTask -TaskName 'NCA Backup DB' -Action $action -Trigger $trigger `
    -Description 'Backup NCA prod.db hằng ngày' -RunLevel Highest
```

Giữ 30 bản thay vì 14:

```powershell
.\scripts\deploy\backup-db.ps1 -Keep 30
```

---

## Bước 6 — Cập nhật code khi có phiên bản mới

```powershell
# CHẠY POWERSHELL AS ADMINISTRATOR
cd C:\NCA
.\scripts\deploy\update-app.ps1
```

Script thực hiện:

1. Stop process `NCA` (pm2)
2. `git pull`
3. `npm ci` (nếu `package-lock.json` thay đổi)
4. `npx prisma generate` (nếu schema thay đổi)
5. `npx prisma migrate deploy` (nếu có migration mới)
6. `npm run build`
7. Restart process `NCA` (pm2)

---

## Cấu trúc file deploy

```
scripts/deploy/
├── install.ps1          # fresh install: ci + generate + migrate + seed + build
├── setup-service.ps1    # cài pm2 process + auto-startup + firewall
├── backup-db.ps1        # backup prod.db, giữ N bản gần nhất
└── update-app.ps1       # update: stop → pull → ci → generate → migrate → build → start
```

## Troubleshooting

### `npm ci` lỗi `better-sqlite3` (native compile)

```
error: MSBuild not found / node-gyp failed
```

**Fix**: Cài Visual Studio Build Tools 2022 (workload "Desktop development with C++") + Python 3, rồi:

```powershell
npm rebuild better-sqlite3
npm ci
```

Hoặc chuyển sang Node 22 LTS (có prebuilt binary sẵn).

### Service chạy nhưng không truy cập được từ máy khác

1. Kiểm tra process đang chạy: `pm2 status` → trạng thái `online`
2. Kiểm tra firewall: `Get-NetFirewallRule -DisplayName "NCA*"`
3. Kiểm tra log: `pm2 logs NCA --lines 50`
4. Kiểm tra IP: `ipconfig` → thử `http://<ip>:3000` từ máy server trước

### Service crash liên tục

```powershell
# Xem log
pm2 logs NCA --lines 50

# Chạy thử ngoài pm2 để thấy error trực tiếp
pm2 stop NCA
npm run start
```

### DB bị khóa / corrupted

```powershell
# Restore từ backup
pm2 stop NCA
Copy-Item .\backup\prod-20260710-020000.db .\prod.db -Force
pm2 start NCA
```

### Đổi port

```powershell
pm2 stop NCA
pm2 delete NCA
$env:PORT = "8080"
pm2 start npm --name NCA -- run start
pm2 save

# Mở firewall port mới
New-NetFirewallRule -DisplayName "NCA Web (port 8080)" -Direction Inbound -Protocol TCP -LocalPort 8080 -Action Allow -Profile Domain,Private
```

### pm2 không tự khởi động lại sau reboot

```powershell
# As Administrator
pm2-startup install
pm2 resurrect
```

### Xem DB trực tiếp

```powershell
npx prisma studio
# → mở http://localhost:5555 (chỉ trên server)
```
