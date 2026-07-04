# Handoff reports

Mỗi sprint kết thúc sẽ có một file `sprint-XX.md` ở đây, tóm tắt việc đã làm, file đã đụng, quyết định kỹ thuật, TODO và điều kiện tiên quyết cho sprint sau.

**Mục đích**: giảm token reload — khi bắt đầu sprint mới, chỉ cần load `TASKS.md` + `ARCHITECTURE.md` + file handoff mới nhất là đủ context.

## Thứ tự đọc khi resume

1. `TASKS.md` (biết mình đang ở đâu)
2. `ARCHITECTURE.md` (biết cấu trúc hiện tại)
3. `docs/handoff/sprint-XX.md` mới nhất (biết context ngay trước)
