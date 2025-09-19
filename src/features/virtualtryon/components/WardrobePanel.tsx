"use client";

import React from 'react';
import { WardrobeItem } from '../types';

export default function WardrobePanel({ items, onSelect }: { items: WardrobeItem[]; onSelect: (g: WardrobeItem) => void }) {
  return (
    <div>
      <h3 className="text-sm uppercase tracking-wide mb-3">Wardrobe</h3>
      <ul className="grid grid-cols-2 gap-3">
        {items.map((g) => (
          <li key={g.id}>
            <button onClick={() => onSelect(g)} className="block text-left">
              <div className="border border-neutral-200 aspect-[4/5] mb-2 overflow-hidden">
                <img src={g.url} alt={g.name} className="w-full h-full object-cover" />
              </div>
              <div className="text-xs text-neutral-700 line-clamp-2">{g.name}</div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

