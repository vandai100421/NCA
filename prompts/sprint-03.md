# Prompt — Sprint 03 (Dashboard & polish)

## Bối cảnh

Đọc trước: `PROJECT.md`, `ARCHITECTURE.md`, `CODING_STANDARDS.md`, `DEVELOPMENT_RULES.md`, `docs/handoff/sprint-02.md`.

Đã có: full CRUD cho 3 module (muc-tieu, nguon, nhu-cau-anh) + state machine + audit log. DB đã seed master data.

## Mục tiêu

Hoàn thiện MVP: trang tổng quan có số liệu thực, search toàn văn, export CSV, empty/loading states nhất quán, test Vitest cho service layer.

## Tasks (theo TASKS.md)

1. **Trang tổng quan** `/tong-quan`:
   - Đếm nhu cầu theo trạng thái (8 trạng thái) — card grid
   - Đếm nhu cầu theo nguồn (top 5) — card hoặc bar chart đơn giản
   - Đếm tổng mục tiêu, tổng nguồn, tổng nhu cầu
   - API: `GET /api/thong-ke/tong-quan` trả về aggregate

2. **Search toàn văn** (nâng cao hơn filter hiện tại):
   - Đã có `search` trong `nhuCauListQuerySchema` → đảm bảo hoạt động tốt
   - Thêm search cho muc-tieu + nguon list (nếu cần)

3. **Export CSV**:
   - API `GET /api/nhu-cau-anh/export?filters...` trả về CSV
   - Nút "Export CSV" ở list page, áp dụng filter hiện tại

4. **Empty/loading/error states nhất quán**:
   - Tạo component `EmptyState`, `LoadingState`, `ErrorState` tái sử dụng
   - Áp dụng cho cả 3 module list

5. **Vitest cho service layer**:
   - Test `state-machine.ts`: `canTransition` (hợp lệ/lệch), `getNextStates`, `isTerminal`, `isDeletable`
   - Test `nhu-cau-anh-schema.ts`: discriminated union (CO_DINH thiếu thoiGianChup fail, DOT_XUAT thiếu khoảng fail, `den < tu` fail)
   - Test `muc-tieu-schema.ts` + `nguon-schema.ts`: validation cơ bản
   - Cấu hình `vitest.config.ts`

6. **Prebuild typecheck**:
   - Thêm `prebuild: "npm run typecheck"` trong package.json
   - Build fail khi type sai

## Ràng buộc

- Tuân thủ `CODING_STANDARDS.md`.
- Test file đặt cùng thư mục code (`*.test.ts`).
- Sau khi xong: chạy typecheck + lint + format + test, cập nhật TASKS.md, viết `docs/handoff/sprint-03.md`.
