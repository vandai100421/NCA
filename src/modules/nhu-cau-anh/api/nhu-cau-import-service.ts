import { Readable } from 'stream';
import ExcelJS from 'exceljs';
import { ZodError } from 'zod';
import { prisma } from '@/lib/db';
import {
  IMPORT_COLUMNS,
  IMPORT_SYNC_COLUMNS,
  nhuCauImportRowSchema,
  nhuCauSyncRowSchema,
  type ImportColumn,
  type NhuCauImportResult,
  type NhuCauImportRowResult,
  type NhuCauMissingRecord,
  type NhuCauSyncResult,
  type NhuCauSyncRowResult,
} from '../schema/nhu-cau-import-schema';

const MAX_IMPORT_ROWS = 1000;

interface ParsedRow {
  rowNumber: number;
  values: Record<string, unknown>;
}

function normalizeHeader(v: unknown): string {
  if (v === null || v === undefined) return '';
  return String(v).trim().toLowerCase();
}

async function parseWorkbookRows(
  buffer: Buffer,
  filename: string,
  columns: ImportColumn[] = IMPORT_COLUMNS,
): Promise<{ headerRow: unknown[]; dataRows: ParsedRow[] }> {
  const workbook = new ExcelJS.Workbook();
  let worksheet: ExcelJS.Worksheet | undefined;

  const isCsv = filename.toLowerCase().endsWith('.csv');
  if (isCsv) {
    worksheet = await workbook.csv.read(Readable.from(buffer.toString('utf-8')));
  } else {
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    await workbook.xlsx.read(stream);
    worksheet = workbook.worksheets[0];
  }

  if (!worksheet) {
    throw new Error('File không có sheet dữ liệu');
  }

  const allRows: unknown[][] = [];
  worksheet.eachRow({ includeEmpty: true }, (row) => {
    allRows.push(row.values as unknown[]);
  });

  if (allRows.length === 0) {
    throw new Error('File rỗng');
  }

  const headerRow = allRows[0] ?? [];
  const colToKey = new Map<number, string>();
  headerRow.forEach((header, idx) => {
    if (idx === 0) return;
    const headerText = normalizeHeader(header);
    if (headerText.length === 0) return;
    const col = columns.find((c) => c.header.toLowerCase() === headerText);
    if (col) colToKey.set(idx, col.key);
  });

  if (colToKey.size === 0) {
    throw new Error(
      'Không nhận diện được cột nào. Hãy dùng nút "Tải file mẫu" để có cấu trúc đúng.',
    );
  }

  const dataRows: ParsedRow[] = [];
  for (let i = 1; i < allRows.length; i += 1) {
    const rowValues = allRows[i] ?? [];
    const obj: Record<string, unknown> = {};
    let hasAny = false;
    colToKey.forEach((key, idx) => {
      const cell = rowValues[idx];
      obj[key] = cell ?? null;
      if (cell !== null && cell !== undefined && cell !== '') hasAny = true;
    });
    if (hasAny) {
      dataRows.push({ rowNumber: i + 1, values: obj });
    }
  }

  return { headerRow, dataRows };
}

function formatZodErrors(error: ZodError): string {
  return error.issues.map((issue) => issue.message).join('; ');
}

