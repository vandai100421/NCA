import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiSuccess } from '@/lib/errors';
import { handleRouteError } from '@/lib/route-handler';
import { getThongKeThoiGian } from '@/modules/thong-ke/api/thong-ke-service';

const querySchema = z.object({
  tuNgay: z.string().optional(),
  denNgay: z.string().optional(),
  nguonIds: z
    .string()
    .optional()
    .transform((v) =>
      v && v.trim().length > 0
        ? v
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
            .map((s) => Number(s))
            .filter((n) => Number.isInteger(n) && n > 0)
        : undefined,
    ),
});

export async function GET(request: NextRequest) {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const { tuNgay, denNgay, nguonIds } = querySchema.parse(params);
    const data = await getThongKeThoiGian(tuNgay, denNgay, nguonIds);
    return apiSuccess(data);
  } catch (e) {
    return handleRouteError(e);
  }
}
