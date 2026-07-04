import { NextRequest } from 'next/server';
import { apiSuccess } from '@/lib/errors';
import { handleRouteError } from '@/lib/route-handler';
import { createNhuCau, listNhuCau } from '@/modules/nhu-cau-anh/api/nhu-cau-anh-service';
import {
  createNhuCauSchema,
  nhuCauListQuerySchema,
} from '@/modules/nhu-cau-anh/schema/nhu-cau-anh-schema';

export async function GET(request: NextRequest) {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const query = nhuCauListQuerySchema.parse(params);
    const result = await listNhuCau(query);
    return apiSuccess(result);
  } catch (e) {
    return handleRouteError(e);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = createNhuCauSchema.parse(body);
    const data = await createNhuCau(input);
    return apiSuccess(data, 201);
  } catch (e) {
    return handleRouteError(e);
  }
}
