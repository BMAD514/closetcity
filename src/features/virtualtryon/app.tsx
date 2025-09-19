"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import * as API from './lib/api';
import { WardrobeItem, OutfitLayer } from './types';
import StartScreen from './components/StartScreen';
import WardrobePanel from './components/WardrobePanel';
import OutfitStack from './components/OutfitStack';
import Canvas from './components/Canvas';
import Footer from './components/Footer';

const POSES = ['front','three_quarter','side','back'] as const;

export default function VirtualTryOnApp() {
  const [modelUrl, setModelUrl] = useState<string|null>(null);
  const [outfitHistory, setHistory] = useState<OutfitLayer[]>([]);
  const [currentIndex, setIdx] = useState(0);
  const [poseIndex, setPoseIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>([]);
  const [garmentFromProduct, setGarmentFromProduct] = useState<string | null>(null);
  const autoTriedRef = useRef(false);
  const params = useSearchParams();

  // Load wardrobe (live → fallback local)
  useEffect(() => {
    API.fetchWardrobe().then(async (w) => {
      if (w.length) return setWardrobe(w);
      const m = await import('./wardrobe.local');
      setWardrobe(m.default);
    });
  }, []);

  // Read garmentUrl from search params on mount
  useEffect(() => {
    const url = params.get('garmentUrl');
    if (url) setGarmentFromProduct(url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Prepend "From product" garment if not already present
  useEffect(() => {
    if (!garmentFromProduct) return;
    const exists = wardrobe.some((w) => w.url === garmentFromProduct);
    if (!exists) {
      setWardrobe((prev) => [{ id: 'from-product', name: 'From product', url: garmentFromProduct }, ...prev]);
    }
  }, [garmentFromProduct, wardrobe]);

  const active = outfitHistory.slice(0, currentIndex + 1);
  const displayImageUrl = useMemo(() => {
    const layer = active[active.length - 1];
    const key = POSES[poseIndex] as string;
    return layer?.poseImages?.[key] ?? null;
  }, [active, poseIndex]);

  const handleUploadModel = useCallback(async (file: File) => {
    setLoading(true);
    try {
      const { url } = await API.uploadFile(file, 'model');
      setModelUrl(url);
      setHistory([{ garment: null, poseImages: { [POSES[0]]: url } }]);
      setIdx(0);
      setPoseIndex(0);
    } finally { setLoading(false); }
  }, []);

  const handleTryOn = useCallback(async (garment: WardrobeItem) => {
    if (!modelUrl) return;
    setLoading(true);
    try {
      const base = outfitHistory[currentIndex];
      const poseKey = POSES[poseIndex] as string;
      const garmentUrl = garment.url;
      const { url } = await API.tryOn({ modelUrl: base?.poseImages?.[poseKey] ?? modelUrl, garmentUrl, poseKey });
      const next: OutfitLayer = { garment, poseImages: { [poseKey]: url } };
      const newHist = [...outfitHistory.slice(0, currentIndex + 1), next];
      setHistory(newHist);
      setIdx(newHist.length - 1);
    } finally { setLoading(false); }
  }, [modelUrl, outfitHistory, currentIndex, poseIndex]);

  const handlePoseChange = useCallback(async (to: number) => {
    setPoseIndex(to);
    const current = outfitHistory[currentIndex];
    const key = POSES[to] as string;
    if (!current || current.poseImages[key]) return;
    setLoading(true);
    try {
      const src = current.poseImages[POSES[0]] || modelUrl!;
      const { url } = await API.pose({ outfitUrl: src, poseKey: key });
      current.poseImages[key] = url;
      setHistory([...outfitHistory]);
    } finally { setLoading(false); }
  }, [outfitHistory, currentIndex, modelUrl]);

  // Optional: auto-try-on if model already uploaded and garmentUrl is present
  useEffect(() => {
    if (autoTriedRef.current) return;
    if (!modelUrl || !garmentFromProduct) return;
    const item = wardrobe.find((w) => w.url === garmentFromProduct) ?? { id: 'from-product', name: 'From product', url: garmentFromProduct };
    (async () => {
      setLoading(true);
      try {
        const base = outfitHistory[currentIndex];
        const poseKey = POSES[poseIndex] as string;
        const { url } = await API.tryOn({ modelUrl: base?.poseImages?.[poseKey] ?? modelUrl, garmentUrl: item.url, poseKey });
        const next: OutfitLayer = { garment: item, poseImages: { [poseKey]: url } };
        const newHist = [...outfitHistory.slice(0, currentIndex + 1), next];
        setHistory(newHist);
        setIdx(newHist.length - 1);
        autoTriedRef.current = true;
      } finally { setLoading(false); }
    })();
  }, [modelUrl, garmentFromProduct, wardrobe, outfitHistory, currentIndex, poseIndex]);

  return (
    <div className="min-h-dvh bg-white text-black">
      {!modelUrl ? (
        <StartScreen onUpload={handleUploadModel} loading={loading} />
      ) : (
        <div className="grid md:grid-cols-[1fr_360px]">
          <div className="p-6">
            <Canvas imageUrl={displayImageUrl} poses={POSES as unknown as string[]} poseIndex={poseIndex} onPoseChange={handlePoseChange} loading={loading} />
          </div>
          <aside className="border-l p-4">
            <WardrobePanel items={wardrobe} onSelect={handleTryOn} />
            <OutfitStack layers={active} onUndo={() => setIdx(Math.max(0, currentIndex - 1))} />
          </aside>
        </div>
      )}
      <Footer />
    </div>
  );
}

