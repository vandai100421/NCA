# Handoff — Sprint 00 (Khởi tạo & cấu hình)

> Báo cáo bàn giao. Đọc kèm `TASKS.md` + `ARCHITECTURE.md` khi resume.

## Việc đã làm

Thiết lập toàn bộ nền tảng dự án NCA: sửa file config cũ, khởi tạo Next.js, cài đặt thư viện, cấu hình validation đa lớp, scaffold cấu trúc module, điền bộ tài liệu định hướng.

## File đã tạo / sửa

### Cấu hình dự án

- `README.md` — sửa encoding UTF-16 → UTF-8, nội dung tối thiểu
- `.gitignore` — loại trừ node_modules, .env, .next, prisma db, generated client
- `.env` — chứa API key thật + DATABASE_URL (không commit)
- `.env.example` — template (commit được)
- `opencode.json` — chuyển API key sang `{env:CUSTOM_API_KEY}`, thêm 5 file .md vào `instructions`

### Next.js + thư viện

- `package.json` — name `nca`, scripts: dev/build/start/lint/typecheck/format/test/test:watch/prepare
- `tsconfig.json` — strict + `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitReturns`, `noUnusedLocals/Parameters`, `noFallthroughCasesInSwitch`, `noImplicitOverride`
- `eslint.config.mjs` — flat config ESLint 9, thêm `eslint-plugin-unused-imports`, cấm `any`
- `.prettierrc` — 2 space, single quote, semicolon, trailing comma all, print width 100
- `.prettierignore`
- `.husky/pre-commit` — chạy `lint-staged`
- `lint-staged` config trong `package.json`

### Prisma

- `prisma/schema.prisma` — datasource sqlite, generator `prisma-client` output `../src/infrastructure/prisma/generated`
- `prisma.config.ts` — config TypeScript mới của Prisma 7 (datasource URL từ env)
- `src/infrastructure/prisma/generated/` — client đã generate (gitignored, schema chưa có model)

### Cấu trúc module (scaffold rỗng, sẵn sàng cho S1)

- `src/modules/nhu-cau-anh/{api,components,lib,schema}/` + `index.ts`
- `src/modules/nguon/{api,components,lib,schema}/` + `index.ts`
- `src/modules/muc-tieu/{api,components,lib,schema}/` + `index.ts`
- `src/modules/shared/{enums,constants,index}.ts` (rỗng)

### Lib cross-cutting

- `src/lib/db.ts` — PrismaClient singleton (log error/warn ở dev)
- `src/lib/errors.ts` — typed errors: `AppError`, `ValidationError`, `NotFoundError`, `StateTransitionError`, `ConflictError`; API envelope `apiSuccess`/`apiError`; interface `ApiResponse<T>`
- `src/lib/utils.ts` — `cn()` helper (shadcn)

### UI (shadcn/ui, style base-nova)

- `components.json` — config shadcn
- `src/components/ui/` — button, input, label, select, table, badge, card, dialog, sonner
- `src/app/layout.tsx` — đổi lang=vi, metadata NCA, thêm Toaster (sonner)
- `src/app/globals.css` — Tailwind v4 + design tokens (shadcn cập nhật)

### Tài liệu

- `PROJECT.md` — mô tả bài toán đầy đủ (4 thực thể, workflow, MVP, ngoài phạm vi)
- `ARCHITECTURE.md` — stack, cấu trúc thư mục, data model tóm tắt, nguyên tắc, validation đa lớp, resume pattern
- `CODING_STANDARDS.md` — TS/Prettier/ESLint/đặt tên/import/component/API/Prisma/git/test
- `DEVELOPMENT_RULES.md` — workflow sprint, định nghĩa Done, pre-commit, quản lý task/db/secret
- `TASKS.md` — checklist S0–S3
- `prompts/sprint-01.md` — prompt cho S1
- `prompts/resume.md` — template resume
- `docs/handoff/README.md` + `docs/handoff/sprint-00.md` (file này)

## Quyết định kỹ thuật đã chốt

1. **Next.js 16 + React 19 + Tailwind v4 + Prisma 7 + Zod 4** — đây là phiên bản mới, có breaking changes so với training data. Khi code nghiệp vụ ở S1+, phải đọc docs trong `node_modules/<pkg>/dist/docs/` nếu gặp API lạ.
2. **Prisma 7** dùng `prisma-client` provider (không phải `prisma-client-js`), output dạng ESM TypeScript. Import `PrismaClient` từ `@/infrastructure/prisma/generated/client`. Cần `prisma.config.ts` + `dotenv` devDep.
3. **shadcn/ui style "base-nova"** (style mới nhất, không phải default/new-york). Form component không có trong registry base-nova → khi cần form ở S2, sẽ dùng react-hook-form trực tiếp hoặc tự viết wrapper.
4. **Sonner thay cho toast** (shadcn deprecated toast component).
5. **API key trong opencode.json** dùng `{env:CUSTOM_API_KEY}` substitution — an toàn, không lộ khi commit.
6. **Không auth** — đúng MVP, web nội bộ 1 admin.

## Vấn đề còn tồn / TODO

- Prisma schema chưa có model (sẽ thêm ở S1).
- Chưa có migration (sẽ tạo ở S1).
- Chưa có seed.
- Chưa có UI dashboard layout (S1).
- `src/modules/shared/enums.ts` đang rỗng — sẽ điền ở S1 khi định nghĩa Prisma enum (để sync).
- Prisma 7 + SQLite: cần verify cách PrismaClient kết nối DB runtime (có thể cần adapter `@prisma/adapter-better-sqlite3` hoặc tương tự). Nếu `new PrismaClient()` runtime lỗi ở S1, kiểm tra docs Prisma 7.

## Điều kiện tiên quyết cho S1

- Đã có Node 24 + npm 11.
- `.env` chứa `DATABASE_URL="file:./dev.db"` (SQLite).
- Đã đọc `PROJECT.md` (đặc biệt phần thực thể + workflow trạng thái) và `prompts/sprint-01.md`.
- Chạy `npm run typecheck` + `npm run lint` phải sạch trước khi bắt đầu S1.

## Lệnh kiểm tra trạng thái hiện tại

```bash
npm run typecheck   # phải 0 error
npm run lint        # phải 0 warning
npm run format:check
git status
```
