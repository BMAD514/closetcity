// Constants and prompts for closet.city AI integration

export const PROMPT_VERSION = 'v1';

export const TRYON_PROMPT_V1 = `Task: Apply the provided garment image to the supplied model image.
- Replace visible clothing with the supplied garment.
- Preserve person identity, pose, and background.
- Preserve visible defects (pilling, fading) — do NOT beautify.
- Respect layering overlaps naturally (collars/hems).
- Match lighting, folds, and scale realistically.
Output image only. PromptVersion: ${PROMPT_VERSION}`;

// AI Studio-aligned prompts (V2)
export const MODEL_PROMPT_V2 = `Transform the person into a full-body fashion model photo.
Background: clean neutral studio (#f0f0f0).
Subject: neutral, professional model expression; preserve identity, unique features, and body type; standard relaxed standing pose.
Return ONLY the final image. PromptVersion: ${PROMPT_VERSION}`;

export const TRYON_PROMPT_V2 = `You MUST completely REMOVE and REPLACE the current clothing with the provided garment.
Preserve the person's face, hair, body shape, and pose unchanged. Preserve the entire background perfectly.
Realistically fit the new garment to the person (natural folds, shadows, and lighting; correct scale/alignment).
Return ONLY the final image. PromptVersion: ${PROMPT_VERSION}`;

export const POSE_PROMPT_TEMPLATE = (poseKey: string) => 
  `Regenerate from pose: ${poseKey}. Preserve person, current outfit, background & lighting. Keep materials/defects identical. Output image only. PromptVersion: ${PROMPT_VERSION}`;

export const POSE_KEYS = ['front', 'three_quarter', 'side', 'back'] as const;
export type PoseKey = typeof POSE_KEYS[number];

export const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent';

export const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export const API_TIMEOUT = 30000; // 30 seconds
