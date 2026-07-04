# TASKS — NCA

> Tiến độ sprint. Cập nhật real-time. Định nghĩa "Done" ở `DEVELOPMENT_RULES.md`.

## Chú thích

- `[x]` xong · `[ ]` chưa làm · `[~]` đang làm · `[!]` blocked

---

## S0 — Khởi tạo & cấu hình

Trạng thái: **xong**

- [x] Sửa README.md encoding UTF-16 → UTF-8 — (high) — sprint: S0
- [x] Tạo .gitignore — (high) — sprint: S0
- [x] Xử lý API key: .env + .env.example + opencode.json dùng {env:} — (high) — sprint: S0
- [x] Tạo cấu trúc docs/handoff/ — (med) — sprint: S0
- [x] npm create next-app (TS + Tailwind v4 + App Router + ESLint + src-dir) — (high) — sprint: S0
- [x] Cài deps (prisma, zod, react-hook-form, tanstack-query, husky, lint-staged, prettier, vitest) — (high) — sprint: S0
- [x] Cấu hình tsconfig strict (noUncheckedIndexedAccess, exactOptionalPropertyTypes, noUnusedLocals...) — (high) — sprint: S0
- [x] Tạo .prettierrc + .prettierignore, mở rộng eslint.config.mjs (eslint-plugin-unused-imports, cấm any), husky pre-commit + lint-staged — (high) — sprint: S0
- [x] prisma init sqlite + cấu hình output src/infrastructure/prisma/generated — (high) — sprint: S0
- [x] Scaffold src/modules/ (nhu-cau-anh, nguon, muc-tieu, shared) — (med) — sprint: S0
- [x] Tạo lib/db.ts (Prisma singleton), lib/errors.ts (typed errors + API envelope), lib/utils.ts (cn) — (high) — sprint: S0
- [x] Init shadcn/ui + cài components (button, input, label, select, table, badge, card, dialog, sonner) — (med) — sprint: S0
- [x] Điền PROJECT.md, ARCHITECTURE.md, CODING_STANDARDS.md, DEVELOPMENT_RULES.md, TASKS.md, prompts/ — (high) — sprint: S0
- [x] Viết docs/handoff/sprint-00.md — (med) — sprint: S0
- [x] Chạy typecheck + eslint + prettier check — (high) — sprint: S0
- [x] Git commit S0 — (med) — sprint: S0

## S1 — Master data

Trạng thái: **chưa bắt đầu**

- [ ] Định nghĩa Prisma schema đầy đủ (4 model + 4 enum) — (high) — sprint: S1
- [ ] Migration đầu tiên + seed data mẫu — (high) — sprint: S1
- [ ] Module `muc-tieu`: Zod schema + service + route handlers (CRUD) — (high) — sprint: S1
- [ ] Module `nguon`: Zod schema + service + route handlers (CRUD) — (high) — sprint: S1
- [ ] UI MucTieu: list + form tạo/sửa + xóa — (high) — sprint: S1
- [ ] UI Nguon: list + form tạo/sửa + xóa — (high) — sprint: S1
- [ ] Setup TanStack Query provider + hooks cơ bản — (med) — sprint: S1
- [ ] Layout dashboard (sidebar/nav) — (med) — sprint: S1

## S2 — Nhu cầu ảnh (core)

Trạng thái: **chưa bắt đầu**

- [ ] Module `nhu-cau-anh`: Zod discriminated union (CO_DINH / DOT_XUAT) + refine — (high) — sprint: S2
- [ ] Service: create, update, transition state (có guard) + tạo NhuCauAnhLichSu — (high) — sprint: S2
- [ ] Route handlers CRUD + endpoint chuyển trạng thái — (high) — sprint: S2
- [ ] UI form conditional theo loaiNhuCau (react-hook-form + zodResolver) — (high) — sprint: S2
- [ ] UI list + filter (trạng thái, nguồn, mục tiêu, loại) + pagination — (high) — sprint: S2
- [ ] UI detail + timeline lịch sử trạng thái — (med) — sprint: S2

## S3 — Dashboard & polish

Trạng thái: **chưa bắt đầu**

- [ ] Trang tổng quan: đếm nhu cầu theo trạng thái / theo nguồn — (high) — sprint: S3
- [ ] Search toàn văn — (med) — sprint: S3
- [ ] Export CSV danh sách nhu cầu — (med) — sprint: S3
- [ ] Empty / loading / error states nhất quán — (med) — sprint: S3
- [ ] Vitest cho service layer (schema validation + state transition) — (med) — sprint: S3
- [ ] Thêm typecheck vào prebuild — (low) — sprint: S3
