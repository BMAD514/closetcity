import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { Env } from '@/lib/types';

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
): Promise<NextResponse> {
  try {
    // Get Cloudflare bindings from Cloudflare runtime
    const env = getRequestContext().env as unknown as Env;
    
    if (!env.R2) {
      return new NextResponse('R2 storage not configured', { status: 500 });
    }

    const resolvedParams = await params;
    const key = resolvedParams.key;
    
    if (!key) {
      return new NextResponse('Key parameter required', { status: 400 });
    }

    // Decode the key in case it contains slashes
    const decodedKey = decodeURIComponent(key);

    // Get object from R2
    const object = await env.R2.get(decodedKey);

    if (!object) {
      return new NextResponse('File not found', { status: 404 });
    }

    // Get the content type from metadata or infer from extension
    const contentType = object.httpMetadata?.contentType || 'application/octet-stream';

    // Return the file with appropriate headers
    return new NextResponse(object.body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable', // Long-lived immutable cache for generated images
        'ETag': object.etag,
      },
    });

  } catch (error) {
    console.error('R2 proxy error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