export async function importNhuCau(buffer: Buffer, filename: string): Promise<NhuCauImportResult> {
  const { dataRows } = await parseWorkbookRows(buffer, filename);

  if (dataRows.length === 0) {
    return { total: 0, created: 0, failed: 0, results: [] };
  }
  if (dataRows.length > MAX_IMPORT_ROWS) {
    throw new Error(
      `File có ${dataRows.length} dòng, vượt quá giới hạn ${MAX_IMPORT_ROWS} dòng mỗi lần import.`,
    );
  }

  const [mucTieuList, nguonList] = await Promise.all([
    prisma.mucTieu.findMany({ select: { id: true, ten: true } }),
    prisma.nguon.findMany({ select: { id: true, tenNguon: true } }),
  ]);
  const mucTieuMap = new Map<string, number>();
  for (const m of mucTieuList) mucTieuMap.set(m.ten.trim().toLowerCase(), m.id);
  const nguonMap = new Map<string, number>();
  for (const n of nguonList) nguonMap.set(n.tenNguon.trim().toLowerCase(), n.id);

  const results: NhuCauImportRowResult[] = [];
  let created = 0;
  let failed = 0;

  for (const { rowNumber, values } of dataRows) {
    const parsed = nhuCauImportRowSchema.safeParse(values);

    if (!parsed.success) {
      failed += 1;
      results.push({
        row: rowNumber,
        status: 'error',
        message: formatZodErrors(parsed.error),
        data: values,
      });
      continue;
    }

    const row = parsed.data;
    const mucTieuId = mucTieuMap.get(row.mucTieu.trim().toLowerCase());
    const nguonId = nguonMap.get(row.nguon.trim().toLowerCase());

    if (!mucTieuId) {
      failed += 1;
      results.push({
        row: rowNumber,
        status: 'error',
        message: `Mục tiêu "${row.mucTieu}" không tồn tại trong hệ thống`,
        data: values,
      });
      continue;
    }
    if (!nguonId) {
      failed += 1;
      results.push({
        row: rowNumber,
        status: 'error',
        message: `Nguồn "${row.nguon}" không tồn tại trong hệ thống`,
        data: values,
      });
      continue;
    }

    const data: Record<string, unknown> = {
      mucTieuId,
      nguonId,
      loaiNhuCau: row.loaiNhuCau,
      diaBan: row.diaBan,
      loaiAnhChup: row.loaiAnhChup,
      toaDoX: row.toaDoX,
      toaDoY: row.toaDoY,
      doPhanGiai: row.doPhanGiai,
      moTa: row.moTa && row.moTa.length > 0 ? row.moTa : null,
    };
    if (row.thoiGianDat) data.thoiGianDat = row.thoiGianDat;
    if (row.loaiNhuCau === 'CO_DINH') {
      data.thoiGianChup = row.thoiGianChup;
    } else {
      data.thoiGianMongMuonTu = row.thoiGianMongMuonTu;
      data.thoiGianMongMuonDen = row.thoiGianMongMuonDen;
    }

    try {
      const id = await prisma.$transaction(async (tx) => {
        const createdRow = await tx.nhuCauAnh.create({
          data: data as Parameters<typeof tx.nhuCauAnh.create>[0]['data'],
          select: { id: true },
        });
        await tx.nhuCauAnhLichSu.create({
          data: {
            nhuCauId: createdRow.id,
            trangThaiCu: null,
            trangThaiMoi: 'DA_DAT',
            ghiChu: 'Import từ file',
          },
        });
        return createdRow.id;
      });
      created += 1;
      results.push({ row: rowNumber, status: 'success', id, data: values });
    } catch (e) {
      failed += 1;
      results.push({
        row: rowNumber,
        status: 'error',
        message: e instanceof Error ? e.message : 'Lỗi không xác định khi tạo bản ghi',
        data: values,
      });
    }
  }

  return { total: dataRows.length, created, failed, results };
}

function buildSyncKey(
  mucTieuId: number,
  nguonId: number,
  diaBan: string,
  loaiNhuCau: 'CO_DINH' | 'DOT_XUAT',
  thoiGianChup: Date | undefined,
  thoiGianMongMuonTu: Date | undefined,
): string {
  const timeKey =
    loaiNhuCau === 'CO_DINH'
      ? (thoiGianChup?.toISOString() ?? '')
      : (thoiGianMongMuonTu?.toISOString() ?? '');
  return `${mucTieuId}|${nguonId}|${diaBan.trim().toLowerCase()}|${loaiNhuCau}|${timeKey}`;
}

