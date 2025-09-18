"use client";

import React from 'react';

export default function Canvas({ imageUrl, poses, poseIndex, onPoseChange, loading }: { imageUrl: string | null; poses: string[]; poseIndex: number; onPoseChange: (to: number) => void; loading: boolean }) {
  return (
    <div>
      <div className="border border-neutral-200 aspect-[4/5] w-full max-w-xl mx-auto grid place-items-center bg-white">
        {imageUrl ? (
          <img src={imageUrl} alt="Outfit" className="w-full h-full object-contain" />
        ) : (
          <div className="text-neutral-400 text-sm">No image yet</div>
        )}
      </div>
      <div className="flex items-center justify-center gap-3 mt-4">
        {poses.map((p, idx) => (
          <button key={p} onClick={() => onPoseChange(idx)} disabled={loading} className={`text-xs uppercase tracking-wide border px-3 py-1 ${idx===poseIndex ? 'bg-black text-white border-black' : 'border-black hover:bg-black hover:text-white'}`}>
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

