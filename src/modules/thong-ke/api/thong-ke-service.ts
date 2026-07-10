import { parseFilterDate } from '@/lib/date';
import { prisma } from '@/lib/db';
import type {
  LoaiAnhChup,
  LoaiNhuCau,
  TrangThaiNhuCau,
} from '@/infrastructure/prisma/generated/client';

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

// ===== Thống kê theo thời gian (báo cáo chi tiết) =====

export interface LoaiAnhChupCount {
  loaiAnhChup: LoaiAnhChup;
  count: number;
}

export interface NguonDanhGia {
  nguonId: number;
  tenNguon: string;
  nguon: string;
  tong: number;
  daNhan: number;
  dungHan: number;
  chamHan: number;
  tiLeDungHan: number;
  soNgayTreTrungBinh: number;
  theoLoaiAnh: LoaiAnhChupCount[];
}

export interface ChamHanItem {
  id: number;
  mucTieuTen: string;
  nguonTen: string;
  loaiNhuCau: LoaiNhuCau;
  loaiAnhChup: LoaiAnhChup;
  thoiGianTra: string;
  hanMongMuon: string;
  soNgayTre: number;
}

export interface NhuCauTheoLoai {
  loaiNhuCau: LoaiNhuCau;
  tongDat: number;
  daNhan: number;
  daHuy: number;
  chuaDenHan: number;
  theoLoaiAnh: LoaiAnhChupCount[];
}

