import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiSuccess } from '@/lib/errors';
import { handleRouteError } from '@/lib/route-handler';
import { getThongKeThoiGian } from '@/modules/thong-ke/api/thong-ke-service';

const querySchema = z.object({
  tuNgay: z.coerce.date().optional(),
  denNgay: z.coerce.date().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const { tuNgay, denNgay } = querySchema.parse(params);
    const data = await getThongKeThoiGian(tuNgay, denNgay);
    return apiSuccess(data);
  } catch (e) {
    return handleRouteError(e);
  }
}
