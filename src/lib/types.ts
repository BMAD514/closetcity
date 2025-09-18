// Type definitions for closet.city

import type { PoseKey } from './constants';
export type { PoseKey };

export interface User {
  id: string;
  created_at: number;
}

export interface Garment {
  id: string;
  owner_id: string;
  title: string;
  brand: string;
  size: string;
  condition?: string;
  price_cents?: number;
  image_url: string;
  created_at: number;
}

export interface ListingMedia {
  id: string;
  listing_id: string;
  type: 'flatlay' | 'tryon';
  url: string;
  created_at: number;
}

export interface PoseCache {
  cache_key: string;
  image_url: string;
  prompt_version: string;
  created_at: number;
}

export interface ModelCache {
  cache_key: string;
  image_url: string;
  prompt_version: string;
  created_at: number;
}

export interface UploadRequest {
  file: File;
  kind: 'model' | 'garment';
}

export interface UploadResponse {
  url: string;
  success: boolean;
  error?: string;
}

export interface TryOnRequest {
  modelUrl: string;
  garmentUrl: string;
  poseKey: PoseKey;
  layerSig?: string; // included in cache key for layering signature
}

export interface TryOnResponse {
  url: string;
  cached: boolean;
  success: boolean;
  error?: string;
}

export interface PoseRequest {
  outfitUrl: string;
  poseKey: PoseKey;
  layerSig?: string;
}

export interface PoseResponse {
  url: string;
  cached: boolean;
  success: boolean;
  error?: string;
}

export interface ModelRequest {
  userImageUrl: string;
}

export interface ModelResponse {
  url: string;
  cached: boolean;
  success: boolean;
  error?: string;
}

export interface GeminiRequest {
  contents: Array<{
    text?: string;
    inlineData?: {
      data: string;
      mimeType: string;
    };
  }>;
}

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text?: string;
        inlineData?: {
          data: string;
          mimeType: string;
        };
      }>;
    };
  }>;
}

// Cloudflare bindings
export interface Env {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  DB: any; // D1Database - will be available at runtime
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  R2: any; // R2Bucket - will be available at runtime
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  RL_KV?: any; // KV Namespace for rate limiting (optional)
  GEMINI_API_KEY: string;
  PROMPT_VERSION: string;
  INVITE_CODE?: string;
}
