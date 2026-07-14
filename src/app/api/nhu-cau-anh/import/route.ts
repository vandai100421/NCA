import { NextRequest } from 'next/server';
import { apiSuccess, ValidationError } from '@/lib/errors';
import { handleRouteError } from '@/lib/route-handler';
import {
  generateImportTemplate,
  importNhuCau,
} from '@/modules/nhu-cau-anh/api/nhu-cau-import-service';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ['.xlsx', '.csv'];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      throw new ValidationError('Vui lòng chọn file để import');
    }

    const filename = file.name.toLowerCase();
    const ext = ALLOWED_EXTENSIONS.find((e) => filename.endsWith(e));
    if (!ext) {
      throw new ValidationError(
        `Định dạng file không hỗ trợ. Chấp nhận: ${ALLOWED_EXTENSIONS.join(', ')}`,
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new ValidationError(`File quá lớn (tối đa ${MAX_FILE_SIZE / 1024 / 1024}MB)`);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await importNhuCau(buffer, file.name);
    return apiSuccess(result);
  } catch (e) {
    return handleRouteError(e);
  }
}

export async function GET() {
  try {
    const buffer = await generateImportTemplate();
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="mau-import-nhu-cau-anh-${stamp}.xlsx"`,
      },
    });
  } catch (e) {
    return handleRouteError(e);
  }
}
