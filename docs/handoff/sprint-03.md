# Handoff — Sprint 03 (Dashboard & polish)

> Báo cáo bàn giao. Đọc kèm `TASKS.md` + `ARCHITECTURE.md` khi resume.

## Việc đã làm

Hoàn thiện MVP: trang tổng quan có số liệu thực (đếm theo trạng thái / nguồn / loại nhu cầu), search toàn văn cho cả 3 module, export CSV danh sách nhu cầu (áp dụng filter hiện tại), empty/loading/error states nhất quán toàn app, test Vitest cho service layer (state machine + 3 schema), prebuild typecheck.

## File đã tạo / sửa

### Test (Vitest)

- `vitest.config.ts` — cấu hình Vitest (environment node, alias `@`, include `src/**/*.test.ts`).
- `src/modules/nhu-cau-anh/lib/state-machine.test.ts` — 12 test: `canTransition` (hợp lệ/lệch/quay lui/cùng trạng thái/terminal), `getNextStates` (đúng danh sách + trả mảng mới), `isTerminal`, `isDeletable`.
- `src/modules/nhu-cau-anh/schema/nhu-cau-anh-schema.test.ts` — 23 test: discriminated union CO_DINH/DOT_XUAT (thiếu field fail, refine `den ≥ tu`, equal OK), common field validation (coerce number, trim, enum, moTa optional), `transitionSchema`, `nhuCauListQuerySchema` (default, coerce, max pageSize, search trim).
- `src/modules/muc-tieu/schema/muc-tieu-schema.test.ts` — 7 test: ten bắt buộc, trim, rỗng, quá 255 ký tự.
- `src/modules/nguon/schema/nguon-schema.test.ts` — 11 test: các trường bắt buộc, enum nguon/tinhTrang, danhGia optional + max 2000.

Tổng: **4 file, 53 test, all pass.**

### Trang tổng quan (module `thong-ke`)

- `src/modules/thong-ke/api/thong-ke-service.ts` — `getTongQuan()` dùng `prisma.groupBy` đếm theo `trangThai`, `nguonId` (top 5, join bảng Nguon), `loaiNhuCau`; `count()` cho 3 total.
- `src/modules/thong-ke/components/tong-quan-dashboard.tsx` — UI: 3 stat card (tổng nhu cầu/nguồn/mục tiêu), card "theo trạng thái" (grid 8 badge + số), card "phân loại nhu cầu" (progress bar CO_DINH/DOT_XUAT), card "theo nguồn top 5" (bar chart ngang). Empty/loading/error states.
- `src/modules/thong-ke/index.ts` — barrel export.
- `src/app/(dashboard)/tong-quan/page.tsx` — render `TongQuanDashboard`.
- `src/app/api/thong-ke/tong-quan/route.ts` — GET handler.

### Export CSV

- `src/modules/nhu-cau-anh/api/nhu-cau-anh-service.ts` — thêm `exportNhuCauCsv(query)`: query cùng filter như `listNhuCau` (không pagination), map sang CSV với 17 cột, escape `"`,`,` ,newlines (RFC 4180), format date ISO.
- `src/app/api/nhu-cau-anh/export/route.ts` — GET trả `text/csv; charset=utf-8` + `Content-Disposition: attachment` + BOM UTF-8 (`\uFEFF`) để Excel đọc đúng tiếng Việt.
- `src/modules/nhu-cau-anh/components/nhu-cau-list.tsx` — thêm nút "Export CSV" (icon Download), áp dụng filter hiện tại (trangThai/nguonId/mucTieuId/loaiNhuCau/search).

### Search toàn văn

- `src/modules/muc-tieu/api/muc-tieu-service.ts` — `listMucTieu(search?)`: filter `ten contains`.
- `src/modules/nguon/api/nguon-service.ts` — `listNguon(search?)`: filter OR trên `tenNguon`/`nguon`/`danhGia`.
- `src/app/api/muc-tieu/route.ts` + `src/app/api/nguon/route.ts` — refactor dùng `handleRouteError` (thay cho try/catch ZodError thủ công), nhận param `search`.
- `src/modules/muc-tieu/components/muc-tieu-list.tsx` + `src/modules/nguon/components/nguon-list.tsx` — thêm search box (Input + button Search + nút "Xoá" khi có search). Query key includes search.

### State components (reusable)

- `src/components/ui/empty-state.tsx` — `EmptyState` (icon Inbox, title, description, action).
- `src/components/ui/loading-state.tsx` — `LoadingState` (spinner Loader2).
- `src/components/ui/error-state.tsx` — `ErrorState` (icon AlertCircle, message, nút "Thử lại" gọi `onRetry`).