export async function syncNhuCau(buffer: Buffer, filename: string): Promise<NhuCauSyncResult> {
  const { dataRows } = await parseWorkbookRows(buffer, filename, IMPORT_SYNC_COLUMNS);

  if (dataRows.length === 0) {
    return { total: 0, created: 0, updated: 0, failed: 0, missing: [], results: [] };
  }
  if (dataRows.length > MAX_IMPORT_ROWS) {
    throw new Error(
      `File có ${dataRows.length} dòng, vượt quá giới hạn ${MAX_IMPORT_ROWS} dòng mỗi lần đồng bộ.`,
    );
  }

  const [mucTieuList, nguonList, existingList] = await Promise.all([
    prisma.mucTieu.findMany({ select: { id: true, ten: true } }),
    prisma.nguon.findMany({ select: { id: true, tenNguon: true } }),
    prisma.nhuCauAnh.findMany({
      select: {
        id: true,
        mucTieuId: true,
        nguonId: true,
        diaBan: true,
        loaiNhuCau: true,
        trangThai: true,
        thoiGianDat: true,
        thoiGianChup: true,
        thoiGianMongMuonTu: true,
        mucTieu: { select: { ten: true } },
        nguon: { select: { tenNguon: true } },
      },
    }),
  ]);

  const mucTieuMap = new Map<string, number>();
  for (const m of mucTieuList) mucTieuMap.set(m.ten.trim().toLowerCase(), m.id);
  const nguonMap = new Map<string, number>();
  for (const n of nguonList) nguonMap.set(n.tenNguon.trim().toLowerCase(), n.id);

  const existingMap = new Map<string, (typeof existingList)[number]>();
  for (const rec of existingList) {
    const key = buildSyncKey(
      rec.mucTieuId,
      rec.nguonId,
      rec.diaBan,
      rec.loaiNhuCau,
      rec.thoiGianChup ?? undefined,
      rec.thoiGianMongMuonTu ?? undefined,
    );
    if (!existingMap.has(key)) existingMap.set(key, rec);
  }

  const results: NhuCauSyncRowResult[] = [];
  const touchedIds = new Set<number>();
  let created = 0;
  let updated = 0;
  let failed = 0;

  for (const { rowNumber, values } of dataRows) {
    const parsed = nhuCauSyncRowSchema.safeParse(values);

    if (!parsed.success) {
      failed += 1;
      results.push({
        row: rowNumber,
        action: 'error',
        status: 'error',
        message: formatZodErrors(parsed.error),
        data: values,
      });
      continue;
    }

    const row = parsed.data;
    const mucTieuId = mucTieuMap.get(row.mucTieu.trim().toLowerCase());
    const nguonId = nguonMap.get(row.nguon.trim().toLowerCase());

    if (!mucTieuId) {
      failed += 1;
      results.push({
        row: rowNumber,
        action: 'error',
        status: 'error',
        message: `Mục tiêu "${row.mucTieu}" không tồn tại trong hệ thống`,
        data: values,
      });
      continue;
    }
    if (!nguonId) {
      failed += 1;
      results.push({
        row: rowNumber,
        action: 'error',
        status: 'error',
        message: `Nguồn "${row.nguon}" không tồn tại trong hệ thống`,
        data: values,
      });
      continue;
    }

    const key = buildSyncKey(
      mucTieuId,
      nguonId,
      row.diaBan,
      row.loaiNhuCau,
      row.thoiGianChup,
      row.thoiGianMongMuonTu,
    );
    const existing = existingMap.get(key);

    const baseData: Record<string, unknown> = {
      mucTieuId,
      nguonId,
      loaiNhuCau: row.loaiNhuCau,
      diaBan: row.diaBan,
      loaiAnhChup: row.loaiAnhChup,
      toaDoX: row.toaDoX,
      toaDoY: row.toaDoY,
      doPhanGiai: row.doPhanGiai,
      moTa: row.moTa && row.moTa.length > 0 ? row.moTa : null,
    };
    if (row.thoiGianDat) baseData.thoiGianDat = row.thoiGianDat;
    if (row.loaiNhuCau === 'CO_DINH') {
      baseData.thoiGianChup = row.thoiGianChup;
    } else {
      baseData.thoiGianMongMuonTu = row.thoiGianMongMuonTu;
      baseData.thoiGianMongMuonDen = row.thoiGianMongMuonDen;
    }

    try {
      if (existing) {
        touchedIds.add(existing.id);
        const updateData: Record<string, unknown> = { ...baseData };
        const newTrangThai = row.trangThai;
        let oldTrangThai: (typeof existing)['trangThai'] | null = null;
        let trangThaiChanged = false;

        if (newTrangThai) {
          oldTrangThai = existing.trangThai;
          updateData.trangThai = newTrangThai;
          trangThaiChanged = newTrangThai !== existing.trangThai;
        }
        if (row.thoiGianTra) {
          updateData.thoiGianTra = row.thoiGianTra;
        } else if (newTrangThai === 'DA_NHAN' && trangThaiChanged) {
          updateData.thoiGianTra = new Date();
        }

        await prisma.$transaction(async (tx) => {
          await tx.nhuCauAnh.update({
            where: { id: existing.id },
            data: updateData as Parameters<typeof tx.nhuCauAnh.update>[0]['data'],
          });
          if (trangThaiChanged && newTrangThai) {
            await tx.nhuCauAnhLichSu.create({
              data: {
                nhuCauId: existing.id,
                trangThaiCu: oldTrangThai,
                trangThaiMoi: newTrangThai,
                ghiChu: 'Đồng bộ từ file',
              },
            });
          }
        });

        updated += 1;
        results.push({
          row: rowNumber,
          action: 'updated',
          status: 'success',
          id: existing.id,
          oldTrangThai,
          newTrangThai,
          message: trangThaiChanged
            ? `Đã cập nhật nhu cầu #${existing.id} (đổi trạng thái ${oldTrangThai} → ${newTrangThai})`
            : `Đã cập nhật nhu cầu #${existing.id}`,
          data: values,
        });
      } else {
        const createData: Record<string, unknown> = { ...baseData };
        const newTrangThai = row.trangThai ?? 'DA_DAT';
        createData.trangThai = newTrangThai;
        if (row.thoiGianTra) {
          createData.thoiGianTra = row.thoiGianTra;
        } else if (newTrangThai === 'DA_NHAN') {
          createData.thoiGianTra = new Date();
        }

        const id = await prisma.$transaction(async (tx) => {
          const createdRow = await tx.nhuCauAnh.create({
            data: createData as Parameters<typeof tx.nhuCauAnh.create>[0]['data'],
            select: { id: true },
          });
          await tx.nhuCauAnhLichSu.create({
            data: {
              nhuCauId: createdRow.id,
              trangThaiCu: null,
              trangThaiMoi: newTrangThai,
              ghiChu: 'Đồng bộ từ file',
            },
          });
          return createdRow.id;
        });

        touchedIds.add(id);
        created += 1;
        results.push({
          row: rowNumber,
          action: 'created',
          status: 'success',
          id,
          newTrangThai,
          message: `Đã tạo nhu cầu #${id}`,
          data: values,
        });
      }
    } catch (e) {
      failed += 1;
      results.push({
        row: rowNumber,
        action: 'error',
        status: 'error',
        message: e instanceof Error ? e.message : 'Lỗi không xác định khi đồng bộ',
        data: values,
      });
    }
  }

  const missing: NhuCauMissingRecord[] = existingList
    .filter((rec) => !touchedIds.has(rec.id))
    .map((rec) => ({
      id: rec.id,
      mucTieu: rec.mucTieu.ten,
      nguon: rec.nguon.tenNguon,
      diaBan: rec.diaBan,
      trangThai: rec.trangThai,
      thoiGianDat: rec.thoiGianDat,
      loaiNhuCau: rec.loaiNhuCau,
    }));

  return { total: dataRows.length, created, updated, failed, missing, results };
}

