import { prisma } from '@/lib/db';
import { ConflictError, NotFoundError } from '@/lib/errors';
import type { Nguon } from '@/infrastructure/prisma/generated/client';
import type { CreateNguonInput, UpdateNguonInput } from '../schema/nguon-schema';

export async function listNguon(search?: string): Promise<Nguon[]> {
  const where = search
    ? {
        OR: [
          { tenNguon: { contains: search } },
          { nguon: { contains: search } },
          { danhGia: { contains: search } },
        ],
      }
    : undefined;
  return prisma.nguon.findMany({
    where,
    orderBy: { id: 'desc' },
  });
}

export async function getNguonById(id: number): Promise<Nguon> {
  const nguon = await prisma.nguon.findUnique({ where: { id } });
  if (!nguon) {
    throw new NotFoundError('Nguồn');
  }
  return nguon;
}

export async function createNguon(input: CreateNguonInput): Promise<Nguon> {
  const existing = await prisma.nguon.findUnique({ where: { tenNguon: input.tenNguon } });
  if (existing) {
    throw new ConflictError(`Tên nguồn "${input.tenNguon}" đã tồn tại`);
  }
  const { danhGia, ...rest } = input;
  return prisma.nguon.create({
    data: {
      ...rest,
      danhGia: danhGia && danhGia.length > 0 ? danhGia : null,
    },
  });
}

export async function updateNguon(id: number, input: UpdateNguonInput): Promise<Nguon> {
  const existing = await prisma.nguon.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError('Nguồn');
  }
  const duplicate = await prisma.nguon.findUnique({ where: { tenNguon: input.tenNguon } });
  if (duplicate && duplicate.id !== id) {
    throw new ConflictError(`Tên nguồn "${input.tenNguon}" đã tồn tại`);
  }
  const { danhGia, ...rest } = input;
  return prisma.nguon.update({
    where: { id },
    data: {
      ...rest,
      danhGia: danhGia && danhGia.length > 0 ? danhGia : null,
    },
  });
}

export async function deleteNguon(id: number): Promise<void> {
  const existing = await prisma.nguon.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError('Nguồn');
  }
  const nhuCauCount = await prisma.nhuCauAnh.count({ where: { nguonId: id } });
  if (nhuCauCount > 0) {
    throw new ConflictError(`Không thể xóa nguồn đang có ${nhuCauCount} nhu cầu ảnh liên kết`);
  }
  await prisma.nguon.delete({ where: { id } });
}
