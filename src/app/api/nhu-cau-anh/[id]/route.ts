import { NextRequest } from 'next/server';
import { apiSuccess } from '@/lib/errors';
import { handleRouteError, parseId } from '@/lib/route-handler';
import {
  deleteNhuCau,
  getNhuCauById,
  updateNhuCau,
} from '@/modules/nhu-cau-anh/api/nhu-cau-anh-service';
import { updateNhuCauSchema } from '@/modules/nhu-cau-anh/schema/nhu-cau-anh-schema';

export async function GET(_request: NextRequest, ctx: RouteContext<'/api/nhu-cau-anh/[id]'>) {
  try {
    const { id } = await ctx.params;
    const data = await getNhuCauById(parseId(id));
    return apiSuccess(data);
  } catch (e) {
    return handleRouteError(e);
  }
}

export async function PUT(request: NextRequest, ctx: RouteContext<'/api/nhu-cau-anh/[id]'>) {
  try {
    const { id } = await ctx.params;
    const body = await request.json();
    const input = updateNhuCauSchema.parse(body);
    const data = await updateNhuCau(parseId(id), input);
    return apiSuccess(data);
  } catch (e) {
    return handleRouteError(e);
  }
}

export async function DELETE(_request: NextRequest, ctx: RouteContext<'/api/nhu-cau-anh/[id]'>) {
  try {
    const { id } = await ctx.params;
    await deleteNhuCau(parseId(id));
    return new Response(null, { status: 204 });
  } catch (e) {
    return handleRouteError(e);
  }
}
