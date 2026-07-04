# CODING STANDARDS — NCA

## TypeScript

- `strict: true` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` + `noImplicitReturns` + `noUnusedLocals/Parameters` + `noFallthroughCasesInSwitch` + `noImplicitOverride`.
- **Cấm `any`** (ESLint `@typescript-eslint/no-explicit-any: error`). Dùng `unknown` + type guard khi chưa biết kiểu.
- Không dùng `@ts-ignore`. Nếu bắt buộc, dùng `@ts-expect-error` kèm lý do.
- Ưu tiên `type` cho union/intersection/utility, `interface` cho object có thể merge/extend.
- Derive type từ Zod schema: `type X = z.infer<typeof xSchema>` — không khai báo type trùng lặp.

## Prettier

Config ở `.prettierrc`:

- 2 space indent
- single quote
- semicolon
- trailing comma `all`
- print width 100
- bracket spacing, arrow parens `always`
- end of line `lf`

## ESLint

Flat config ở `eslint.config.mjs`:

- `next/core-web-vitals` + `next/typescript`
- `eslint-plugin-unused-imports` (auto xóa import không dùng)
- `@typescript-eslint/no-explicit-any: error`

Chạy: `npm run lint`. CI/pre-commit yêu cầu `--max-warnings 0`.

## Đặt tên

| Loại                              | Quy ước                        | Ví dụ                      |
| --------------------------------- | ------------------------------ | -------------------------- |
| File component                    | PascalCase                     | `NhuCauForm.tsx`           |
| File khác (util, schema, service) | kebab-case                     | `nhu-cau-service.ts`       |
| Biến / hàm                        | camelCase                      | `getNhuCauById`            |
| Type / Interface / Component      | PascalCase                     | `NhuCauAnh`, `NguonForm`   |
| Constant                          | UPPER_SNAKE                    | `MAX_PAGE_SIZE`            |
| Enum                              | PascalCase + PascalCase member | `TrangThaiNhuCau.DA_DUYET` |
| Hook                              | camelCase, bắt đầu `use`       | `useNhuCauList`            |
| Route segment                     | kebab-case                     | `/nhu-cau-anh`             |

## Import

- Dùng alias `@/*` (đã cấu hình `paths` trong tsconfig).
- Thứ tự: (1) Node builtin, (2) external package, (3) `@/` internal, (4) relative `./`. ESLint plugin unused-imports tự dọn.
- Không dùng `export *` barrel trừ `index.ts` của module.

## Component conventions

- Function component, không dùng class.
- Server Component mặc định; chỉ thêm `'use client'` khi cần state/effect/event handler.
- Props interface đặt ngay trên component, không export trừ khi cần.
- Tránh inline style; dùng Tailwind utility class.
- Dùng `cn()` (từ `@/lib/utils`) để gộp class có điều kiện.

## API (route handler)

- Mọi route handler:
  1. Parse + validate body bằng Zod schema
  2. Gọi service layer (không viết business logic trong handler)
  3. Trả về `apiSuccess(data)` hoặc `apiError(...)`
- Service layer ném `AppError` (subclass tương ứng), handler catch và map sang HTTP status.
- Response envelope: `{ success: boolean, data?: T, error?: { code, message, field? } }`.

## Prisma

- Schema ở `prisma/schema.prisma`, output client ở `src/infrastructure/prisma/generated`.
- Import PrismaClient từ `@/lib/db` (singleton), không import trực tiếp từ generated.
- Mọi write nghiệp vụ (đặc biệt có liên quan nhiều bảng) dùng `prisma.$transaction`.
- Không expose raw Prisma type ra API response — map sang DTO.

## Git / Commit

- Conventional Commits: `type(scope): message`
  - `type`: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `style`, `perf`
  - `scope`: tên module (`nhu-cau`, `nguon`, `muc-tieu`, `infra`, `docs`...)
  - Ví dụ: `feat(nhu-cau): thêm form tạo với conditional schema`
- Branch: `main` (ổn định), `feat/<ten>`, `fix/<ten>`, `chore/<ten>`.

## Testing

- Vitest, file `*.test.ts` đặt cùng thư mục với code test.
- Ưu tiên test service layer (business rules: validation, state transition).
- Không bắt buộc test UI trong MVP.
