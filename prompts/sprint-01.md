# Prompt — Sprint 01 (Master data)

## Bối cảnh

Đọc trước: `PROJECT.md`, `ARCHITECTURE.md`, `CODING_STANDARDS.md`, `DEVELOPMENT_RULES.md`, `docs/handoff/sprint-00.md`.

## Mục tiêu

Xây dựng master data: Prisma schema đầy đủ + CRUD cho `MucTieu` và `Nguon`.

## Tasks (theo TASKS.md)

1. Định nghĩa Prisma schema đầy đủ (4 model + 4 enum) trong `prisma/schema.prisma`:
   - `MucTieu` (id, ten unique)
   - `Nguon` (id, nguon, tenNguon unique, thoiGianSuDung string, tinhTrang enum, danhGia string?)
   - `NhuCauAnh` (đầy đủ trường theo PROJECT.md, FK tới MucTieu + Nguon)
   - `NhuCauAnhLichSu` (id, nhuCauId FK, trangThaiCu enum?, trangThaiMoi enum, thoiGian, ghiChu?)
   - Enum: `LoaiNhuCau`, `LoaiAnhChup`, `TrangThaiNhuCau`, `TinhTrangNguon`
2. Chạy `npx prisma migrate dev --name init` + tạo `prisma/seed.ts` (một vài mucTieu, nguon mẫu)
3. Module `muc-tieu`:
   - `schema/muc-tieu-schema.ts`: Zod schema create/update
   - `api/muc-tieu-service.ts`: getAll, getById, create, update, delete
   - `api/muc-tieu-route.ts`: route handlers `/api/muc-tieu` + `/api/muc-tieu/[id]`
4. Module `nguon`: cấu trúc tương tự
5. UI: list + form (react-hook-form + zodResolver) cho cả 2 module
6. Setup TanStack Query provider ở layout, hooks `useMucTieuList`, `useNguonList`
7. Layout dashboard: sidebar nav (Tổng quan, Nhu cầu ảnh, Nguồn, Mục tiêu)

## Ràng buộc

- Tuân thủ `CODING_STANDARDS.md` (no `any`, Zod-first, service layer tách route handler).
- Mọi API response dùng `apiSuccess` / `apiError` từ `@/lib/errors`.
- Prisma client import từ `@/lib/db`.
- Sau khi xong: chạy typecheck + lint + format, cập nhật TASKS.md, viết `docs/handoff/sprint-01.md`.
