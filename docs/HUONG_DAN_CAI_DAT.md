# Hướng dẫn cài đặt NCA trên máy nội bộ

> Tài liệu này hướng dẫn cài đặt hệ thống **NCA — Quản lý nhu cầu đặt ảnh** lên một máy Windows nội bộ, chạy như service tự khởi động, truy cập từ mọi máy trong mạng LAN.

---

## Mục lục

1. [Tổng quan](#1-tổng-quan)
2. [Chuẩn bị máy server](#2-chuẩn-bị-máy-server)
3. [Cài đặt từng bước](#3-cài-đặt-từng-bước)
4. [Kiểm tra hoạt động](#4-kiểm-tra-hoạt-động)
5. [Cài đặt service tự khởi động](#5-cài-đặt-service-tự-khởi-động)
6. [Cấu hình backup tự động](#6-cấu-hình-backup-tự-động)
7. [Cập nhật phiên bản mới](#7-cập-nhật-phiên-bản-mới)
8. [Lệnh quản lý thường dùng](#8-lệnh-quản-lý-thường-dùng)
9. [Xử lý sự cố](#9-xử-lý-sự-cố)

---

## 1. Tổng quan

### Kiến trúc triển khai

```
[Máy server nội bộ — Windows]
  ├── NCA app (Next.js, port 3000)
  │     └── pm2 process — tự bật khi khởi động máy, tự restart khi crash
  ├── prod.db (SQLite) — cơ sở dữ liệu production
  ├── backup/prod-*.db — backup tự động hằng ngày
  └── logs/out.log, err.log — file log

[Máy admin & các máy trong LAN]
  └── Trình duyệt → http://<địa-chỉ-IP-server>:3000
```

### Thông tin hệ thống

| Thông tin       | Giá trị                                     |
| --------------- | ------------------------------------------- |
| Repo GitHub     | https://github.com/vandai100421/NCA.git     |
| Cổng mặc định   | 3000                                        |
| Database        | SQLite (file `prod.db`)                     |
| Hệ điều hành    | Windows 10/11 hoặc Windows Server           |
| Process manager | pm2 (cài qua npm, không cần tải file ngoài) |

---

## 2. Chuẩn bị máy server

### 2.1. Yêu cầu phần mềm

| Phần mềm | Phiên bản yêu cầu          | Tải từ                           | Ghi chú                    |
| -------- | -------------------------- | -------------------------------- | -------------------------- |
| Node.js  | 20.9+ (khuyến nghị 22 LTS) | https://nodejs.org               | Chọn bản LTS (Even number) |
| Git      | bất kỳ                     | https://git-scm.com/download/win | Để clone và pull code      |

> **Lưu ý**: Nếu dùng Node.js 24, có thể gặp lỗi khi cài `better-sqlite3` (thiếu prebuilt binary). Khuyến nghị dùng **Node.js 22 LTS** để né lỗi.
>
> **pm2** (process manager) được cài tự động bởi script ở Bước 5 — không cần tải trước.

### 2.2. Cài Node.js

1. Vào https://nodejs.org
2. Tải bản **LTS** (khuyến nghị 22.x)
3. Chạy installer, để tùy chọn mặc định (tick "Add to PATH")
4. Mở **PowerShell**, kiểm tra:

```powershell
node -v
# Kết quả mong đợi: v22.x.x

npm -v
# Kết quả mong đợi: 10.x.x
```

### 2.3. Cài Git

1. Vào https://git-scm.com/download/win
2. Tải và chạy installer, để tùy chọn mặc định
3. Kiểm tra:

```powershell
git --version
# Kết quả mong đợi: git version 2.x.x
```

---

## 3. Cài đặt từng bước

### 3.1. Mở PowerShell

Mở **PowerShell** (không cần Administrator ở bước này).

### 3.2. Clone source code

```powershell
cd C:\
git clone https://github.com/vandai100421/NCA.git
cd NCA
```

> Nếu máy chưa có quyền truy cập repo, liên hệ quản trị viên để được cấp quyền hoặc nhận file ZIP.

### 3.3. Tạo file cấu hình `.env`

```powershell
# Tạo file .env với nội dung trỏ tới prod.db (DB production riêng)
Set-Content -Path .env -Value 'DATABASE_URL="file:./prod.db"'
```

Kiểm tra:

```powershell
Get-Content .env
# Kết quả mong đợi: DATABASE_URL="file:./prod.db"
```

### 3.4. Chạy script cài đặt tự động

```powershell
.\scripts\deploy\install.ps1
```

Script sẽ tự động thực hiện:

| Bước | Lệnh                        | Mô tả                                      |
| ---- | --------------------------- | ------------------------------------------ |
| 1    | `npm ci`                    | Cài đặt các thư viện cần thiết             |
| 2    | `npx prisma generate`       | Tạo Prisma client                          |
| 3    | `npx prisma migrate deploy` | Tạo database `prod.db` + áp dụng cấu trúc  |
| 4    | `npx prisma db seed`        | Tạo dữ liệu mẫu (mục tiêu, nguồn, nhu cầu) |
| 5    | `npm run build`             | Build phiên bản production                 |

Quá trình mất khoảng 2-5 phút tùy máy.

> **Không muốn seed dữ liệu mẫu?** Chạy: `.\scripts\deploy\install.ps1 -SkipSeed`

### 3.5. Nếu gặp lỗi `better-sqlite3`

Nếu ở bước `npm ci` báo lỗi liên quan đến `better-sqlite3` / `node-gyp` / `MSBuild`:

**Cách 1 — Cài Build Tools (khuyến nghị nếu dùng Node 24):**

1. Tải Visual Studio Build Tools 2022: https://visualstudio.microsoft.com/visual-cpp-build-tools/
2. Cài đặt, tick chọn workload **"Desktop development with C++"**
3. Cài Python 3: https://www.python.org/downloads/
4. Chạy lại:

```powershell
npm rebuild better-sqlite3
.\scripts\deploy\install.ps1
```

**Cách 2 — Đổi sang Node 22 LTS (đơn giản hơn):**

1. Gỡ Node 24 hiện tại
2. Cài Node 22 LTS từ https://nodejs.org
3. Xóa thư mục `node_modules`: `Remove-Item -Recurse -Force node_modules`
4. Chạy lại: `.\scripts\deploy\install.ps1`

---

## 4. Kiểm tra hoạt động

### 4.1. Chạy thử thủ công

```powershell
npm run start
```

Khi thấy dòng `▲ Next.js 16.2.10` / `- Local: http://localhost:3000`, server đã chạy.

### 4.2. Kiểm tra trên máy server

Mở trình duyệt → vào **http://localhost:3000**

- Tự redirect sang `/tong-quan` (trang tổng quan)
- Thử các chức năng: tạo nhu cầu, filter, export CSV, xem chi tiết

### 4.3. Kiểm tra từ máy khác trong LAN

1. Tìm IP của máy server:

```powershell
ipconfig
# Tìm dòng "IPv4 Address", ví dụ: 192.168.1.50
```

2. Từ máy khác trong mạng, mở trình duyệt → **http://192.168.1.50:3000**

> Nếu không vào được, tạm tắt Windows Firewall để test:
> `netsh advfirewall set allprofiles state off` (test xong thì bật lại: `netsh advfirewall set allprofiles state on`)
>
> Nếu tắt firewall vào được → cần mở port ở Bước 5.

### 4.4. Dừng server test

Nhấn **Ctrl + C** trong PowerShell để dừng.

---

## 5. Cài đặt service tự khởi động

Bước này cài NCA như **service** dùng **pm2** — tự chạy khi máy bật, tự restart khi crash, không cần mở terminal. pm2 được cài qua npm (không cần tải file ngoài).

### 5.1. Mở PowerShell as Administrator

- Click phải vào **Start** → **Windows PowerShell (Admin)**
- Hoặc: mở Start → gõ "powershell" → click phải → **Run as administrator**

### 5.2. Chạy script cài service

```powershell
cd C:\NCA
.\scripts\deploy\setup-service.ps1
```

Script tự động:

1. Cài `pm2` + `pm2-windows-startup` toàn cục (qua npm)
2. Cài auto-startup (tạo Windows Service "pm2" tự bật khi máy boot)
3. Tạo process tên **NCA** chạy `npm run start`
4. Cấu hình tự restart khi crash
5. Redirect log ra `logs\out.log` và `logs\err.log`
6. Mở firewall port 3000 cho mạng nội bộ
7. Lưu process list (`pm2 save`) để khôi phục khi reboot
8. Hiển thị địa chỉ truy cập

### 5.3. Kết quả mong đợi

```
=== Thong tin truy cap ===
  http://192.168.1.50:3000

=== HOAN THANH ===
Process 'NCA' da cai voi pm2.
```

Các máy trong công ty giờ có thể truy cập `http://192.168.1.50:3000` (thay IP bằng IP thực tế).

### 5.4. Tùy chỉnh port (nếu cần)

Nếu port 3000 bị chiếm, đổi sang port khác:

```powershell
.\scripts\deploy\setup-service.ps1 -Port 8080
```

---

## 6. Cấu hình backup tự động

### 6.1. Test backup thủ công

```powershell
cd C:\NCA
.\scripts\deploy\backup-db.ps1
```

Kết quả: tạo file `backup\prod-20260710-143000.db`, tự động giữ 14 bản gần nhất.

### 6.2. Cài backup tự động hằng ngày

Mở **PowerShell as Administrator**, chạy:

```powershell
$action = New-ScheduledTaskAction -Execute 'powershell.exe' `
    -Argument '-NoProfile -ExecutionPolicy Bypass -File "C:\NCA\scripts\deploy\backup-db.ps1"' `
    -WorkingDirectory 'C:\NCA'
$trigger = New-ScheduledTaskTrigger -Daily -At 2am
Register-ScheduledTask -TaskName 'NCA Backup DB' -Action $action -Trigger $trigger `
    -Description 'Backup NCA prod.db hang ngay' -RunLevel Highest
```

Từ nay, mỗi ngày 2:00 sáng, hệ thống tự backup database và giữ 14 bản gần nhất.

> Đổi số bản giữ lại: sửa trong `backup-db.ps1` hoặc chạy `.\scripts\deploy\backup-db.ps1 -Keep 30`

---

## 7. Cập nhật phiên bản mới

Khi có code mới trên GitHub, cập nhật bằng 1 lệnh:

```powershell
# PowerShell as Administrator
cd C:\NCA
.\scripts\deploy\update-app.ps1
```

Script tự động:

1. Dừng process NCA (pm2)
2. Pull code mới từ GitHub
3. Cài lại thư viện nếu cần (`npm ci`)
4. Generate Prisma client nếu schema thay đổi
5. Áp dụng migration mới nếu có
6. Build lại production
7. Khởi động lại process NCA (pm2)

Quá trình mất 2-5 phút, web tạm thời không truy cập được trong lúc update.

---

## 8. Lệnh quản lý thường dùng

Mở **PowerShell** và chạy:

```powershell
# Xem trạng thái tất cả process
pm2 status

# Dừng process NCA
pm2 stop NCA

# Khởi động process NCA
pm2 start NCA

# Khởi động lại process NCA
pm2 restart NCA

# Xem log realtime
pm2 logs NCA

# Xem log 50 dòng cuối
pm2 logs NCA --lines 50

# Xem file log trực tiếp
Get-Content C:\NCA\logs\out.log -Tail 50
Get-Content C:\NCA\logs\err.log -Tail 50

# Xem database trực tiếp (chỉ trên server)
cd C:\NCA
npx prisma studio
# → mở http://localhost:5555

# Backup thủ công
cd C:\NCA
.\scripts\deploy\backup-db.ps1

# Xóa process (khi không dùng nữa)
pm2 delete NCA
pm2 save
```

---

## 9. Xử lý sự cố

### 9.1. Service không khởi động

```powershell
# Xem log lỗi
pm2 logs NCA --lines 50

# Chạy thử ngoài pm2 để thấy lỗi trực tiếp
pm2 stop NCA
cd C:\NCA
npm run start
```

### 9.2. Không truy cập được từ máy khác trong LAN

Kiểm tra theo thứ tự:

1. **Process đang chạy?**

   ```powershell
   pm2 status
   # Trạng thái phải là: online
   ```

2. **Firewall đã mở port 3000?**

   ```powershell
   Get-NetFirewallRule -DisplayName "NCA*"
   ```

   Nếu chưa có, chạy lại `.\scripts\deploy\setup-service.ps1` (as Admin).

3. **Test trên chính máy server trước**: mở `http://localhost:3000`

4. **IP đúng chưa?**

   ```powershell
   ipconfig
   ```

5. **Cùng mạng LAN chưa?** Máy truy cập phải cùng subnet (vd cùng `192.168.1.x`)

### 9.3. Database bị lỗi / cần khôi phục

```powershell
# Dừng process
pm2 stop NCA

# Khôi phục từ backup (đổi tên file theo thực tế)
Copy-Item .\backup\prod-20260710-020000.db .\prod.db -Force

# Khởi động lại
pm2 start NCA
```

### 9.4. Đổi port

```powershell
# As Administrator
pm2 stop NCA
pm2 delete NCA
$env:PORT = "8080"
pm2 start npm --name NCA -- run start
pm2 save

# Mở firewall port mới
New-NetFirewallRule -DisplayName "NCA Web (port 8080)" -Direction Inbound -Protocol TCP -LocalPort 8080 -Action Allow -Profile Domain,Private
```

### 9.5. pm2 không tự khởi động lại sau khi restart máy

```powershell
# As Administrator
pm2-startup install
pm2 resurrect
```

### 9.6. Cài lại từ đầu

```powershell
# As Administrator
pm2 delete NCA
pm2 save

# Xóa DB cũ (CẨN THẬN — mất toàn bộ dữ liệu)
Remove-Item .\prod.db

# Chạy lại cài đặt
.\scripts\deploy\install.ps1
.\scripts\deploy\setup-service.ps1
```

---

## Tóm tắt nhanh

```powershell
# === CÀI ĐẶT LẦN ĐẦU (trên máy server mới) ===

# 1. Cài Node.js 22 LTS + Git (xem Mục 2)

# 2. Clone code
cd C:\
git clone https://github.com/vandai100421/NCA.git
cd NCA

# 3. Tạo file .env
Set-Content -Path .env -Value 'DATABASE_URL="file:./prod.db"'

# 4. Cài đặt + build
.\scripts\deploy\install.ps1

# 5. Test chạy
npm run start
# → mở http://localhost:3000, kiểm tra xong nhấn Ctrl+C

# 6. Cài service (PowerShell as Admin)
.\scripts\deploy\setup-service.ps1

# 7. Cài backup tự động (PowerShell as Admin)
$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument '-NoProfile -ExecutionPolicy Bypass -File "C:\NCA\scripts\deploy\backup-db.ps1"' -WorkingDirectory 'C:\NCA'
$trigger = New-ScheduledTaskTrigger -Daily -At 2am
Register-ScheduledTask -TaskName 'NCA Backup DB' -Action $action -Trigger $trigger -Description 'Backup NCA prod.db hang ngay' -RunLevel Highest

# === XONG — các máy trong LAN truy cập http://<IP-server>:3000 ===


# === CẬP NHẬT SAU NÀY (khi có code mới) ===
# PowerShell as Admin
cd C:\NCA
.\scripts\deploy\update-app.ps1
```
