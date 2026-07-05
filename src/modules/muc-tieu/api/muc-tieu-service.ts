import { prisma } from '@/lib/db';
import { ConflictError, NotFoundError } from '@/lib/errors';
import type { MucTieu } from '@/infrastructure/prisma/generated/client';
import type { CreateMucTieuInput, UpdateMucTieuInput } from '../schema/muc-tieu-schema';

export async function listMucTieu(search?: string): Promise<MucTieu[]> {
  return prisma.mucTieu.findMany({
    where: search ? { ten: { contains: search } } : undefined,
    orderBy: { id: 'desc' },
  });
}

export async function getMucTieuById(id: number): Promise<MucTieu> {
  const mucTieu = await prisma.mucTieu.findUnique({ where: { id } });
  if (!mucTieu) {
    throw new NotFoundError('Mục tiêu');
  }
  return mucTieu;
}

export async function createMucTieu(input: CreateMucTieuInput): Promise<MucTieu> {
  const existing = await prisma.mucTieu.findUnique({ where: { ten: input.ten } });
  if (existing) {
    throw new ConflictError(`Tên mục tiêu "${input.ten}" đã tồn tại`);
  }
  return prisma.mucTieu.create({ data: { ten: input.ten } });
}

export async function updateMucTieu(id: number, input: UpdateMucTieuInput): Promise<MucTieu> {
  const existing = await prisma.mucTieu.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError('Mục tiêu');
  }
  const duplicate = await prisma.mucTieu.findUnique({ where: { ten: input.ten } });
  if (duplicate && duplicate.id !== id) {
    throw new ConflictError(`Tên mục tiêu "${input.ten}" đã tồn tại`);
  }
  return prisma.mucTieu.update({ where: { id }, data: { ten: input.ten } });
}

export async function deleteMucTieu(id: number): Promise<void> {
  const existing = await prisma.mucTieu.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError('Mục tiêu');
  }
  const nhuCauCount = await prisma.nhuCauAnh.count({ where: { mucTieuId: id } });
  if (nhuCauCount > 0) {
    throw new ConflictError(`Không thể xóa mục tiêu đang có ${nhuCauCount} nhu cầu ảnh liên kết`);
  }
  await prisma.mucTieu.delete({ where: { id } });
}
