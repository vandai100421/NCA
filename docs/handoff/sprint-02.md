# Handoff — Sprint 02 (Nhu cầu ảnh core)

> Báo cáo bàn giao. Đọc kèm `TASKS.md` + `ARCHITECTURE.md` khi resume.

## Việc đã làm

Xây dựng module `nhu-cau-anh` — thực thể trung tâm. Zod discriminated union (CO_DINH/DOT_XUAT), state machine guard, audit log (NhuCauAnhLichSu) trong transaction, full CRUD + transition endpoint, UI form conditional + list filter + pagination + detail timeline.

## File đã tạo / sửa

### Schema + state machine

- `src/modules/nhu-cau-anh/schema/nhu-cau-anh-schema.ts` — `createNhuCauSchema` = discriminated union theo `loaiNhuCau` (CO_DINH bắt `thoiGianChup`, DOT_XUAT bắt `thoiGianMongMuonTu/Den`), `.refine()` kiểm `thoiGianMongMuonDen ≥ thoiGianMongMuonTu`. Còn `transitionSchema`, `nhuCauListQuerySchema`.
- `src/modules/nhu-cau-anh/lib/state-machine.ts` — `TRANSITIONS` map + `canTransition`, `getNextStates`, `isTerminal`, `isDeletable`.

### Service + route handlers

- `src/modules/nhu-cau-anh/api/nhu-cau-anh-service.ts` — `listNhuCau(query)` (filter + pagination + OR search), `getNhuCauById(id)` (include mucTieu/nguon/lichSu), `createNhuCau(input)` (validate FK + transaction tạo NhuCauAnh + NhuCauAnhLichSu đầu tiên), `updateNhuCau` (block đổi loaiNhuCau), `transitionState` (guard + audit log + tự set `thoiGianTra` khi `DA_TRA_ANH`), `deleteNhuCau` (chỉ khi `isDeletable`).
- `src/lib/route-handler.ts` — helper `handleRouteError(e)` + `parseId(str)` giảm lặp code.
- `src/app/api/nhu-cau-anh/route.ts` — GET (list) + POST (create)
- `src/app/api/nhu-cau-anh/[id]/route.ts` — GET + PUT + DELETE
- `src/app/api/nhu-cau-anh/[id]/transition/route.ts` — POST chuyển trạng thái

### Hooks

- `src/modules/nhu-cau-anh/hooks/use-nhu-cau-anh.ts` — `useNhuCauList(query)` (build URLSearchParams), `useNhuCauDetail(id)`, `useCreateNhuCau`, `useUpdateNhuCau`, `useTransitionNhuCau`, `useDeleteNhuCau`. Mutation `invalidateQueries` + `setQueryData` cho detail cache.

### UI

- `src/modules/nhu-cau-anh/components/nhu-cau-form-dialog.tsx` — form dialog conditional: dùng `useWatch` cho `loaiNhuCau`, hiện field `thoiGianChup` (CO_DINH) hoặc `thoiGianMongMuonTu/Den` (DOT_XUAT). Select cho mucTieu/nguon/loaiAnhChup. Disable đổi `loaiNhuCau` khi edit. Convert datetime-local → ISO khi submit.
- `src/modules/nhu-cau-anh/components/nhu-cau-list.tsx` — list table + filter bar (6 filter: trangThai, nguonId, mucTieuId, loaiNhuCau, search, reset) + pagination (page/pageSize/total/totalPages). Badge màu cho trạng thái.
- `src/modules/nhu-cau-anh/components/nhu-cau-detail.tsx` — detail card (thông tin đầy đủ) + card chuyển trạng thái (chỉ hiện transition hợp lệ từ `getNextStates`) + timeline lịch sử (NhuCauAnhLichSu, dạng vertical timeline với badge trạng thái).
- `src/app/(dashboard)/nhu-cau-anh/page.tsx` — render NhuCauList
- `src/app/(dashboard)/nhu-cau-anh/[id]/page.tsx` — server component await params, render NhuCauDetail

### Other