export async function generateImportTemplate(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'NCA';
  workbook.created = new Date();

  const styleHeader = (row: ExcelJS.Row) => {
    row.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F4E79' },
    };
    row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    row.alignment = { vertical: 'middle', horizontal: 'left' };
    row.commit();
  };

  const ws = workbook.addWorksheet('Nhu cầu ảnh');

  ws.columns = IMPORT_COLUMNS.map((c) => ({
    header: c.header,
    key: c.key,
    width: c.width,
  }));

  styleHeader(ws.getRow(1));

  ws.addRow({
    mucTieu: '(tên mục tiêu đã có trong hệ thống)',
    nguon: '(tên nguồn đã có trong hệ thống)',
    loaiNhuCau: 'Cố định',
    loaiAnhChup: 'Quang học',
    diaBan: 'Hà Nội, quận Cầu Giấy',
    toaDoX: 105.8342,
    toaDoY: 21.0278,
    doPhanGiai: '0.5m',
    thoiGianDat: '',
    thoiGianChup: '2026-07-04 10:00',
    thoiGianMongMuonTu: '',
    thoiGianMongMuonDen: '',
    moTa: 'Dòng ví dụ — vui lòng xóa trước khi import',
  });

  ws.addRow({
    mucTieu: '(tên mục tiêu đã có trong hệ thống)',
    nguon: '(tên nguồn đã có trong hệ thống)',
    loaiNhuCau: 'Đột xuất',
    loaiAnhChup: 'SAR',
    diaBan: 'Hải Phòng',
    toaDoX: 106.6881,
    toaDoY: 20.8449,
    doPhanGiai: '1m',
    thoiGianDat: '',
    thoiGianChup: '',
    thoiGianMongMuonTu: '2026-07-10 08:00',
    thoiGianMongMuonDen: '2026-07-12 18:00',
    moTa: 'Ví dụ loại đột xuất — xóa trước khi import',
  });

  ws.views = [{ state: 'frozen', ySplit: 1 }];

  const syncWs = workbook.addWorksheet('Đồng bộ');
  syncWs.columns = IMPORT_SYNC_COLUMNS.map((c) => ({
    header: c.header,
    key: c.key,
    width: c.width,
  }));
  styleHeader(syncWs.getRow(1));

  syncWs.addRow({
    mucTieu: '(tên mục tiêu đã có trong hệ thống)',
    nguon: '(tên nguồn đã có trong hệ thống)',
    loaiNhuCau: 'Cố định',
    loaiAnhChup: 'Quang học',
    diaBan: 'Hà Nội, quận Cầu Giấy',
    toaDoX: 105.8342,
    toaDoY: 21.0278,
    doPhanGiai: '0.5m',
    thoiGianDat: '',
    thoiGianChup: '2026-07-04 10:00',
    thoiGianMongMuonTu: '',
    thoiGianMongMuonDen: '',
    trangThai: 'Đã nhận',
    thoiGianTra: '2026-07-05 14:00',
    moTa: 'Ví dụ đồng bộ — cập nhật kết quả',
  });

  syncWs.addRow({
    mucTieu: '(tên mục tiêu đã có trong hệ thống)',
    nguon: '(tên nguồn đã có trong hệ thống)',
    loaiNhuCau: 'Đột xuất',
    loaiAnhChup: 'SAR',
    diaBan: 'Hải Phòng',
    toaDoX: 106.6881,
    toaDoY: 20.8449,
    doPhanGiai: '1m',
    thoiGianDat: '',
    thoiGianChup: '',
    thoiGianMongMuonTu: '2026-07-10 08:00',
    thoiGianMongMuonDen: '2026-07-12 18:00',
    trangThai: 'Đã hủy',
    thoiGianTra: '',
    moTa: 'Ví dụ đồng bộ — hủy nhu cầu',
  });

  syncWs.views = [{ state: 'frozen', ySplit: 1 }];

  const guide = workbook.addWorksheet('Hướng dẫn');
  guide.getColumn(1).width = 22;
  guide.getColumn(2).width = 60;
  guide.getColumn(3).width = 14;
  guide.addRow(['Cột', 'Ghi chú', 'Bắt buộc']);
  guide.getRow(1).font = { bold: true };
  for (const col of IMPORT_COLUMNS) {
    guide.addRow([col.header, col.note ?? '', col.required ? 'Có' : 'Không']);
  }
  guide.addRow([]);
  guide.addRow([
    'Lưu ý',
    'Mục tiêu và Nguồn phải khớp với tên đã có trong hệ thống. Loại nhu cầu/ảnh chụp chấp nhận nhãn tiếng Việt hoặc mã enum.',
    '',
  ]);

  const syncGuide = workbook.addWorksheet('Hướng dẫn đồng bộ');
  syncGuide.getColumn(1).width = 22;
  syncGuide.getColumn(2).width = 70;
  syncGuide.getColumn(3).width = 14;
  syncGuide.addRow(['Cột', 'Ghi chú', 'Bắt buộc']);
  syncGuide.getRow(1).font = { bold: true };
  for (const col of IMPORT_SYNC_COLUMNS) {
    syncGuide.addRow([col.header, col.note ?? '', col.required ? 'Có' : 'Không']);
  }
  syncGuide.addRow([]);
  syncGuide.addRow([
    'Khóa khớp',
    'Để cập nhật bản ghi đã có, hệ thống khớp theo: Mục tiêu + Nguồn + Địa bàn + Thời gian chụp (Cố định) hoặc Mong muốn từ (Đột xuất). Nếu không khớp → tạo mới.',
    '',
  ]);
  syncGuide.addRow([
    'Trạng thái',
    'Khi đồng bộ, trạng thái có thể đặt tự do (bypass state machine). Mỗi lần đổi trạng thái đều ghi audit log.',
    '',
  ]);
  syncGuide.addRow([
    'Missing',
    'Các bản ghi trong DB không có trong file sẽ KHÔNG bị thay đổi, chỉ hiển thị danh sách để bạn biết.',
    '',
  ]);
  syncGuide.addRow([
    'Khuyến nghị',
    'Export CSV hiện tại → sửa file → import ở chế độ Đồng bộ. Giữ nguyên các trường khóa để khớp đúng.',
    '',
  ]);

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
