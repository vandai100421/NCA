-- Đổi giá trị enum cũ DANG_CHO → DANG_CHUP (schema simplify_trang_thai)
UPDATE "nhu_cau_anh" SET "trangThai" = 'DANG_CHUP' WHERE "trangThai" = 'DANG_CHO';
UPDATE "nhu_cau_anh_lich_su" SET "trangThaiMoi" = 'DANG_CHUP' WHERE "trangThaiMoi" = 'DANG_CHO';
UPDATE "nhu_cau_anh_lich_su" SET "trangThaiCu" = 'DANG_CHUP' WHERE "trangThaiCu" = 'DANG_CHO';
