/**
 * Parse chuỗi ngày từ query param thành Date.
 * - Với `denNgay` (endOfDay=true): nếu chuỗi dạng `YYYY-MM-DD` (10 ký tự),
 *   ép về cuối ngày `T23:59:59` (giờ địa phương) để bao trọn cả ngày.
 * - Các trường hợp khác parse theo mặc định.
 */
export function parseFilterDate(s: string | undefined, endOfDay = false): Date | undefined {
  if (!s) return undefined;
  const d = s.length === 10 && endOfDay ? new Date(`${s}T23:59:59`) : new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d;
}
