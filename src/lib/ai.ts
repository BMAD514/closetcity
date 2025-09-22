export class GeminiResponseError extends Error {
  code: string;
  details?: Record<string, unknown>;

  constructor(message: string, code = 'AI_FAILURE', details?: Record<string, unknown>) {
    super(message);
    this.name = 'GeminiResponseError';
    this.code = code;
    this.details = details;
  }
}

export interface GeminiFeedback {
  finishReason?: string | null;
  safetyRatings?: unknown;
  promptFeedback?: unknown;
  text?: string | null;
}

interface GeminiImagePart {
  inlineData?: { data?: string; mimeType?: string };
  text?: string;
}

interface GeminiCandidate {
  content?: { parts?: GeminiImagePart[] };
  finishReason?: string;
  safetyRatings?: unknown;
}

interface GeminiResponseShape {
  promptFeedback?: { blockReason?: string; blockReasonMessage?: string } | null;
  candidates?: GeminiCandidate[];
}

function collectText(candidate?: GeminiCandidate): string | null {
  const parts = candidate?.content?.parts;
  if (!Array.isArray(parts)) return null;
  const text = parts
    .map(part => (typeof part?.text === 'string' ? part.text : ''))
    .filter(Boolean)
    .join(' ')
    .trim();
  return text.length ? text : null;
}

export function parseGeminiImageResponse(json: unknown): { data: string; mimeType: string; feedback: GeminiFeedback } {
  const response = json as GeminiResponseShape | null;
  if (!response) {
    throw new GeminiResponseError('Gemini response was empty.', 'AI_EMPTY_RESPONSE');
  }

  const promptFeedback = response.promptFeedback ?? null;
  if (promptFeedback?.blockReason) {
    const reason = promptFeedback.blockReason;
    const messageParts = [
      'Gemini declined the request',
      reason ? `(${reason.toLowerCase()})` : null,
      promptFeedback.blockReasonMessage ?? null,
    ].filter(Boolean);
    throw new GeminiResponseError(messageParts.join(' '), 'AI_BLOCKED', { promptFeedback });
  }

  const candidates = Array.isArray(response.candidates) ? response.candidates : [];
  const candidateWithImage = candidates.find(candidate =>
    candidate?.content?.parts?.some(part => part?.inlineData?.data)
  );
  const candidate = candidateWithImage ?? candidates[0];
  const finishReason = candidate?.finishReason ?? null;
  const safetyRatings = candidate?.safetyRatings;
  const text = collectText(candidate);

  const partWithImage = candidate?.content?.parts?.find(part => part?.inlineData?.data);
  const inline = partWithImage?.inlineData;

  if (!inline?.data) {
    const pieces = [
      'Gemini did not return an image.',
      finishReason && finishReason !== 'STOP' ? `Finish reason: ${finishReason}.` : null,
      text ? `Model reply: ${text}` : null,
    ].filter(Boolean);
    throw new GeminiResponseError(pieces.join(' ').trim() || 'Gemini did not return an image.', 'AI_NO_IMAGE', {
      finishReason,
      promptFeedback,
      safetyRatings,
      text,
    });
  }

  return {
    data: inline.data,
    mimeType: inline.mimeType || 'image/webp',
    feedback: {
      finishReason,
      safetyRatings,
      promptFeedback,
      text,
    },
  };
}

export function summarizeGeminiFeedback(feedback?: GeminiFeedback | null) {
  if (!feedback) return null;
  const { finishReason, promptFeedback } = feedback;
  const parts: string[] = [];
  if (finishReason && finishReason !== 'STOP') parts.push(`finish: ${finishReason.toLowerCase()}`);
  const block = (promptFeedback as { blockReason?: string } | undefined)?.blockReason;
  if (block) parts.push(`block: ${block.toLowerCase()}`);
  return parts.length ? parts.join(' | ') : null;
}
