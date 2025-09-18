export const onRequest = async (context: any) => {
  try {
    const { env, request } = context as unknown as { env: any; request: Request };
    if (!env.R2) {
      return new Response(JSON.stringify({ success: false, error: 'R2 storage not configured', code: 'CONFIG_MISSING', url: '' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const kind = (formData.get('kind') as string | null) || 'model';

    if (!file) {
      return new Response(JSON.stringify({ success: false, error: 'No file provided', code: 'BAD_REQUEST', url: '' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const { generateId } = await import('../../src/lib/utils');
    const { MAX_FILE_SIZE, ALLOWED_IMAGE_TYPES } = await import('../../src/lib/constants');

    if (file.size > MAX_FILE_SIZE) {
      return new Response(JSON.stringify({ success: false, error: 'File size must be less than 8MB', code: 'BAD_REQUEST', url: '' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return new Response(JSON.stringify({ success: false, error: 'File must be a JPEG, PNG, or WebP image', code: 'BAD_REQUEST', url: '' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const fileId = generateId();
    const extension = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const filename = `${kind}/${fileId}.${extension}`;

    const arrayBuffer = await file.arrayBuffer();

    const { r2Put } = await import('../../src/lib/utils');
    const url = await r2Put(env.R2, filename, arrayBuffer, file.type);

    return new Response(JSON.stringify({ success: true, url }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Upload error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Upload failed', code: 'INTERNAL_ERROR', url: '' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

