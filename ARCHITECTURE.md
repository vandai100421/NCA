# ARCHITECTURE — NCA

> Source of truth về hiện trạng dự án. Cập nhật mỗi sprint khi có thay đổi cấu trúc/data model.

## Tech stack

| Lớp           | Công nghệ                                   | Phiên bản   |
| ------------- | ------------------------------------------- | ----------- |
| Framework     | Next.js (App Router, RSC)                   | 16.x        |
| Language      | TypeScript (strict)                         | 5.x         |
| Database      | SQLite + Prisma ORM                         | Prisma 7.x  |
| Styling       | Tailwind CSS + shadcn/ui (style: base-nova) | Tailwind v4 |
| Forms         | react-hook-form + @hookform/resolvers       | 7.x / 5.x   |
| Validation    | Zod (schema-first, discriminated union)     | 4.x         |
| Data fetching | TanStack Query                              | 5.x         |
| Toast         | sonner                                      | 2.x         |
| Testing       | Vitest                                      | 4.x         |
| Lint/Format   | ESLint 9 (flat config) + Prettier 3         |             |
| Git hooks     | husky 9 + lint-staged 17                    |             |

## Cấu trúc thư mục

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # root layout (lang=vi, Toaster)
│   ├── page.tsx                  # landing / dashboard
│   ├── globals.css               # Tailwind v4 + design tokens
│   ├── (dashboard)/              # khu vực admin
│   └── api/                      # route handlers (REST)
├── modules/                      # modular monolith theo domain
│   ├── nhu-cau-anh/
│   │   ├── api/                  # service layer (use-case)
│   │   ├── components/           # UI component của module
│   │   ├── hooks/
│   │   ├── lib/                  # business rules (state-machine)
│   │   ├── schema/               # Zod schemas (conditional)
│   │   ├── types.ts
│   │   └── index.ts              # barrel export
│   ├── nguon/                    # cấu trúc tương tự
│   ├── muc-tieu/                 # cấu trúc tương tự
│   ├── thong-ke/                 # module thống kê (S3)
│   │   ├── api/                  # aggregate queries
│   │   ├── components/
│   │   └── index.ts
│   └── shared/
│       ├── enums.ts              # enum tập trung
│       ├── constants.ts
│       └── index.ts
├── components/
│   ├── layout/                   # sidebar
│   └── ui/                       # shadcn primitives + state components (empty/loading/error)
├── lib/                          # cross-cutting concerns
│   ├── db.ts                     # Prisma client singleton
│   ├── errors.ts                 # typed errors + API envelope
│   ├── route-handler.ts          # handleRouteError + parseId helpers
│   ├── api.ts                    # client-side fetch wrapper
│   ├── query-provider.tsx        # TanStack Query provider
│   └── utils.ts                  # cn() helper
└── infrastructure/
    └── prisma/
        └── generated/            # Prisma client output (gitignored)
