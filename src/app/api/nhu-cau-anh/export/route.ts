import { NextRequest } from 'next/server';
import { handleRouteError } from '@/lib/route-handler';
import { exportNhuCauCsv } from '@/modules/nhu-cau-anh/api/nhu-cau-anh-service';
import { nhuCauListQuerySchema } from '@/modules/nhu-cau-anh/schema/nhu-cau-anh-schema';

export async function GET(request: NextRequest) {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const query = nhuCauListQuerySchema.parse(params);
    const csv = await exportNhuCauCsv(query);
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    return new Response(`\uFEFF${csv}`, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="nhu-cau-anh-${stamp}.csv"`,
      },
    });
  } catch (e) {
    return handleRouteError(e);
  }
}
