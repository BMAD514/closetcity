import { TRYON_PROMPT_V1, TRYON_PROMPT_V2, MODEL_PROMPT_V2, POSE_PROMPT_TEMPLATE, GEMINI_API_URL, API_TIMEOUT } from '@/lib/constants';
import { fetchAsBase64 } from '@/lib/utils';

export interface TryOnProvider {
  generateModel(userImageUrl: string): Promise<{ mimeType: string; dataBase64: string } | null>;
  applyGarment(modelUrl: string, garmentUrl: string, poseKey: string): Promise<{ mimeType: string; dataBase64: string } | null>;
  pose(outfitUrl: string, poseKey: string): Promise<{ mimeType: string; dataBase64: string } | null>;
}

export class GeminiProvider implements TryOnProvider {
  constructor(private apiKey: string) {}

  async generateModel(userImageUrl: string): Promise<{ mimeType: string; dataBase64: string } | null> {
    const userBase64 = await fetchAsBase64(userImageUrl);
    const body = {
      contents: [
        { text: MODEL_PROMPT_V2 },
        { inlineData: { data: userBase64, mimeType: 'image/*' } },
      ],
    };
    const res = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': this.apiKey },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(API_TIMEOUT),
    });
    if (!res.ok) return null;
    const json = await res.json();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const safety = (json?.candidates?.[0]?.safetyRatings) ?? [];
      if (Array.isArray(safety) && safety.length) console.warn('Gemini safetyRatings:', safety);
      if (json?.promptFeedback) console.warn('Gemini promptFeedback:', json.promptFeedback);
    } catch { /* noop */ }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const part = json?.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
    if (!part?.inlineData?.data) return null;
    return { mimeType: part.inlineData.mimeType || 'image/webp', dataBase64: part.inlineData.data };
  }

  async applyGarment(modelUrl: string, garmentUrl: string, poseKey: string) {
    const [modelBase64, garmentBase64] = await Promise.all([
      fetchAsBase64(modelUrl),
      fetchAsBase64(garmentUrl),
    ]);

    const body = {
      contents: [
        { text: TRYON_PROMPT_V2 || TRYON_PROMPT_V1 },
        { inlineData: { data: modelBase64, mimeType: 'image/*' } },
        { inlineData: { data: garmentBase64, mimeType: 'image/*' } },
      ],
    };

    const res = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': this.apiKey,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(API_TIMEOUT),
    });

    if (!res.ok) return null;
    const json = await res.json();
    try {
      // Log safety/prompt feedback if present
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const safety = (json?.candidates?.[0]?.safetyRatings) ?? [];
      if (Array.isArray(safety) && safety.length) console.warn('Gemini safetyRatings:', safety);
      if (json?.promptFeedback) console.warn('Gemini promptFeedback:', json.promptFeedback);
    } catch { /* noop */ }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const part = json?.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
    if (!part?.inlineData?.data) return null;
    return { mimeType: part.inlineData.mimeType || 'image/webp', dataBase64: part.inlineData.data };
  }

  async pose(outfitUrl: string, poseKey: string) {
    const outfitBase64 = await fetchAsBase64(outfitUrl);
    const body = {
      contents: [
        { text: POSE_PROMPT_TEMPLATE(poseKey) },
        { inlineData: { data: outfitBase64, mimeType: 'image/*' } },
      ],
    };

    const res = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': this.apiKey,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(API_TIMEOUT),
    });

    if (!res.ok) return null;
    const json = await res.json();
    try {
      // Log safety/prompt feedback if present
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const safety = (json?.candidates?.[0]?.safetyRatings) ?? [];
      if (Array.isArray(safety) && safety.length) console.warn('Gemini safetyRatings:', safety);
      if (json?.promptFeedback) console.warn('Gemini promptFeedback:', json.promptFeedback);
    } catch { /* noop */ }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const part = json?.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
    if (!part?.inlineData?.data) return null;
    return { mimeType: part.inlineData.mimeType || 'image/webp', dataBase64: part.inlineData.data };
  }
}

export function getDefaultProvider(apiKey: string): TryOnProvider {
  return new GeminiProvider(apiKey);
}

