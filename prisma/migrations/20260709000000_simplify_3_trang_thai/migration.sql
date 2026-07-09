-- Đổi enum TrangThaiNhuCau từ 8 giá trị cũ sang 3 giá trị mới (DA_DAT, FAIL, DA_NHAN)
-- Map: CHO_DUYET/DA_DUYET/DA_PHAN_CONG/DANG_CHUP → DA_DAT (đang xử lý)
--      DA_CHUP/DA_TRA_ANH → DA_NHAN (hoàn thành)
--      TU_CHOI/DA_HUY → FAIL (thất bại/hủy)
UPDATE "nhu_cau_anh" SET "trangThai" = 'DA_DAT' WHERE "trangThai" IN ('CHO_DUYET', 'DA_DUYET', 'DA_PHAN_CONG', 'DANG_CHUP');
UPDATE "nhu_cau_anh" SET "trangThai" = 'DA_NHAN' WHERE "trangThai" IN ('DA_CHUP', 'DA_TRA_ANH');
UPDATE "nhu_cau_anh" SET "trangThai" = 'FAIL' WHERE "trangThai" IN ('TU_CHOI', 'DA_HUY');

UPDATE "nhu_cau_anh_lich_su" SET "trangThaiMoi" = 'DA_DAT' WHERE "trangThaiMoi" IN ('CHO_DUYET', 'DA_DUYET', 'DA_PHAN_CONG', 'DANG_CHUP');
UPDATE "nhu_cau_anh_lich_su" SET "trangThaiMoi" = 'DA_NHAN' WHERE "trangThaiMoi" IN ('DA_CHUP', 'DA_TRA_ANH');
UPDATE "nhu_cau_anh_lich_su" SET "trangThaiMoi" = 'FAIL' WHERE "trangThaiMoi" IN ('TU_CHOI', 'DA_HUY');

UPDATE "nhu_cau_anh_lich_su" SET "trangThaiCu" = 'DA_DAT' WHERE "trangThaiCu" IN ('CHO_DUYET', 'DA_DUYET', 'DA_PHAN_CONG', 'DANG_CHUP');
UPDATE "nhu_cau_anh_lich_su" SET "trangThaiCu" = 'DA_NHAN' WHERE "trangThaiCu" IN ('DA_CHUP', 'DA_TRA_ANH');
UPDATE "nhu_cau_anh_lich_su" SET "trangThaiCu" = 'FAIL' WHERE "trangThaiCu" IN ('TU_CHOI', 'DA_HUY');
