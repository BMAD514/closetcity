import { NextRequest, NextResponse } from 'next/server';
import { r2Put, generateId } from '@/lib/utils';
import { MAX_FILE_SIZE, ALLOWED_IMAGE_TYPES } from '@/lib/constants';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { Env, UploadResponse } from '@/lib/types';

export const runtime = 'edge';

export async function POST(request: NextRequest): Promise<NextResponse<UploadResponse>> {
  try {
    // Get Cloudflare bindings from Cloudflare runtime
    const env = getRequestContext().env as unknown as Env;
    
    if (!env.R2) {
      return NextResponse.json(
        { success: false, error: 'R2 storage not configured', code: 'CONFIG_MISSING', url: '' },
        { status: 500 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const kind = formData.get('kind') as string;

    // Validate inputs
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided', code: 'BAD_REQUEST', url: '' },
        { status: 400 }
      );
    }

    if (!kind || !['model', 'garment'].includes(kind)) {
      return NextResponse.json(
        { success: false, error: 'Invalid kind. Must be "model" or "garment"', code: 'BAD_REQUEST', url: '' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File size must be less than 8MB', code: 'BAD_REQUEST', url: '' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'File must be a JPEG, PNG, or WebP image', code: 'BAD_REQUEST', url: '' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileId = generateId();
    const extension = file.name.split('.').pop() || 'jpg';
    const filename = `${kind}/${fileId}.${extension}`;

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Upload to R2
    const url = await r2Put(env.R2, filename, arrayBuffer, file.type);

    console.log(`Uploaded ${kind} image: ${filename} (${file.size} bytes)`);

    return NextResponse.json({
      success: true,
      url,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
        code: 'INTERNAL_ERROR',
        url: ''
      },
      { status: 500 }
    );
  }
}
