export interface GenerationMeta {
  cacheHit?: boolean;
  source?: string;
  durationMs?: number;
  promptVersion?: string;
  poseKey?: string;
  feedback?: {
    finishReason?: string | null;
    safetyRatings?: unknown;
    promptFeedback?: unknown;
    text?: string | null;
  } | null;
}

export interface WardrobeItem { id: string; name: string; url: string }
export interface OutfitLayer {
  garment: WardrobeItem | null;
  poseImages: Record<string, string>;
  poseMeta?: Record<string, GenerationMeta | undefined>;
}

export type StatusTone = 'info' | 'error';
export interface StatusMessage {
  tone: StatusTone;
  message: string;
}

