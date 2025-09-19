"use client";

import React from 'react';
import { OutfitLayer } from '../types';

export default function OutfitStack({ layers, onUndo }: { layers: OutfitLayer[]; onUndo: () => void }) {
  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm uppercase tracking-wide">Outfit</h3>
        <button onClick={onUndo} className="text-xs underline underline-offset-4 hover:opacity-80">Undo last</button>
      </div>
      <ol className="space-y-2 text-xs text-neutral-700">
        {layers.map((l, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-black" />
            <span>{l.garment ? l.garment.name : 'Base model'}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

