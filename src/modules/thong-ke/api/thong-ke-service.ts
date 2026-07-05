import { prisma } from '@/lib/db';
import type { LoaiNhuCau, TrangThaiNhuCau } from '@/infrastructure/prisma/generated/client';

export interface TrangThaiCount {
  trangThai: TrangThaiNhuCau;
  count: number;
}

export interface NguonCount {
  nguonId: number;
  tenNguon: string;
  nguon: string;
  count: number;
}

export interface TongQuanStats {
  totalNhuCau: number;
  totalMucTieu: number;
  totalNguon: number;
  theoTrangThai: TrangThaiCount[];
  theoNguon: NguonCount[];
  theoLoaiNhuCau: { loaiNhuCau: 'CO_DINH' | 'DOT_XUAT'; count: number }[];
}

export async function getTongQuan(): Promise<TongQuanStats> {
  const [totalNhuCau, totalMucTieu, totalNguon, theoTrangThai, theoNguonRaw, theoLoaiNhuCau] =
    await Promise.all([
      prisma.nhuCauAnh.count(),
      prisma.mucTieu.count(),
      prisma.nguon.count(),
      prisma.nhuCauAnh.groupBy({
        by: ['trangThai'],
        _count: { _all: true },
      }),
      prisma.nhuCauAnh.groupBy({
        by: ['nguonId'],
        _count: { _all: true },
        orderBy: { _count: { nguonId: 'desc' } },
        take: 5,
      }),
      prisma.nhuCauAnh.groupBy({
        by: ['loaiNhuCau'],
        _count: { _all: true },
      }),
    ]);

  const nguonIds = theoNguonRaw.map((n) => n.nguonId);
  const nguonRecords =
    nguonIds.length > 0
      ? await prisma.nguon.findMany({
          where: { id: { in: nguonIds } },
          select: { id: true, tenNguon: true, nguon: true },
        })
      : [];
  const nguonMap = new Map(nguonRecords.map((n) => [n.id, n]));

  const theoNguon: NguonCount[] = theoNguonRaw.map((n) => {
    const nguon = nguonMap.get(n.nguonId);
    return {
      nguonId: n.nguonId,
      tenNguon: nguon?.tenNguon ?? `Nguồn #${n.nguonId}`,
      nguon: nguon?.nguon ?? '—',
      count: n._count._all,
    };
  });

  return {
    totalNhuCau,
    totalMucTieu,
    totalNguon,
    theoTrangThai: theoTrangThai.map((t) => ({ trangThai: t.trangThai, count: t._count._all })),
    theoNguon,
    theoLoaiNhuCau: theoLoaiNhuCau.map((l) => ({
      loaiNhuCau: l.loaiNhuCau,
      count: l._count._all,
    })),
  };
}

export interface ThongKeNguonThoiGian {
  nguonId: number;
  tenNguon: string;
  nguon: string;
  tong: number;
  dungHan: number;
  chamHan: number;
}

export interface ChamHanItem {
  id: number;
  mucTieuTen: string;
  nguonTen: string;
  loaiNhuCau: LoaiNhuCau;
  thoiGianTra: string;
  hanMongMuon: string;
  soNgayTre: number;
}

export interface ThongKeThoiGian {
  tongDaTraAnh: number;
  dungHan: number;
  chamHan: number;
  tiLeDungHan: number;
  theoNguon: ThongKeNguonThoiGian[];
  danhSachChamHan: ChamHanItem[];
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function tinhSoNgayTre(thoiGianTra: Date, han: Date): number {
  return Math.ceil((thoiGianTra.getTime() - han.getTime()) / MS_PER_DAY);
}

export async function getThongKeThoiGian(tuNgay?: Date, denNgay?: Date): Promise<ThongKeThoiGian> {
  const where = {
    trangThai: 'DA_TRA_ANH' as const,
    thoiGianTra: { not: null },
    ...(tuNgay && { thoiGianTra: { gte: tuNgay } }),
    ...(denNgay && { thoiGianTra: { lte: denNgay } }),
  };

  const rows = await prisma.nhuCauAnh.findMany({
    where,
    include: {
      mucTieu: { select: { ten: true } },
      nguon: { select: { tenNguon: true, nguon: true } },
    },
    orderBy: { thoiGianTra: 'desc' },
  });

  let dungHan = 0;
  let chamHan = 0;
  const theoNguonMap = new Map<number, ThongKeNguonThoiGian>();
  const danhSachChamHan: ChamHanItem[] = [];

  for (const n of rows) {
    const thoiGianTra = n.thoiGianTra;
    if (!thoiGianTra) continue;

    const han =
      n.loaiNhuCau === 'CO_DINH' ? (n.thoiGianChup ?? null) : (n.thoiGianMongMuonDen ?? null);

    const nguonEntry = theoNguonMap.get(n.nguonId) ?? {
      nguonId: n.nguonId,
      tenNguon: n.nguon.tenNguon,
      nguon: n.nguon.nguon,
      tong: 0,
      dungHan: 0,
      chamHan: 0,
    };

    nguonEntry.tong += 1;

    if (han && thoiGianTra.getTime() <= han.getTime()) {
      dungHan += 1;
      nguonEntry.dungHan += 1;
    } else if (han) {
      chamHan += 1;
      nguonEntry.chamHan += 1;
      danhSachChamHan.push({
        id: n.id,
        mucTieuTen: n.mucTieu.ten,
        nguonTen: n.nguon.tenNguon,
        loaiNhuCau: n.loaiNhuCau,
        thoiGianTra: thoiGianTra.toISOString(),
        hanMongMuon: han.toISOString(),
        soNgayTre: tinhSoNgayTre(thoiGianTra, han),
      });
    } else {
      // không có hạn mong muốn → không tính đúng/chậm, vẫn计入 tong
    }

    theoNguonMap.set(n.nguonId, nguonEntry);
  }

  const tongDaTraAnh = rows.length;
  const tiLeDungHan = tongDaTraAnh > 0 ? Math.round((dungHan / tongDaTraAnh) * 100) : 0;

  return {
    tongDaTraAnh,
    dungHan,
    chamHan,
    tiLeDungHan,
    theoNguon: Array.from(theoNguonMap.values()).sort((a, b) => b.chamHan - a.chamHan),
    danhSachChamHan: danhSachChamHan.sort((a, b) => b.soNgayTre - a.soNgayTre),
  };
}
