import { parseFilterDate } from '@/lib/date';
import { prisma } from '@/lib/db';
import { ConflictError, NotFoundError, StateTransitionError, ValidationError } from '@/lib/errors';
import type { NhuCauAnh, TrangThaiNhuCau } from '@/infrastructure/prisma/generated/client';
import { canTransition, isDeletable } from '../lib/state-machine';
import type {
  CreateNhuCauInput,
  NhuCauListQuery,
  TransitionInput,
  UpdateNhuCauInput,
} from '../schema/nhu-cau-anh-schema';

export type { NhuCauListQuery };

export type NhuCauAnhDetail = NhuCauAnh & {
  mucTieu: { id: number; ten: string };
  nguon: { id: number; tenNguon: string; nguon: string };
  lichSu: Array<{
    id: number;
    trangThaiCu: TrangThaiNhuCau | null;
    trangThaiMoi: TrangThaiNhuCau;
    thoiGian: Date;
    ghiChu: string | null;
  }>;
};

export interface NhuCauListResult {
  items: NhuCauAnhDetail[];
  total: number;
  page: number;
  pageSize: number;
}

function buildNhuCauWhere(query: NhuCauListQuery) {
  const { trangThai, nguonId, mucTieuId, loaiNhuCau, loaiAnhChup, tuNgay, denNgay, search } = query;
  const tu = parseFilterDate(tuNgay);
  const den = parseFilterDate(denNgay, true);
  const thoiGianDatFilter: { gte?: Date; lte?: Date } = {};
  if (tu) thoiGianDatFilter.gte = tu;
  if (den) thoiGianDatFilter.lte = den;

  return {
    ...(trangThai && trangThai.length > 0 ? { trangThai: { in: trangThai } } : {}),
    ...(nguonId && nguonId.length > 0 ? { nguonId: { in: nguonId } } : {}),
    ...(mucTieuId && mucTieuId.length > 0 ? { mucTieuId: { in: mucTieuId } } : {}),
    ...(loaiNhuCau && loaiNhuCau.length > 0 ? { loaiNhuCau: { in: loaiNhuCau } } : {}),
    ...(loaiAnhChup && loaiAnhChup.length > 0 ? { loaiAnhChup: { in: loaiAnhChup } } : {}),
    ...(Object.keys(thoiGianDatFilter).length > 0 && { thoiGianDat: thoiGianDatFilter }),
    ...(search && {
      OR: [
        { diaBan: { contains: search } },
        { moTa: { contains: search } },
        { doPhanGiai: { contains: search } },
        { mucTieu: { ten: { contains: search } } },
        { nguon: { tenNguon: { contains: search } } },
      ],
    }),
  };
}

