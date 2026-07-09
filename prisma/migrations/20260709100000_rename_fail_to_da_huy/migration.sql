-- Đổi tên enum FAIL → DA_HUY
UPDATE "nhu_cau_anh" SET "trangThai" = 'DA_HUY' WHERE "trangThai" = 'FAIL';
UPDATE "nhu_cau_anh_lich_su" SET "trangThaiMoi" = 'DA_HUY' WHERE "trangThaiMoi" = 'FAIL';
UPDATE "nhu_cau_anh_lich_su" SET "trangThaiCu" = 'DA_HUY' WHERE "trangThaiCu" = 'FAIL';