- `prisma/seed.ts` — sửa thứ tự delete (xóa NhuCauAnhLichSu + NhuCauAnh trước khi xóa MucTieu/Nguon) để tránh FK constraint khi re-seed.

## Quyết định kỹ thuật đã chốt

1. **Discriminated union Zod** — `z.discriminatedUnion('loaiNhuCau', [coDinhSchema, dotXuatSchema])` là điểm mấu chốt. Mỗi nhánh có field required khác nhau, TS narrowing đúng ở runtime. `.refine()` bổ sung rule `thoiGianMongMuonDen ≥ thoiGianMongMuonTu`.
2. **`z.coerce.date()`** — để form HTML `<input type="datetime-local">` (string) tự convert sang Date. Combined với `.refine()` so sánh.
3. **State machine tách riêng** ở `lib/state-machine.ts` (không lẫn vào service) — dễ unit test ở S3. Map `TRANSITIONS: Record<TrangThai, TrangThai[]>` + 4 hàm guard.
4. **Transaction cho audit log** — `prisma.$transaction(async (tx) => { update NhuCauAnh + create NhuCauAnhLichSu })`. Đảm bảo không có nhu cầu được update mà thiếu log.
5. **`thoiGianTra` auto-set** khi transition về `DA_TRA_ANH` — service tự động set `new Date()`.
6. **Delete guard** — chỉ xóa được khi `isDeletable(trangThai)` = CHO_DUYET/TU_CHOI/DA_HUY. Tránh xóa nhu cầu đang xử lý.
7. **Form payload narrowing** — phải tách 2 nhánh `if/else` rõ ràng với `as const` cho `loaiNhuCau`, không dùng spread `...(cond ? {...} : {...})` vì TS không narrow được.
8. **`handleRouteError` helper** — gom logic ZodError → 400, AppError → status theo code, unknown → 500. Giảm lặp ở mọi route handler.
9. **TanStack Query `placeholderData: (prev) => prev`** — giữ data cũ khi fetch mới (tránh flicker khi chuyển page/filter).
10. **Page `[id]` là Server Component** await params rồi render Client Component `NhuCauDetail` (dùng `useParams` hook).

## Vấn đề còn tồn / TODO

- Trang tổng quan vẫn placeholder, chưa đếm số liệu → S3.
- Chưa có test Vitest cho state machine + schema → S3.
- Chưa có export CSV → S3.
- Chưa có empty/loading state nhất quán toàn app → S3.
- Tiếng Việt trong terminal Windows (curl) hiển thị `?` — chỉ là rendering terminal, trong trình duyệt + DB đúng UTF-8.

## Test đã chạy (S2)

- Create CO_DINH → 201, trạng thái CHO_DUYET, có audit log đầu tiên ✓
- Create CO_DINH thiếu `thoiGianChup` → 400 "Thời gian chụp là bắt buộc khi cố định" ✓
- Create DOT_XUAT `thoiGianMongMuonTu > Den` → 400 "Thời gian đến phải sau thời gian từ" ✓
- Transition CHO_DUYET → DA_DUYET → 200, có audit log mới ✓
- Transition DA_DUYET → DANG_CHUP (bỏ qua DA_PHAN_CONG) → 409 STATE_TRANSITION ✓
- GET detail include `lichSu` (timeline) ✓
- List filter `trangThai=CHO_DUYET` + pagination ✓
- UI pages: `/nhu-cau-anh`, `/nhu-cau-anh/[id]` đều HTTP 200 ✓

## Điều kiện tiên quyết cho S3

- Đã đọc `prompts/sprint-03.md`.
- DB đã có schema đầy đủ (4 model + 4 enum), đã seed master data.
- `npm run typecheck` + `npm run lint` + `npm run build` phải sạch.

## Lệnh kiểm tra

```bash
npm run typecheck   # 0 error
npm run lint        # 0 warning
npm run build       # 14 routes compiled
npm run dev         # mở http://localhost:3000/nhu-cau-anh
npx prisma studio   # xem DB
```
