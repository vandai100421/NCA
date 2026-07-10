# NCA — Quản lý nhu cầu đặt ảnh

Web nội bộ quản lý nhu cầu đặt ảnh từ các nguồn (vệ tinh / UAV / hàng không) trong công ty.

## Stack

- Next.js 16 (App Router) + TypeScript strict
- Prisma 7 + SQLite (driver adapter `@prisma/adapter-better-sqlite3`)
- Tailwind CSS v4 + shadcn/ui (style: base-nova)
- Zod 4 (validation) + react-hook-form + TanStack Query
- Vitest (test) + ESLint 9 + Prettier 3 + husky + lint-staged

## Yêu cầu môi trường

- **Node.js 20.9+** (Next.js 16 yêu cầu)
- **npm 10+**

## Cài đặt khi clone về máy mới

```bash
# 1. Clone
git clone <repo-url>
cd NCA

# 2. Tạo .env từ template (KHÔNG commit file .env)
cp .env.example .env
# → Mở .env điền API key thật:
#   CUSTOM_API_KEY=sk-...
#   CUSTOM_BASE_URL=https://api.int2.net/v1
#   DATABASE_URL="file:./dev.db"

# 3. Cài dependencies (tự chạy husky prepare)
npm install

# 4. Generate Prisma client (bị .gitignore)
npx prisma generate

# 5. Tạo DB + chạy migration + seed (dev.db bị .gitignore)
npx prisma migrate dev
npx prisma db seed

# 6. Chạy dev server
npm run dev
```

Mở trình duyệt tại **http://localhost:3000** (tự redirect sang `/tong-quan`).

## Những thứ KHÔNG được commit (phải tạo lại)

| Thứ                                    | Lý do                  | Cách tạo lại                                    |
| -------------------------------------- | ---------------------- | ----------------------------------------------- |
| `.env`                                 | Chứa API key nhạy cảm  | `cp .env.example .env` + điền key               |
| `node_modules/`                        | Nặng, có thể khác OS   | `npm install`                                   |
| `src/infrastructure/prisma/generated/` | Code generate          | `npx prisma generate`                           |
| `dev.db`                               | DB local, dữ liệu test | `npx prisma migrate dev` + `npx prisma db seed` |
| `.next/`                               | Build cache            | `npm run dev` tự tạo                            |
| `.husky/_/`                            | Husky internal         | `npm install` tự tạo qua script `prepare`       |

## Lệnh

```bash
npm run dev          # chạy dev server
npm run build        # build production
npm run start        # chạy production server
npm run lint         # eslint
npm run typecheck    # tsc --noEmit
npm run format       # prettier --write .
npm run format:check # prettier --check .
npm test             # vitest run
npm run test:watch   # vitest watch mode

npx prisma studio    # UI quản lý DB
npx prisma db seed   # chạy lại seed data
npx prisma migrate dev --name <name>  # tạo migration mới
```

## Dữ liệu mẫu

Sau khi seed, DB có sẵn:

- **4 mục tiêu** (Khu công nghiệp Bắc Thăng Long, Cảng biển Hải Phòng, Khu vực biên giới Lạng Sơn, Đô thị trung tâm Hà Nội)
- **5 nguồn** (VT-Optical-Sat1, VT-SAR-Sat2, UAV-DJI-M300-01, HK-Cessna-208, UAV-FixedWing-02)

## Tài liệu

- `PROJECT.md` — mô tả bài toán (thực thể, workflow, MVP)
- `ARCHITECTURE.md` — kiến trúc, data model, routes, state machine
- `CODING_STANDARDS.md` — quy ước code (TS, Prettier, ESLint, đặt tên)
- `DEVELOPMENT_RULES.md` — quy trình sprint, định nghĩa Done, pre-commit
- `TASKS.md` — tiến độ sprint (S0–S4)
- `DEPLOY.md` — triển khai trên máy nội bộ có mạng (pm2)
- `docs/HUONG_DAN_CAI_DAT.md` — hướng dẫn cài đặt chi tiết (có mạng)
- `docs/HUONG_DAN_OFFLINE.md` — hướng dẫn triển khai offline (không mạng, dùng USB)
- `docs/handoff/` — báo cáo bàn giao giữa các sprint
- `prompts/` — template prompt cho sprint + resume pattern

## Resume pattern (tiết kiệm token)

Khi tiếp tục làm việc ở session mới, đọc 3 file theo thứ tự:

1. `TASKS.md` — biết đang ở đâu
2. `ARCHITECTURE.md` — biết cấu trúc hiện tại
3. `docs/handoff/sprint-XX.md` mới nhất — biết context ngay trước

Xem template ở `prompts/resume.md`.
