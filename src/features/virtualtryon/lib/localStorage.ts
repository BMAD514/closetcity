const KEY = 'vto.profile.v1';

import type { OutfitLayer } from '../types';

export interface StoredProfile {
  modelUrl: string | null;
  outfitHistory: OutfitLayer[];
}

export function loadProfile(): StoredProfile | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StoredProfile) : null;
  } catch {
    return null;
  }
}

export function saveProfile(p: StoredProfile) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {}
}

export function clearProfile() {
  try { localStorage.removeItem(KEY); } catch {}
}

