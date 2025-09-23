// Core utility functions for closet.city

/**
 * Fetch a URL and return image data/mime type information.
 */
export async function fetchImageInlineData(url: string): Promise<{ data: string; mimeType: string }> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    let binary = '';
    for (let i = 0; i < uint8Array.byteLength; i += 1) {
      binary += String.fromCharCode(uint8Array[i]);
    }

    const data = btoa(binary);
    const headerType = response.headers.get('content-type');
    const mimeType = headerType?.split(';')[0]?.trim() || inferMimeTypeFromUrl(url) || 'image/jpeg';

    return { data, mimeType };
  } catch (error) {
    console.error('Error fetching as base64:', error);
    throw error;
  }
}

export async function fetchAsBase64(url: string): Promise<string> {
  const result = await fetchImageInlineData(url);
  return result.data;
}

function inferMimeTypeFromUrl(url: string): string | undefined {
  try {
    const base = url.split('?')[0].toLowerCase();
    if (base.endsWith('.png')) return 'image/png';
    if (base.endsWith('.jpg') || base.endsWith('.jpeg')) return 'image/jpeg';
    if (base.endsWith('.webp')) return 'image/webp';
    if (base.endsWith('.gif')) return 'image/gif';
  } catch {
    // ignore
  }
  return undefined;
}

/**
 * Upload bytes to R2 bucket and return public URL
 */
export async function r2Put(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  r2: any, // R2Bucket - will be available at runtime
  key: string,
  bytes: ArrayBuffer | Uint8Array,
  contentType: string
): Promise<string> {
  try {
    await r2.put(key, bytes, {
      httpMetadata: {
        contentType,
      },
    });
    
    // Return a public URL - in production this would be your R2 custom domain
    // For now, we'll use a placeholder that can be proxied through /api/r2/[key]
    return `/api/r2/${key}`;
  } catch (error) {
    console.error('Error uploading to R2:', error);
    throw error;
  }
}

/**
 * Generate SHA-256 hash of a string
 */
export async function sha256(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Validate file type and size for uploads
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 8 * 1024 * 1024; // 8MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 8MB' };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'File must be a JPEG, PNG, or WebP image' };
  }
  
  return { valid: true };
}

/**
 * Generate a unique ID for database records
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Get MIME type from file extension
 */
export function getMimeType(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop();
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    default:
      return 'application/octet-stream';
  }
}
