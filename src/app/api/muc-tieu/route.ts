import { NextRequest } from 'next/server';
import { apiSuccess } from '@/lib/errors';
import { handleRouteError } from '@/lib/route-handler';
import { createMucTieu, listMucTieu } from '@/modules/muc-tieu/api/muc-tieu-service';
import { createMucTieuSchema } from '@/modules/muc-tieu/schema/muc-tieu-schema';

export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get('search') ?? undefined;
    const trimmed = search?.trim();
    const data = await listMucTieu(trimmed && trimmed.length > 0 ? trimmed : undefined);
    return apiSuccess(data);
  } catch (e) {
    return handleRouteError(e);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = createMucTieuSchema.parse(body);
    const data = await createMucTieu(input);
    return apiSuccess(data, 201);
  } catch (e) {
    return handleRouteError(e);
  }
}
