"use client";

import React from "react";

interface BeforeAfterSliderProps {
  beforeUrl: string;
  afterUrl: string;
  alt?: string;
}

export default function BeforeAfterSlider({ beforeUrl, afterUrl, alt = "Before/After" }: BeforeAfterSliderProps) {
  const [pos, setPos] = React.useState(50); // percentage

  return (
    <div className="relative w-full max-w-xl mx-auto select-none">
      <div className="relative w-full overflow-hidden border border-neutral-200">
        <img src={beforeUrl} alt={alt} className="block w-full h-auto object-contain" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ width: `${pos}%` }}>
          <img src={afterUrl} alt={alt} className="block w-full h-auto object-contain" />
        </div>
        <div className="absolute inset-y-0" style={{ left: `${pos}%` }}>
          <div className="-ml-0.5 h-full w-1 bg-black/70" />
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label="Comparison slider"
        className="mt-3 w-full"
      />
    </div>
  );
}

