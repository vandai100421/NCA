import { NextRequest } from 'next/server';
import { apiSuccess } from '@/lib/errors';
import { handleRouteError, parseId } from '@/lib/route-handler';
import { transitionState } from '@/modules/nhu-cau-anh/api/nhu-cau-anh-service';
import { transitionSchema } from '@/modules/nhu-cau-anh/schema/nhu-cau-anh-schema';

export async function POST(
  request: NextRequest,
  ctx: RouteContext<'/api/nhu-cau-anh/[id]/transition'>,
) {
  try {
    const { id } = await ctx.params;
    const body = await request.json();
    const input = transitionSchema.parse(body);
    const data = await transitionState(parseId(id), input);
    return apiSuccess(data);
  } catch (e) {
    return handleRouteError(e);
  }
}
