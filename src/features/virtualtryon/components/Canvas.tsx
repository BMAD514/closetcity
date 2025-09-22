"use client";

import React, { useMemo } from 'react';
import type { GenerationMeta, StatusMessage } from '../types';

interface Props {
  imageUrl: string | null;
  poses: string[];
  poseLabels: Record<string, string>;
  poseIndex: number;
  onPoseChange: (to: number) => void;
  loading: boolean;
  status: StatusMessage | null;
  meta?: GenerationMeta | null;
}

function formatMeta(meta?: GenerationMeta | null) {
  if (!meta) return null;
  if (meta.cacheHit) return 'Archive pull, 0s';
  if (typeof meta.durationMs === 'number') return `Rendered in ${(meta.durationMs / 1000).toFixed(1)}s`;
  if (meta.source) return `Source: ${meta.source}`;
  return null;
}

function formatPoseLabel(label: string) {
  return label.replace(/_/g, ' ');
}

export default function Canvas({ imageUrl, poses, poseLabels, poseIndex, onPoseChange, loading, status, meta }: Props) {
  const metaNote = useMemo(() => formatMeta(meta), [meta]);

  return (
    <div>
      <div className="relative border border-neutral-200 aspect-[4/5] w-full max-w-xl mx-auto grid place-items-center bg-white overflow-hidden">
        {imageUrl ? (
          <img src={imageUrl} alt="Outfit" className="w-full h-full object-contain" />
        ) : (
          <div className="text-neutral-400 text-sm">Cue up a look to preview it here.</div>
        )}
        {loading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] flex flex-col items-center justify-center gap-2 text-neutral-600 text-xs uppercase tracking-[0.3em]">
            <span>Rendering</span>
          </div>
        )}
        {status && (
          <div className={`absolute left-3 top-3 max-w-[80%] rounded-full border px-3 py-1 text-xs ${status.tone === 'error' ? 'border-red-400 text-red-600 bg-white/95' : 'border-neutral-300 text-neutral-600 bg-white/80'}`}>
            {status.message}
          </div>
        )}
        {metaNote && (
          <div className="absolute left-3 bottom-3 rounded-full border border-neutral-200 bg-white/85 px-3 py-1 text-[11px] text-neutral-500 uppercase tracking-[0.3em]">
            {metaNote}
          </div>
        )}
      </div>
      <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
        {poses.map((pose, idx) => (
          <button
            key={pose}
            onClick={() => onPoseChange(idx)}
            disabled={loading}
            className={`text-xs uppercase tracking-wide border px-3 py-1 transition-colors ${idx === poseIndex ? 'bg-black text-white border-black' : 'border-black hover:bg-black hover:text-white disabled:opacity-60'}`}
          >
            {poseLabels[pose] || formatPoseLabel(pose)}
          </button>
        ))}
      </div>
    </div>
  );
}


