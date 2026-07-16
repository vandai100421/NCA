import type { LoaiNhuCau } from '@/infrastructure/prisma/generated/client';

export interface NhuCauKeyInput {
  mucTieuId: number;
  nguonId: number;
  diaBan: string;
  loaiNhuCau: LoaiNhuCau;
  thoiGianChup?: Date | null;
  thoiGianMongMuonTu?: Date | null;
}

export function buildNhuCauKey(input: NhuCauKeyInput): string {
  const timeKey =
    input.loaiNhuCau === 'CO_DINH'
      ? (input.thoiGianChup?.toISOString() ?? '')
      : (input.thoiGianMongMuonTu?.toISOString() ?? '');
  return `${input.mucTieuId}|${input.nguonId}|${input.diaBan.trim().toLowerCase()}|${input.loaiNhuCau}|${timeKey}`;
}
