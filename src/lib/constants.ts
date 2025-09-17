// Constants and prompts for closet.city AI integration

export const PROMPT_VERSION = 'v1';

export const TRYON_PROMPT_V1 = `Task: Apply the provided garment image to the supplied model image.
- Replace visible clothing with the supplied garment.
- Preserve person identity, pose, and background.
- Preserve visible defects (pilling, fading) — do NOT beautify.
- Respect layering overlaps naturally (collars/hems).
- Match lighting, folds, and scale realistically.
Output image only. PromptVersion: ${PROMPT_VERSION}`;

export const POSE_PROMPT_TEMPLATE = (poseKey: string) => 
  `Regenerate from pose: ${poseKey}. Preserve person, current outfit, background & lighting. Keep materials/defects identical. Output image only. PromptVersion: ${PROMPT_VERSION}`;

export const POSE_KEYS = ['front', 'three_quarter', 'side', 'back'] as const;
export type PoseKey = typeof POSE_KEYS[number];

export const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent';

export const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export const API_TIMEOUT = 30000; // 30 seconds