export async function listNhuCau(query: NhuCauListQuery): Promise<NhuCauListResult> {
  const { page, pageSize } = query;
  const where = buildNhuCauWhere(query);

  const [items, total] = await Promise.all([
    prisma.nhuCauAnh.findMany({
      where,
      include: {
        mucTieu: { select: { id: true, ten: true } },
        nguon: { select: { id: true, tenNguon: true, nguon: true } },
        lichSu: {
          orderBy: { thoiGian: 'desc' },
          select: {
            id: true,
            trangThaiCu: true,
            trangThaiMoi: true,
            thoiGian: true,
            ghiChu: true,
          },
        },
      },
      orderBy: [{ thoiGianDat: 'asc' }, { id: 'asc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.nhuCauAnh.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function getNhuCauById(id: number): Promise<NhuCauAnhDetail> {
  const nhuCau = await prisma.nhuCauAnh.findUnique({
    where: { id },
    include: {
      mucTieu: { select: { id: true, ten: true } },
      nguon: { select: { id: true, tenNguon: true, nguon: true } },
      lichSu: {
        orderBy: { thoiGian: 'desc' },
        select: {
          id: true,
          trangThaiCu: true,
          trangThaiMoi: true,
          thoiGian: true,
          ghiChu: true,
        },
      },
    },
  });
  if (!nhuCau) {
    throw new NotFoundError('Nhu cầu ảnh');
  }
  return nhuCau;
}

export async function createNhuCau(input: CreateNhuCauInput): Promise<NhuCauAnhDetail> {
  const mucTieu = await prisma.mucTieu.findUnique({ where: { id: input.mucTieuId } });
  if (!mucTieu) {
    throw new ValidationError('Mục tiêu không tồn tại', 'mucTieuId');
  }
  const nguon = await prisma.nguon.findUnique({ where: { id: input.nguonId } });
  if (!nguon) {
    throw new ValidationError('Nguồn không tồn tại', 'nguonId');
  }

  const { moTa, ...rest } = input;
  const data: Record<string, unknown> = { ...rest };
  if (moTa && moTa.length > 0) {
    data.moTa = moTa;
  } else {
    data.moTa = null;
  }

  return prisma.$transaction(async (tx) => {
    const created = await tx.nhuCauAnh.create({
      data: data as Parameters<typeof tx.nhuCauAnh.create>[0]['data'],
      include: {
        mucTieu: { select: { id: true, ten: true } },
        nguon: { select: { id: true, tenNguon: true, nguon: true } },
        lichSu: {
          orderBy: { thoiGian: 'desc' },
          select: {
            id: true,
            trangThaiCu: true,
            trangThaiMoi: true,
            thoiGian: true,
            ghiChu: true,
          },
        },
      },
    });

    await tx.nhuCauAnhLichSu.create({
      data: {
        nhuCauId: created.id,
        trangThaiCu: null,
        trangThaiMoi: 'DA_DAT',
        ghiChu: 'Tạo nhu cầu mới',
      },
    });

    return created;
  });
}

export async function updateNhuCau(id: number, input: UpdateNhuCauInput): Promise<NhuCauAnhDetail> {
  const existing = await prisma.nhuCauAnh.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError('Nhu cầu ảnh');
  }
  if (existing.loaiNhuCau !== input.loaiNhuCau) {
    throw new ValidationError('Không thể đổi loại nhu cầu sau khi tạo', 'loaiNhuCau');
  }

  const { moTa, ...rest } = input;
  const data: Record<string, unknown> = { ...rest };
  if (moTa && moTa.length > 0) {
    data.moTa = moTa;
  } else {
    data.moTa = null;
  }

  return prisma.nhuCauAnh.update({
    where: { id },
    data: data as Parameters<typeof prisma.nhuCauAnh.update>[0]['data'],
    include: {
      mucTieu: { select: { id: true, ten: true } },
      nguon: { select: { id: true, tenNguon: true, nguon: true } },
      lichSu: {
        orderBy: { thoiGian: 'desc' },
        select: {
          id: true,
          trangThaiCu: true,
          trangThaiMoi: true,
          thoiGian: true,
          ghiChu: true,
        },
      },
    },
  });
}

export async function transitionState(
  id: number,
  input: TransitionInput,
): Promise<NhuCauAnhDetail> {
  const existing = await prisma.nhuCauAnh.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError('Nhu cầu ảnh');
  }

  if (existing.trangThai === input.trangThaiMoi) {
    throw new ValidationError('Trạng thái mới giống trạng thái hiện tại', 'trangThaiMoi');
  }

  if (!canTransition(existing.trangThai, input.trangThaiMoi)) {
    throw new StateTransitionError(existing.trangThai, input.trangThaiMoi);
  }

  const updateData: Record<string, unknown> = { trangThai: input.trangThaiMoi };
  if (input.trangThaiMoi === 'DA_NHAN') {
    updateData.thoiGianTra = input.thoiGianTra ? new Date(input.thoiGianTra) : new Date();
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.nhuCauAnh.update({
      where: { id },
      data: updateData as Parameters<typeof tx.nhuCauAnh.update>[0]['data'],
      include: {
        mucTieu: { select: { id: true, ten: true } },
        nguon: { select: { id: true, tenNguon: true, nguon: true } },
        lichSu: {
          orderBy: { thoiGian: 'desc' },
          select: {
            id: true,
            trangThaiCu: true,
            trangThaiMoi: true,
            thoiGian: true,
            ghiChu: true,
          },
        },
      },
    });

    await tx.nhuCauAnhLichSu.create({
      data: {
        nhuCauId: id,
        trangThaiCu: existing.trangThai,
        trangThaiMoi: input.trangThaiMoi,
        ghiChu: input.ghiChu && input.ghiChu.length > 0 ? input.ghiChu : null,
      },
    });

    return updated;
  });
}

export async function deleteNhuCau(id: number): Promise<void> {
  const existing = await prisma.nhuCauAnh.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError('Nhu cầu ảnh');
  }
  if (!isDeletable(existing.trangThai)) {
    throw new ConflictError(
      `Không thể xóa nhu cầu ở trạng thái "${existing.trangThai}". Chỉ xóa được khi ở trạng thái DA_DAT hoặc DA_HUY.`,
    );
  }
  await prisma.nhuCauAnh.delete({ where: { id } });
}

const CSV_HEADERS = [
  'ID',
  'Mục tiêu',
  'Nguồn',
  'Loại nguồn',
  'Loại nhu cầu',
  'Loại ảnh chụp',
  'Địa bàn',
  'Tọa độ X',
  'Tọa độ Y',
  'Độ phân giải',
  'Trạng thái',
  'Thời gian đặt',
  'Thời gian chụp',
  'Mong muốn từ',
  'Mong muốn đến',
  'Thời gian trả ảnh',
  'Mô tả',
];

function escapeCsv(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatCsvDate(d: Date | string | null | undefined): string {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString();
}

export async function exportNhuCauCsv(query: NhuCauListQuery): Promise<string> {
  const where = buildNhuCauWhere(query);

  const rows = await prisma.nhuCauAnh.findMany({
    where,
    include: {
      mucTieu: { select: { id: true, ten: true } },
      nguon: { select: { id: true, tenNguon: true, nguon: true } },
    },
    orderBy: { id: 'desc' },
  });

  const escapeRow = (n: (typeof rows)[number]) =>
    [
      n.id,
      n.mucTieu.ten,
      n.nguon.tenNguon,
      n.nguon.nguon,
      n.loaiNhuCau,
      n.loaiAnhChup,
      n.diaBan,
      n.toaDoX,
      n.toaDoY,
      n.doPhanGiai,
      n.trangThai,
      formatCsvDate(n.thoiGianDat),
      formatCsvDate(n.thoiGianChup),
      formatCsvDate(n.thoiGianMongMuonTu),
      formatCsvDate(n.thoiGianMongMuonDen),
      formatCsvDate(n.thoiGianTra),
      n.moTa,
    ]
      .map(escapeCsv)
      .join(',');

  return [CSV_HEADERS.join(','), ...rows.map(escapeRow)].join('\r\n');
}