Áp dụng vào: `muc-tieu-list`, `nguon-list`, `nhu-cau-list`, `nhu-cau-detail`, `tong-quan-dashboard`.

### Prebuild typecheck

- `package.json` — thêm `"prebuild": "npm run typecheck"`. `npm run build` giờ chạy typecheck trước, fail nếu type sai.

## Quyết định kỹ thuật đã chốt

1. **`prisma.groupBy`** cho thống kê — 1 query đếm theo nhóm, thay vì N query count. Join bảng Nguon bằng `findMany({ where: { id: { in } } })` + Map để ráp tên nguồn (vì groupBy không include relation).
2. **CSV escape RFC 4180** — field chứa `"`, `,`, `\n` → bọc trong `"..."` và nhân đôi `"`. Thêm BOM UTF-8 (`\uFEFF`) đầu file để Excel không lỗi tiếng Việt.
3. **Export dùng `window.location.href`** thay vì fetch — trình duyệt tự handle download với `Content-Disposition: attachment`. Không cần tạo blob thủ công.
4. **Query key includes search** — `['muc-tieu', search]` / `['nguon', search]`. TanStack Query invalidate theo prefix nên mutation vẫn clear đúng cache khi add/edit/delete.
5. **State components đặt ở `components/ui/`** — là primitives tái sử dụng toàn app, cùng cấp với Button/Card/Table.
6. **Refactor route handler muc-tieu/nguon** dùng `handleRouteError` — giảm lặp code, nhất quán với nhu-cau-anh route (đã dùng helper từ S2).
7. **Vitest config tách riêng** — không lẫn vào next.config. Alias `@` trỏ `./src` để test import giống app.
8. **Test schema dùng `safeParse`** cho case fail (không throw), `parse` cho case thành công (kiểm tra kiểu output).

## Test đã chạy (S3)

### Unit test (Vitest)

- state-machine: 12 test pass (canTransition hợp lệ/lệch/quay lui, getNextStates, isTerminal, isDeletable)
- nhu-cau-anh-schema: 23 test pass (discriminated union, refine, coerce, transition, list query)
- muc-tieu-schema: 7 test pass
- nguon-schema: 11 test pass
- **Tổng: 53/53 pass**

### Smoke test (dev server)

- `GET /api/thong-ke/tong-quan` → 200, aggregate đúng (totalNhuCau, theoTrangThai, theoNguon, theoLoaiNhuCau)
- `GET /api/muc-tieu?search=a` → 200, filter đúng
- `GET /api/nguon?search=a` → 200, filter đúng
- `GET /api/nhu-cau-anh/export` → 200, Content-Type text/csv, Content-Disposition attachment, BOM UTF-8
- `GET /tong-quan`, `/muc-tieu`, `/nguon`, `/nhu-cau-anh`, `/nhu-cau-anh/1` → 200
- Transition CHO_DUYET → DA_DUYET → 200 (hợp lệ)
- Transition DA_DUYET → DANG_CHUP → 409 (bỏ qua DA_PHAN_CONG, guard đúng)
- Delete nhu cầu DA_DUYET → 409 (không cho xóa, đúng rule)

### Build

- `npm run build` → prebuild typecheck pass + 16 routes compiled (thêm `/api/nhu-cau-anh/export`, `/api/thong-ke/tong-quan`)

## Vấn đề còn tồn / TODO

- DB dev hiện có 1 nhu cầu test (id=1, trạng thái DA_DUYET) — có thể reset bằng `npx prisma db seed` khi cần.
- Chưa có test cho service layer có DB (cần test DB isolation, để sprint sau nếu cần).
- Chart dashboard dùng progress bar đơn giản (không dùng thư viện chart) — đủ cho MVP, có thể nâng cấp recharts sau.
- Tiếng Việt trong terminal Windows (Invoke-WebRequest) hiển thị `?` — chỉ là rendering terminal, trong trình duyệt + DB + CSV đúng UTF-8.

## Điều kiện tiên quyết cho sprint sau

- MVP đã hoàn thành (S0-S3). Có thể bắt đầu các tính năng ngoài phạm vi (bản đồ, thông báo...) hoặc hardening (auth, multi-tenant).
- `npm run typecheck` + `npm run lint` + `npm run format:check` + `npm test` + `npm run build` đều sạch.

## Lệnh kiểm tra

```bash
npm run typecheck     # 0 error
npm run lint          # 0 warning
npm run format:check  # all files formatted
npm test              # 53/53 pass
npm run build         # prebuild typecheck + 16 routes
npm run dev           # mở http://localhost:3000/tong-quan
```
