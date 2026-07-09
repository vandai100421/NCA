import { PrismaClient } from '../src/infrastructure/prisma/generated/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error('DATABASE_URL chưa được cấu hình');
}

const adapter = new PrismaBetterSqlite3({ url });
const prisma = new PrismaClient({ adapter });

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const daysFromNow = (days: number): Date => new Date(Date.now() + days * MS_PER_DAY);
const daysAgo = (days: number): Date => daysFromNow(-days);

async function main() {
  console.log('Seeding...');

  await prisma.nhuCauAnhLichSu.deleteMany();
  await prisma.nhuCauAnh.deleteMany();
  await prisma.mucTieu.deleteMany();
  await prisma.nguon.deleteMany();

  // Reset auto-increment để ID cố định (12/34/56) không bị xung đột
  await prisma.$executeRaw`DELETE FROM sqlite_sequence WHERE name IN ('muc_tieu', 'nguon', 'nhu_cau_anh', 'nhu_cau_anh_lich_su')`;

  // ===== Mục tiêu (10) =====
  const mucTieuTen = [
    'Khu công nghiệp Bắc Thăng Long',
    'Cảng biển Hải Phòng',
    'Khu vực biên giới Lạng Sơn',
    'Đô thị trung tâm Hà Nội',
    'Nhà máy nhiệt điện Uông Bí',
    'Khu vực rừng quốc gia Cúc Phương',
    'Cầu Long Biên và phụ cận',
    'Sân bay quốc tế Nội Bài',
    'Khu đô thị mới Ocean Park',
    'Đập thủy điện Hòa Bình',
  ];
  const mucTieu = await Promise.all(
    mucTieuTen.map((ten) => prisma.mucTieu.create({ data: { ten } })),
  );
  console.log(`Created ${mucTieu.length} mục tiêu`);

  // ===== Nguồn (3, ID cố định 12/34/56, đều là vệ tinh) =====
  const nguonData = [
    {
      id: 12,
      nguon: 'vệ tinh',
      tenNguon: 'VT-Optical-Sat1',
      thoiGianSuDung: '01/01/2025 - 31/12/2025',
      tinhTrang: 'HOAT_DONG' as const,
      danhGia: 'Ảnh chất lượng cao, độ phân giải 0.5m, tần suất quay 3 ngày/lần',
    },
    {
      id: 34,
      nguon: 'vệ tinh',
      tenNguon: 'VT-SAR-Sat2',
      thoiGianSuDung: '01/06/2025 - 31/05/2026',
      tinhTrang: 'BAO_TRI' as const,
      danhGia: 'SAR toàn thời tiết, hoạt động tốt cả ban đêm và có mây',
    },
    {
      id: 56,
      nguon: 'vệ tinh',
      tenNguon: 'VT-Multi-Sat3',
      thoiGianSuDung: '01/01/2025 - 31/12/2026',
      tinhTrang: 'NGUNG_HOAT_DONG' as const,
      danhGia: 'Đa phổ, phù hợp quan trắc môi trường và nông nghiệp',
    },
  ];
  const nguon = await Promise.all(nguonData.map((d) => prisma.nguon.create({ data: d })));
  console.log(`Created ${nguon.length} nguồn`);

  // ===== Nhu cầu ảnh (30 bản ghi) =====
  const loaiAnhChup = [
    'QUANG_HOC',
    'HONG_NGOAI',
    'SAR',
    'DA_PHO',
    'SIEU_PHO',
    'NHIET',
    'VIDEO',
  ] as const;
  const diaBan = [
    'Hà Nội, quận Cầu Giấy',
    'Hải Phòng, quận Lê Chân',
    'Lạng Sơn, huyện Hữu Lũng',
    'Hà Nội, quận Hoàn Kiếm',
    'Quảng Ninh, TP Hạ Long',
    'Ninh Bình, huyện Hoa Lư',
    'Hà Nội, quận Long Biên',
    'Hà Nội, huyện Sóc Sơn',
    'Hưng Yên, TP Hưng Yên',
    'Hòa Bình, huyện Đà Bắc',
    'Bắc Ninh, TP Bắc Ninh',
    'Hải Dương, TP Hải Dương',
    'Thái Nguyên, TP Thái Nguyên',
    'Vĩnh Phúc, TP Vĩnh Yên',
    'Phú Thọ, TP Việt Trì',
    'Bắc Giang, huyện Yên Dũng',
    'Hà Nam, TP Phủ Lý',
    'Nam Định, TP Nam Định',
    'Thái Bình, TP Thái Bình',
    'Ninh Bình, TP Ninh Bình',
  ];
  const doPhanGiai = ['0.3m', '0.5m', '1m', '2m', '5m', '10m', '30cm', '50cm'];
  const moTaPool = [
    'Yêu cầu chụp giám sát thi công dự án',
    'Quan trắc biến động bề mặt',
    'Cập nhật hiện trạng đất đai',
    'Phục vụ quy hoạch chi tiết 1/500',
    'Giám sát môi trường khu vực',
    'Đánh giá thiệt hại sau thiên tai',
    'Cập nhật bản đồ nền',
    'Kiểm tra lấn chiếm hành lang',
    'Quan sát biến động rừng',
    'Phục vụ báo cáo định kỳ quý',
    undefined,
    undefined,
  ];

  let nhuCauCount = 0;
  let lichSuCount = 0;

  for (let i = 0; i < 30; i++) {
    const mucTieuIdx = i % mucTieu.length;
    const nguonIdx = i % nguon.length;
    const loaiNhuCau = i % 3 === 0 ? ('DOT_XUAT' as const) : ('CO_DINH' as const);
    const loaiAnh = loaiAnhChup[i % loaiAnhChup.length]!;
    const ngayDat = daysAgo(60 - i * 2);

    // Phân bổ trạng thái: ~40% DA_NHAN, ~25% FAIL, ~35% DA_DAT
    let trangThai: 'DA_DAT' | 'DA_HUY' | 'DA_NHAN';
    if (i % 5 < 2) trangThai = 'DA_NHAN';
    else if (i % 5 === 2) trangThai = 'DA_HUY';
    else trangThai = 'DA_DAT';

    const data: Record<string, unknown> = {
      mucTieuId: mucTieu[mucTieuIdx]!.id,
      nguonId: nguon[nguonIdx]!.id,
      loaiNhuCau,
      diaBan: diaBan[i % diaBan.length]!,
      loaiAnhChup: loaiAnh,
      toaDoX: 105 + (i % 7) * 0.3,
      toaDoY: 20.5 + (i % 6) * 0.4,
      thoiGianDat: ngayDat,
      doPhanGiai: doPhanGiai[i % doPhanGiai.length]!,
      trangThai,
      moTa: moTaPool[i % moTaPool.length],
    };

    if (loaiNhuCau === 'CO_DINH') {
      data.thoiGianChup = daysAgo(50 - i * 2);
    } else {
      data.thoiGianMongMuonTu = daysAgo(55 - i * 2);
      data.thoiGianMongMuonDen = daysAgo(40 - i * 2);
    }

    if (trangThai === 'DA_NHAN') {
      data.thoiGianTra = daysAgo(20 - (i % 15));
    }

    const created = await prisma.nhuCauAnh.create({ data: data as never });
    nhuCauCount += 1;

    // Lịch sử trạng thái
    await prisma.nhuCauAnhLichSu.create({
      data: {
        nhuCauId: created.id,
        trangThaiCu: null,
        trangThaiMoi: 'DA_DAT',
        thoiGian: ngayDat,
        ghiChu: 'Tạo nhu cầu mới',
      },
    });
    lichSuCount += 1;

    if (trangThai === 'DA_NHAN') {
      const ngayTra = data.thoiGianTra as Date;
      await prisma.nhuCauAnhLichSu.create({
        data: {
          nhuCauId: created.id,
          trangThaiCu: 'DA_DAT',
          trangThaiMoi: 'DA_NHAN',
          thoiGian: ngayTra,
          ghiChu: i % 2 === 0 ? 'Đã nhận đủ ảnh, chất lượng đạt yêu cầu' : 'Nhận ảnh thành công',
        },
      });
      lichSuCount += 1;
    } else if (trangThai === 'DA_HUY') {
      await prisma.nhuCauAnhLichSu.create({
        data: {
          nhuCauId: created.id,
          trangThaiCu: 'DA_DAT',
          trangThaiMoi: 'DA_HUY',
          thoiGian: daysAgo(30 - i),
          ghiChu:
            i % 2 === 0
              ? 'Mây che phủ không chụp được, hủy nhu cầu'
              : 'Nguồn đang bảo trì, hủy nhu cầu',
        },
      });
      lichSuCount += 1;
    }
  }

  console.log(`Created ${nhuCauCount} nhu cầu ảnh + ${lichSuCount} bản ghi lịch sử`);
  console.log(
    `Seed done. MucTieu IDs: ${mucTieu.map((m) => m.id).join(', ')}. Nguon IDs: ${nguon
      .map((n) => n.id)
      .join(', ')}.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