export interface ThongKeThoiGian {
  tongNhuCau: number;
  tongDaNhan: number;
  tongDungHan: number;
  tongChamHan: number;
  tiLeDungHan: number;
  theoLoaiNhuCau: NhuCauTheoLoai[];
  theoNguon: NguonDanhGia[];
  danhSachChamHan: ChamHanItem[];
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function tinhSoNgayTre(thoiGianTra: Date, han: Date): number {
  return Math.ceil((thoiGianTra.getTime() - han.getTime()) / MS_PER_DAY);
}

function getHan(n: {
  loaiNhuCau: LoaiNhuCau;
  thoiGianChup: Date | null;
  thoiGianMongMuonDen: Date | null;
}): Date | null {
  return n.loaiNhuCau === 'CO_DINH' ? (n.thoiGianChup ?? null) : (n.thoiGianMongMuonDen ?? null);
}

export async function getThongKeThoiGian(
  tuNgay?: string,
  denNgay?: string,
  nguonIds?: number[],
): Promise<ThongKeThoiGian> {
  // Query theo thoiGianDat (nhu cầu được đặt trong khoảng thời gian)
  const tu = parseFilterDate(tuNgay);
  const den = parseFilterDate(denNgay, true);
  const thoiGianDatFilter: { gte?: Date; lte?: Date } = {};
  if (tu) thoiGianDatFilter.gte = tu;
  if (den) thoiGianDatFilter.lte = den;
  const where = {
    ...(Object.keys(thoiGianDatFilter).length > 0 && { thoiGianDat: thoiGianDatFilter }),
    ...(nguonIds && nguonIds.length > 0 ? { nguonId: { in: nguonIds } } : {}),
  };

  const rows = await prisma.nhuCauAnh.findMany({
    where,
    include: {
      mucTieu: { select: { ten: true } },
      nguon: { select: { tenNguon: true, nguon: true } },
    },
    orderBy: { thoiGianDat: 'desc' },
  });

  // Theo loại nhu cầu
  const theoLoaiMap = new Map<LoaiNhuCau, NhuCauTheoLoai>();
  for (const loai of ['CO_DINH', 'DOT_XUAT'] as const) {
    theoLoaiMap.set(loai, {
      loaiNhuCau: loai,
      tongDat: 0,
      daNhan: 0,
      daHuy: 0,
      chuaDenHan: 0,
      theoLoaiAnh: [],
    });
  }

  // Theo nguồn
  const theoNguonMap = new Map<number, NguonDanhGia>();
  // Theo loại ảnh (aggregate per nguồn)
  const nguonLoaiAnhMap = new Map<number, Map<LoaiAnhChup, number>>();
  // Danh sách chậm hạn
  const danhSachChamHan: ChamHanItem[] = [];

  let tongDaNhan = 0;
  let tongDungHan = 0;
  let tongChamHan = 0;

  for (const n of rows) {
    const loaiEntry = theoLoaiMap.get(n.loaiNhuCau)!;
    loaiEntry.tongDat += 1;

    // Loại ảnh theo loại nhu cầu
    const loaiAnhLoaiMap = new Map<LoaiAnhChup, number>();
    loaiAnhLoaiMap.set(n.loaiAnhChup, (loaiAnhLoaiMap.get(n.loaiAnhChup) ?? 0) + 1);
    loaiEntry.theoLoaiAnh = mergeLoaiAnhCount(loaiEntry.theoLoaiAnh, loaiAnhLoaiMap);

    if (n.trangThai === 'DA_NHAN') {
      loaiEntry.daNhan += 1;
      tongDaNhan += 1;
    } else if (n.trangThai === 'DA_HUY') {
      loaiEntry.daHuy += 1;
    } else {
      // DA_DAT — chưa đến hạn hoặc đang chờ
      loaiEntry.chuaDenHan += 1;
    }

    // Thống kê nguồn (chỉ tính DA_NHAN cho đánh giá đúng/chậm hạn)
    if (n.trangThai === 'DA_NHAN') {
      const nguonEntry = theoNguonMap.get(n.nguonId) ?? {
        nguonId: n.nguonId,
        tenNguon: n.nguon.tenNguon,
        nguon: n.nguon.nguon,
        tong: 0,
        daNhan: 0,
        dungHan: 0,
        chamHan: 0,
        tiLeDungHan: 0,
        soNgayTreTrungBinh: 0,
        theoLoaiAnh: [],
      };
      const fullEntry: NguonDanhGia = nguonEntry;
      fullEntry.tong += 1;
      fullEntry.daNhan += 1;

      // Loại ảnh theo nguồn
      const nguonLaMap = nguonLoaiAnhMap.get(n.nguonId) ?? new Map<LoaiAnhChup, number>();
      nguonLaMap.set(n.loaiAnhChup, (nguonLaMap.get(n.loaiAnhChup) ?? 0) + 1);
      nguonLoaiAnhMap.set(n.nguonId, nguonLaMap);

      const thoiGianTra = n.thoiGianTra;
      const han = getHan(n);
      if (thoiGianTra && han) {
        if (thoiGianTra.getTime() <= han.getTime()) {
          fullEntry.dungHan += 1;
          tongDungHan += 1;
        } else {
          fullEntry.chamHan += 1;
          tongChamHan += 1;
          danhSachChamHan.push({
            id: n.id,
            mucTieuTen: n.mucTieu.ten,
            nguonTen: n.nguon.tenNguon,
            loaiNhuCau: n.loaiNhuCau,
            loaiAnhChup: n.loaiAnhChup,
            thoiGianTra: thoiGianTra.toISOString(),
            hanMongMuon: han.toISOString(),
            soNgayTre: tinhSoNgayTre(thoiGianTra, han),
          });
        }
      }

      theoNguonMap.set(n.nguonId, fullEntry);
    }
  }

  // Tính tỷ lệ + số ngày trễ trung bình cho mỗi nguồn
  const theoNguon: NguonDanhGia[] = [];
  for (const [nguonId, entry] of theoNguonMap) {
    entry.tiLeDungHan = entry.tong > 0 ? Math.round((entry.dungHan / entry.tong) * 100) : 0;
    // Số ngày trễ trung bình (chỉ tính các bản ghi chậm hạn)
    const chamHanItems = danhSachChamHan.filter((c) => c.nguonTen === entry.tenNguon);
    entry.soNgayTreTrungBinh =
      chamHanItems.length > 0
        ? Math.round(chamHanItems.reduce((sum, c) => sum + c.soNgayTre, 0) / chamHanItems.length)
        : 0;
    entry.theoLoaiAnh = Array.from(nguonLoaiAnhMap.get(nguonId)?.entries() ?? []).map(
      ([loaiAnhChup, count]) => ({ loaiAnhChup, count }),
    );
    theoNguon.push(entry);
  }
  theoNguon.sort((a, b) => b.tong - a.tong);

  const tongNhuCau = rows.length;
  const tiLeDungHan = tongDaNhan > 0 ? Math.round((tongDungHan / tongDaNhan) * 100) : 0;

  return {
    tongNhuCau,
    tongDaNhan,
    tongDungHan,
    tongChamHan,
    tiLeDungHan,
    theoLoaiNhuCau: Array.from(theoLoaiMap.values()),
    theoNguon,
    danhSachChamHan: danhSachChamHan.sort((a, b) => b.soNgayTre - a.soNgayTre),
  };
}

function mergeLoaiAnhCount(
  existing: LoaiAnhChupCount[],
  incoming: Map<LoaiAnhChup, number>,
): LoaiAnhChupCount[] {
  const map = new Map<LoaiAnhChup, number>(existing.map((e) => [e.loaiAnhChup, e.count]));
  for (const [k, v] of incoming) {
    map.set(k, (map.get(k) ?? 0) + v);
  }
  return Array.from(map.entries()).map(([loaiAnhChup, count]) => ({ loaiAnhChup, count }));
}
