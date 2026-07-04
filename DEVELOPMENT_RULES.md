# DEVELOPMENT RULES — NCA

## Workflow theo sprint

Dự án chia thành các sprint nhỏ (S0, S1, S2, S3...). Mỗi sprint:

1. Có mục tiêu rõ ràng, kết quả cần đạt định nghĩa ở `TASKS.md`.
2. Kết thúc sprint phải viết `docs/handoff/sprint-XX.md` (báo cáo bàn giao).
3. Cập nhật `TASKS.md` (đánh dấu xong) + `ARCHITECTURE.md` (nếu cấu trúc/data model thay đổi).

## Định nghĩa "Done"

Một task chỉ hoàn thành khi:

- [ ] Code pass `npm run typecheck` (0 error)
- [ ] Code pass `npm run lint` (0 warning, 0 error)
- [ ] Code pass `npm run format:check` (đã format)
- [ ] Test liên quan pass (nếu có)
- [ ] Không còn `TODO`/`FIXME` không có lý do
- [ ] Đã cập nhật `TASKS.md` + handoff (nếu cuối sprint)

## Pre-commit hook

`.husky/pre-commit` chạy `lint-staged`:

- File `*.{ts,tsx,js,jsx,mjs}` → `prettier --write` + `eslint --fix --max-warnings 0`
- File `*.{json,md,css}` → `prettier --write`

Nếu hook fail → fix rồi add lại, **không dùng `--no-verify`**.

## Quản lý task

`TASKS.md` là source of truth về tiến độ. Format:

```
- [x] Tên task — mô tả ngắn — (priority: high/med/low) — sprint: SX
- [ ] ...
```

Cập nhật status real-time, không batch cuối sprint.

## Resume pattern (giảm token reload)

Khi bắt đầu session/sprint mới, đọc theo thứ tự:

1. `TASKS.md` — biết đang ở đâu
2. `ARCHITECTURE.md` — biết cấu trúc hiện tại
3. `docs/handoff/sprint-XX.md` mới nhất — biết context ngay trước

Template prompt: `prompts/resume.md`.

## Quản lý database

- Schema ở `prisma/schema.prisma`.
- Sau khi sửa schema: `npx prisma migrate dev --name <mo-ta>` (dev) hoặc `npx prisma db push` (prototype nhanh).
- Luôn `npx prisma generate` sau khi sửa schema để regenerate client.
- File `*.db` không được commit (đã .gitignore).
- Seed data (nếu có) đặt ở `prisma/seed.ts`, chạy bằng `npx prisma db seed`.

## Quản lý secret

- Mọi secret (API key, connection string...) nằm trong `.env` (đã .gitignore).
- `.env.example` là template, được commit, không chứa giá trị thật.
- `opencode.json` dùng `{env:VAR_NAME}` substitution, không hardcode key.

## Khi gặp lỗi/blocked

1. Không cố ép chạy bằng cách tắt lint/tsconfig rule.
2. Đọc error message đầy đủ, trace về nguồn.
3. Nếu lỗi do phiên bản lib (Next 16 / Prisma 7 / Zod 4 / React 19), đọc docs trong `node_modules/<pkg>/dist/docs/` hoặc trang chính thức.
4. Ghi chú blocker vào `TASKS.md` (status: blocked) + handoff để sprint sau xử lý.
