import { PrismaClient } from '../src/infrastructure/prisma/generated/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error('DATABASE_URL chưa được cấu hình');
}

const adapter = new PrismaBetterSqlite3({ url });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding...');

  await prisma.nhuCauAnhLichSu.deleteMany();
  await prisma.nhuCauAnh.deleteMany();
  await prisma.mucTieu.deleteMany();
  await prisma.nguon.deleteMany();

  const mucTieu1 = await prisma.mucTieu.create({
    data: { ten: 'Khu công nghiệp Bắc Thăng Long' },
  });
  const mucTieu2 = await prisma.mucTieu.create({
    data: { ten: 'Cảng biển Hải Phòng' },
  });
  const mucTieu3 = await prisma.mucTieu.create({
    data: { ten: 'Khu vực biên giới Lạng Sơn' },
  });
  const mucTieu4 = await prisma.mucTieu.create({
    data: { ten: 'Đô thị trung tâm Hà Nội' },
  });

  console.log(`Created ${4} mục tiêu`);

  await prisma.nguon.create({
    data: {
      nguon: 'vệ tinh',
      tenNguon: 'VT-Optical-Sat1',
      thoiGianSuDung: '01/01/2025 - 31/12/2025',
      tinhTrang: 'HOAT_DONG',
      danhGia: 'Ảnh chất lượng cao, độ phân giải 0.5m, tần suất quay 3 ngày/lần',
    },
  });

  await prisma.nguon.create({
    data: {
      nguon: 'vệ tinh',
      tenNguon: 'VT-SAR-Sat2',
      thoiGianSuDung: '01/06/2025 - 31/05/2026',
      tinhTrang: 'HOAT_DONG',
      danhGia: 'SAR toàn thời tiết, hoạt động tốt cả ban đêm và có mây',
    },
  });

  await prisma.nguon.create({
    data: {
      nguon: 'UAV',
      tenNguon: 'UAV-DJI-M300-01',
      thoiGianSuDung: '15/03/2025 - hiện tại',
      tinhTrang: 'BAO_TRI',
      danhGia: 'Drone linh hoạt, bay thấp được, đang bảo trì cánh quạt',
    },
  });

  await prisma.nguon.create({
    data: {
      nguon: 'hàng không',
      tenNguon: 'HK-Cessna-208',
      thoiGianSuDung: '01/01/2025 - 31/12/2026',
      tinhTrang: 'HOAT_DONG',
      danhGia: 'Máy bay nhỏ, phủ rộng 50km2 mỗi chuyến bay',
    },
  });

  await prisma.nguon.create({
    data: {
      nguon: 'UAV',
      tenNguon: 'UAV-FixedWing-02',
      thoiGianSuDung: '01/09/2025 - 28/02/2026',
      tinhTrang: 'NGUNG_HOAT_DONG',
      danhGia: 'Cánh cố định, bay lâu, nhưng đã hết giấy phép bay',
    },
  });

  console.log(`Created ${5} nguồn`);
  console.log(
    `Seed done. MucTieu IDs: ${[mucTieu1.id, mucTieu2.id, mucTieu3.id, mucTieu4.id].join(', ')}`,
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
