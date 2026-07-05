import { apiSuccess } from '@/lib/errors';
import { handleRouteError } from '@/lib/route-handler';
import { getTongQuan } from '@/modules/thong-ke/api/thong-ke-service';

export async function GET() {
  try {
    const data = await getTongQuan();
    return apiSuccess(data);
  } catch (e) {
    return handleRouteError(e);
  }
}
