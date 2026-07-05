import { NextRequest } from 'next/server';
import { apiSuccess } from '@/lib/errors';
import { handleRouteError } from '@/lib/route-handler';
import { createNguon, listNguon } from '@/modules/nguon/api/nguon-service';
import { createNguonSchema } from '@/modules/nguon/schema/nguon-schema';

export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get('search') ?? undefined;
    const trimmed = search?.trim();
    const data = await listNguon(trimmed && trimmed.length > 0 ? trimmed : undefined);
    return apiSuccess(data);
  } catch (e) {
    return handleRouteError(e);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = createNguonSchema.parse(body);
    const data = await createNguon(input);
    return apiSuccess(data, 201);
  } catch (e) {
    return handleRouteError(e);
  }
}