```

## Data model

Đầy đủ ở `PROJECT.md` + `prisma/schema.prisma`. Đã migrate (migration `20260704072534_init`).

- `MucTieu` (id, ten unique, createdAt, updatedAt) → `@@map("muc_tieu")`
- `Nguon` (id, nguon, tenNguon unique, thoiGianSuDung string, tinhTrang enum, danhGia string?, createdAt, updatedAt) → `@@map("nguon")`
- `NhuCauAnh` (id, mucTieuId FK, nguonId FK, loaiNhuCau enum, diaBan, loaiAnhChup enum, toaDoX/Y float, thoiGianDat auto, thoiGianChup?, thoiGianMongMuonTu/Den?, thoiGianTra?, doPhanGiai, trangThai enum, moTa?, createdAt, updatedAt; index trên trangThai/nguonId/mucTieuId/loaiNhuCau) → `@@map("nhu_cau_anh")`
- `NhuCauAnhLichSu` (id, nhuCauId FK cascade delete, trangThaiCu enum?, trangThaiMoi enum, thoiGian, ghiChu?, index nhuCauId) → `@@map("nhu_cau_anh_lich_su")`

Enum: `LoaiNhuCau` (CO_DINH, DOT_XUAT), `LoaiAnhChup` (7 giá trị), `TrangThaiNhuCau` (8 giá trị), `TinhTrangNguon` (3 giá trị). SQLite lưu enum dạng TEXT, validate ở Prisma client.

## Routes (hiện tại sau S1)

| Method | Path                 | Chức năng                                    |
| ------ | -------------------- | -------------------------------------------- |
| GET    | `/api/muc-tieu`      | list tất cả mục tiêu                         |
| POST   | `/api/muc-tieu`      | tạo mục tiêu                                 |
| GET    | `/api/muc-tieu/[id]` | xem 1 mục tiêu                               |
| PUT    | `/api/muc-tieu/[id]` | sửa mục tiêu                                 |
| DELETE | `/api/muc-tieu/[id]` | xóa mục tiêu (block nếu có nhu cầu liên kết) |
| GET    | `/api/nguon`         | list tất cả nguồn                            |
| POST   | `/api/nguon`         | tạo nguồn                                    |
| GET    | `/api/nguon/[id]`    | xem 1 nguồn                                  |
| PUT    | `/api/nguon/[id]`    | sửa nguồn                                    |
| DELETE | `/api/nguon/[id]`    | xóa nguồn (block nếu có nhu cầu liên kết)    |

UI pages: `/tong-quan`, `/muc-tieu`, `/nguon`, `/nhu-cau-anh` (list+filter+pagination), `/nhu-cau-anh/[id]` (detail+timeline+transition). Route `/` redirect → `/tong-quan`.

Routes bổ sung (S2):

| Method | Path                               | Chức năng                                                                                  |
| ------ | ---------------------------------- | ------------------------------------------------------------------------------------------ |
| GET    | `/api/nhu-cau-anh`                 | list (filter: trangThai, nguonId, mucTieuId, loaiNhuCau, loaiAnhChup, search + pagination) |
| POST   | `/api/nhu-cau-anh`                 | tạo (discriminated union CO_DINH/DOT_XUAT) + audit log đầu tiên                            |
| GET    | `/api/nhu-cau-anh/[id]`            | chi tiết (include mucTieu, nguon, lichSu)                                                  |
| PUT    | `/api/nhu-cau-anh/[id]`            | sửa (không cho đổi loaiNhuCau)                                                             |
| DELETE | `/api/nhu-cau-anh/[id]`            | xóa (chỉ khi CHO_DUYET/TU_CHOI/DA_HUY)                                                     |
| POST   | `/api/nhu-cau-anh/[id]/transition` | chuyển trạng thái (guard state machine + audit log)                                        |

## State machine (nhu cầu ảnh)

```
CHO_DUYET → DA_DUYET | TU_CHOI
DA_DUYET → DA_PHAN_CONG | DA_HUY
DA_PHAN_CONG → DANG_CHUP | DA_HUY
DANG_CHUP → DA_CHUP | DA_HUY
DA_CHUP → DA_TRA_ANH
TU_CHOI, DA_HUY, DA_TRA_ANH → terminal
```

Guard ở `src/modules/nhu-cau-anh/lib/state-machine.ts`. Mỗi transition tạo bản ghi `NhuCauAnhLichSu` trong transaction.

## Nguyên tắc kiến trúc

1. **Modular monolith** — mỗi module (`modules/<domain>/`) tự chứa api/components/lib/schema. Thêm domain mới không đụng module cũ.
2. **Service layer** — business logic nằm ở `modules/<domain>/api/` (server-only), tách khỏi route handler & UI. Dễ unit test.
3. **Schema-first (Zod)** — mỗi entity có 1 schema ở `modules/<domain>/schema/`. Type derive: `type X = z.infer<typeof xSchema>`. Không khai báo type trùng lặp.
4. **Discriminated union cho NhuCauAnh** — `loaiNhuCau` là discriminator, mỗi nhánh có field required khác nhau (CO_DINH → thoiGianChup; DOT_XUAT → thoiGianMongMuonTu/Den).
5. **Error envelope thống nhất** — mọi API response dạng `{ success, data? | error? }`. Typed errors (`ValidationError`, `NotFoundError`, `StateTransitionError`, `ConflictError`) ở `lib/errors.ts`.
6. **No auth** — web nội bộ 1 admin, không có authentication/authorization.

## Validation đa lớp

1. TypeScript strict (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitReturns`, `noUnusedLocals/Parameters`)
2. Zod runtime validation (discriminated union + refine cho business rules)
3. Service layer guard (state transition, business invariants)
4. Route handler validate body bằng Zod trước khi gọi service
5. react-hook-form + zodResolver ở UI
6. DB constraints (`@unique`, enum)
7. husky pre-commit: `prettier --write` + `eslint --max-warnings 0` trên staged files

## Resume pattern (giảm token reload)

Khi bắt đầu sprint mới, chỉ cần load 3 file:

1. `TASKS.md` — biết đang ở đâu
2. `ARCHITECTURE.md` — biết cấu trúc hiện tại
3. `docs/handoff/sprint-XX.md` mới nhất — biết context ngay trước

Template prompt ở `prompts/resume.md`.

## Lệnh hay dùng

```bash
npm run dev          # dev server
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm run format       # prettier --write .
npm test             # vitest run
npx prisma generate  # regenerate client sau khi sửa schema
npx prisma migrate dev --name <name>  # tạo migration
npx prisma studio    # UI quản lý DB
```
