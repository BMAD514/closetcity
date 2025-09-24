"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import * as API from './lib/api';
import type { GenerationMeta, StatusMessage, StatusTone, WardrobeItem, OutfitLayer } from './types';
import StartScreen from './components/StartScreen';
import WardrobePanel from './components/WardrobePanel';
import OutfitStack from './components/OutfitStack';
import Canvas from './components/Canvas';
import { loadProfile, saveProfile, clearProfile } from './lib/localStorage';
import Footer from './components/Footer';

const POSES = ['front','three_quarter','side','back'] as const;
const POSE_LABELS: Record<(typeof POSES)[number], string> = {
  front: 'Front',
  three_quarter: 'Three-quarter',
  side: 'Profile',
  back: 'Back',
};

export default function VirtualTryOnApp() {
  const [modelUrl, setModelUrl] = useState<string|null>(null);
  const [outfitHistory, setHistory] = useState<OutfitLayer[]>([]);
  const [currentIndex, setIdx] = useState(0);
  const [poseIndex, setPoseIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>([]);
  const [garmentFromProduct, setGarmentFromProduct] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusMessage | null>(null);
  const autoTriedRef = useRef(false);
  const statusTimer = useRef<number | null>(null);
  const announce = useCallback((tone: StatusTone, message: string, persist = false) => {
    if (typeof window !== 'undefined') {
      if (statusTimer.current) {
        window.clearTimeout(statusTimer.current);
        statusTimer.current = null;
      }
      setStatus({ tone, message });
      if (tone === 'info' && !persist) {
        statusTimer.current = window.setTimeout(() => {
          setStatus((prev) => (prev?.tone === 'info' ? null : prev));
        }, 4200);
      }
    } else {
      setStatus({ tone, message });
    }
  }, []);

  useEffect(() => () => {
    if (statusTimer.current && typeof window !== 'undefined') {
      window.clearTimeout(statusTimer.current);
      statusTimer.current = null;
    }
  }, []);  useEffect(() => {
    const stored = loadProfile();
    if (stored?.modelUrl) {
      setModelUrl(stored.modelUrl);
      setHistory(stored.outfitHistory ?? []);
      setIdx(Math.max(0, (stored.outfitHistory?.length ?? 1) - 1));
      setPoseIndex(0);
      announce('info', 'Picking up where you left off.');
    }
  }, [announce]);

  useEffect(() => {
    if (!modelUrl) {
      clearProfile();
      return;
    }
    saveProfile({ modelUrl, outfitHistory });
  }, [modelUrl, outfitHistory]);


  const describeMeta = useCallback((meta?: GenerationMeta | null) => {
    if (!meta) return null;
    if (meta.cacheHit) return 'Served from the archive';
    if (typeof meta.durationMs === 'number') return `Rendered in ${(meta.durationMs / 1000).toFixed(1)}s`;
    if (meta.source) return `Source: ${meta.source}`;
    return null;
  }, []);

  const metaMessage = useCallback((meta?: GenerationMeta | null, fallback = 'Look refreshed.') => {
    const descriptor = describeMeta(meta);
    if (!descriptor) return fallback;
    if (meta?.cacheHit) return `${descriptor}. Zero wait.`;
    return `${descriptor}. Fresh image.`;
  }, [describeMeta]);

  // Load wardrobe (live fallback local)
  useEffect(() => {
    API.fetchWardrobe().then(async (w) => {
      if (w.length) return setWardrobe(w);
      const m = await import('./wardrobe.local');
      setWardrobe(m.default);
    });
  }, []);

  // Read garmentUrl from search params on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const url = urlParams.get('garmentUrl');
      if (url) setGarmentFromProduct(url);
    }
  }, []);

  // Prepend "From product" garment if not already present
  useEffect(() => {
    if (!garmentFromProduct) return;
    const exists = wardrobe.some((w) => w.url === garmentFromProduct);
    if (!exists) {
      setWardrobe((prev) => [{ id: 'from-product', name: 'From product', url: garmentFromProduct }, ...prev]);
    }
  }, [garmentFromProduct, wardrobe]);

  const poseNames = useMemo(() => POSES.map((pose) => pose as string), []);

  const active = outfitHistory.slice(0, currentIndex + 1);
  const displayLayer = active[active.length - 1];
  const displayKey = POSES[poseIndex] as string;
  const displayImageUrl = displayLayer?.poseImages?.[displayKey] ?? null;
  const displayMeta = displayLayer?.poseMeta?.[displayKey];

  const handleUploadModel = useCallback(async (file: File) => {
    setLoading(true);
    announce('info', 'Tailoring your base model...');
    try {
      const { url } = await API.uploadFile(file, 'model');
      setModelUrl(url);
      const base: OutfitLayer = {
        garment: null,
        poseImages: { [POSES[0]]: url },
        poseMeta: { [POSES[0]]: { cacheHit: true, source: 'upload' } },
      };
      setHistory([base]);
      setIdx(0);
      setPoseIndex(0);
      announce('info', 'Studio double ready. Layer something on.');
    } catch (error) {
      announce('error', error instanceof Error ? error.message : 'Upload failed.', true);
    } finally {
      setLoading(false);
    }
  }, [announce]);

  const handleTryOn = useCallback(async (garment: WardrobeItem) => {
    if (!modelUrl) return;
    announce('info', `Styling ${garment.name}...`);
    setLoading(true);
    try {
      const base = outfitHistory[currentIndex];
      const poseKey = POSES[poseIndex] as string;
      const garmentUrl = garment.url;
      const sourceImage = base?.poseImages?.[poseKey] ?? modelUrl;
      const { url, meta } = await API.tryOn({ modelUrl: sourceImage, garmentUrl, poseKey });
      const next: OutfitLayer = { garment, poseImages: { [poseKey]: url }, poseMeta: { [poseKey]: meta } };
      const newHist = [...outfitHistory.slice(0, currentIndex + 1), next];
      setHistory(newHist);
      setIdx(newHist.length - 1);
      announce('info', metaMessage(meta, `Added ${garment.name}.`));
    } catch (error) {
      announce('error', error instanceof Error ? error.message : 'Try-on failed.', true);
    } finally { setLoading(false); }
  }, [modelUrl, outfitHistory, currentIndex, poseIndex, announce, metaMessage]);

  const handlePoseChange = useCallback(async (to: number) => {
    setPoseIndex(to);
    const current = outfitHistory[currentIndex];
    const key = POSES[to] as string;
    if (!current) return;
    if (current.poseImages[key]) {
      announce('info', `Viewing ${POSE_LABELS[POSES[to]]}.`);
      return;
    }
    setLoading(true);
    announce('info', `Reframing in ${POSE_LABELS[POSES[to]]}...`);
    try {
      const src = current.poseImages[POSES[0]] || modelUrl!;
      const { url, meta } = await API.pose({ outfitUrl: src, poseKey: key });
      const updatedLayer: OutfitLayer = {
        ...current,
        poseImages: { ...current.poseImages, [key]: url },
        poseMeta: { ...(current.poseMeta || {}), [key]: meta },
      };
      const nextHistory = [...outfitHistory];
      nextHistory[currentIndex] = updatedLayer;
      setHistory(nextHistory);
      announce('info', metaMessage(meta, 'Pose generated.'));
    } catch (error) {
      announce('error', error instanceof Error ? error.message : 'Pose generation failed.', true);
    } finally { setLoading(false); }
  }, [outfitHistory, currentIndex, modelUrl, announce, metaMessage]);

  // Optional: auto-try-on if model already uploaded and garmentUrl is present
  useEffect(() => {
    if (autoTriedRef.current) return;
    if (!modelUrl || !garmentFromProduct) return;
    const item = wardrobe.find((w) => w.url === garmentFromProduct) ?? { id: 'from-product', name: 'From product', url: garmentFromProduct };
    (async () => {
      setLoading(true);
      announce('info', 'Queuing the product look for you...');
      try {
        const base = outfitHistory[currentIndex];
        const poseKey = POSES[poseIndex] as string;
        const { url, meta } = await API.tryOn({ modelUrl: base?.poseImages?.[poseKey] ?? modelUrl, garmentUrl: item.url, poseKey });
        const next: OutfitLayer = { garment: item, poseImages: { [poseKey]: url }, poseMeta: { [poseKey]: meta } };
        const newHist = [...outfitHistory.slice(0, currentIndex + 1), next];
        setHistory(newHist);
        setIdx(newHist.length - 1);
        autoTriedRef.current = true;
        announce('info', metaMessage(meta, 'Look staged from the product page.'));
      } catch (error) {
        announce('error', error instanceof Error ? error.message : 'Auto try-on failed.', true);
      } finally { setLoading(false); }
    })();
  }, [modelUrl, garmentFromProduct, wardrobe, outfitHistory, currentIndex, poseIndex, announce, metaMessage]);

  return (
    <div className="min-h-dvh bg-white text-black">
      {!modelUrl ? (
        <StartScreen onUpload={handleUploadModel} loading={loading} />
      ) : (
        <div className="grid md:grid-cols-[1fr_360px]">
          <div className="p-6">
            <Canvas
              imageUrl={displayImageUrl}
              poses={poseNames}
              poseLabels={POSE_LABELS}
              poseIndex={poseIndex}
              onPoseChange={handlePoseChange}
              loading={loading}
              status={status}
              meta={displayMeta}
            />
          </div>
          <aside className="border-l p-4">
            <WardrobePanel items={wardrobe} onSelect={handleTryOn} />
            <OutfitStack
              layers={active}
              onUndo={() => {
                const nextIdx = Math.max(0, currentIndex - 1);
                setIdx(nextIdx);
                const key = POSES[poseIndex] as string;
                const layer = outfitHistory[nextIdx];
                const meta = layer?.poseMeta?.[key];
                if (layer) announce('info', metaMessage(meta, 'Rewound the look.'));
              }}
            />
          </aside>
        </div>
      )}
      <Footer />
    </div>
  );
}



