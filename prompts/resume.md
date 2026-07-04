# Prompt — Resume (tiếp tục sprint)

Dùng prompt này khi bắt đầu session mới để tiếp tục công việc mà không phải reload toàn bộ repo.

## Yêu cầu

Đọc 3 file theo thứ tự:

1. `TASKS.md` — xem task nào đã xong, đang làm, chưa làm
2. `ARCHITECTURE.md` — xem cấu trúc + data model hiện tại
3. File handoff mới nhất trong `docs/handoff/` (số lớn nhất) — xem context ngay trước

Sau khi đọc xong, tóm tắt ngắn:

- Sprint hiện tại đang ở đâu
- Task tiếp theo cần làm
- Có blocker/TODO nào không

Rồi mới bắt đầu thực thi task tiếp theo theo đúng `CODING_STANDARDS.md` + `DEVELOPMENT_RULES.md`.

## Lệnh kiểm tra trạng thái

```bash
npm run typecheck   # phải 0 error
npm run lint        # phải 0 warning
npm run format:check
git status
git log --oneline -5
```
