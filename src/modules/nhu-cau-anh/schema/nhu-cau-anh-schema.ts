import { z } from 'zod';

const loaiAnhChupEnum = z.enum(
  ['QUANG_HOC', 'HONG_NGOAI', 'SAR', 'DA_PHO', 'SIEU_PHO', 'NHIET', 'VIDEO'],
  { message: 'Loại ảnh chụp không hợp lệ' },
);

const commonFields = {
  mucTieuId: z.coerce.number().int().positive('Mục tiêu là bắt buộc'),
  nguonId: z.coerce.number().int().positive('Nguồn là bắt buộc'),
  diaBan: z.string().trim().min(1, 'Địa bàn là bắt buộc').max(500, 'Địa bàn quá 500 ký tự'),
  loaiAnhChup: loaiAnhChupEnum,
  toaDoX: z.coerce.number({ message: 'Tọa độ X phải là số' }),
  toaDoY: z.coerce.number({ message: 'Tọa độ Y phải là số' }),
  doPhanGiai: z
    .string()
    .trim()
    .min(1, 'Độ phân giải là bắt buộc')
    .max(50, 'Độ phân giải quá 50 ký tự'),
  moTa: z.string().trim().max(2000, 'Mô tả quá 2000 ký tự').optional().or(z.literal('')),
};

const coDinhSchema = z.object({
  ...commonFields,
  loaiNhuCau: z.literal('CO_DINH'),
  thoiGianChup: z.coerce.date({ message: 'Thời gian chụp là bắt buộc khi cố định' }),
  thoiGianMongMuonTu: z.undefined().optional(),
  thoiGianMongMuonDen: z.undefined().optional(),
});

const dotXuatSchema = z.object({
  ...commonFields,
  loaiNhuCau: z.literal('DOT_XUAT'),
  thoiGianChup: z.undefined().optional(),
  thoiGianMongMuonTu: z.coerce.date({ message: 'Thời gian mong muốn từ là bắt buộc khi đột xuất' }),
  thoiGianMongMuonDen: z.coerce.date({
    message: 'Thời gian mong muốn đến là bắt buộc khi đột xuất',
  }),
});

export const createNhuCauSchema = z
  .discriminatedUnion('loaiNhuCau', [coDinhSchema, dotXuatSchema])
  .refine(
    (data) => {
      if (data.loaiNhuCau === 'DOT_XUAT') {
        return data.thoiGianMongMuonDen >= data.thoiGianMongMuonTu;
      }
      return true;
    },
    { message: 'Thời gian đến phải sau thời gian từ', path: ['thoiGianMongMuonDen'] },
  );

export const updateNhuCauSchema = z
  .discriminatedUnion('loaiNhuCau', [coDinhSchema, dotXuatSchema])
  .refine(
    (data) => {
      if (data.loaiNhuCau === 'DOT_XUAT') {
        return data.thoiGianMongMuonDen >= data.thoiGianMongMuonTu;
      }
      return true;
    },
    { message: 'Thời gian đến phải sau thời gian từ', path: ['thoiGianMongMuonDen'] },
  );

export const transitionSchema = z.object({
  trangThaiMoi: z.enum(['DA_DAT', 'FAIL', 'DA_NHAN'], {
    message: 'Trạng thái mới không hợp lệ',
  }),
  ghiChu: z.string().trim().max(1000, 'Ghi chú quá 1000 ký tự').optional().or(z.literal('')),
});

export type CreateNhuCauInput = z.infer<typeof createNhuCauSchema>;
export type UpdateNhuCauInput = z.infer<typeof updateNhuCauSchema>;
export type TransitionInput = z.infer<typeof transitionSchema>;

export const nhuCauListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
  trangThai: z.enum(['DA_DAT', 'FAIL', 'DA_NHAN']).optional(),
  nguonId: z.coerce.number().int().positive().optional(),
  mucTieuId: z.coerce.number().int().positive().optional(),
  loaiNhuCau: z.enum(['CO_DINH', 'DOT_XUAT']).optional(),
  loaiAnhChup: loaiAnhChupEnum.optional(),
  search: z.string().trim().optional(),
});

export type NhuCauListQuery = z.infer<typeof nhuCauListQuerySchema>;
