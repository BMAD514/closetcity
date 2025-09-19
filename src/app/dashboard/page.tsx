'use client';

import { useState } from 'react';
import Link from 'next/link';
import { POSE_KEYS } from '@/lib/constants';
import type { PoseKey, UploadResponse, TryOnResponse, PoseResponse } from '@/lib/types';

export default function Dashboard() {
  const [modelUrl, setModelUrl] = useState('');
  const [garmentUrl, setGarmentUrl] = useState('');
  const [tryOnResult, setTryOnResult] = useState('');
  const [poseResult, setPoseResult] = useState('');
  const [selectedPose, setSelectedPose] = useState<PoseKey>('front');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileUpload = async (file: File, kind: 'model' | 'garment') => {
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('kind', kind);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data: UploadResponse = await response.json();

      if (data.success) {
        if (kind === 'model') {
          setModelUrl(data.url);
        } else {
          setGarmentUrl(data.url);
        }
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch (err) {
      setError('Upload failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleTryOn = async () => {
    if (!modelUrl || !garmentUrl) {
      setError('Please upload both model and garment images first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/tryon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modelUrl,
          garmentUrl,
          poseKey: selectedPose,
        }),
      });

      const data: TryOnResponse = await response.json();

      if (data.success) {
        setTryOnResult(data.url);
        console.log(`Try-on ${data.cached ? 'cached' : 'generated'}`);
      } else {
        setError(data.error || 'Try-on failed');
      }
    } catch (err) {
      setError('Try-on failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handlePoseChange = async (newPose: PoseKey) => {
    if (!tryOnResult) {
      setError('Please generate a try-on result first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/pose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          outfitUrl: tryOnResult,
          poseKey: newPose,
        }),
      });

      const data: PoseResponse = await response.json();

      if (data.success) {
        setPoseResult(data.url);
        setSelectedPose(newPose);
        console.log(`Pose ${data.cached ? 'cached' : 'generated'}`);
      } else {
        setError(data.error || 'Pose generation failed');
      }
    } catch (err) {
      setError('Pose generation failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <Link href="/" className="underline underline-offset-4 hover:opacity-80 mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Upload images and generate virtual try-ons</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-4">1. Upload Model Photo</h2>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, 'model');
                }}
                className="block w-full text-sm text-neutral-700 file:mr-4 file:py-2 file:px-4 file:rounded file:border file:border-black file:text-sm file:uppercase file:tracking-wide file:bg-neutral-100 file:text-black hover:file:bg-neutral-200"
                disabled={loading}
              />
              {modelUrl && (
                <div className="mt-4">
                  <img src={modelUrl} alt="Model" className="w-32 h-32 object-cover rounded" />
                  <p className="text-sm text-green-600 mt-2">✓ Model uploaded</p>
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-4">2. Upload Garment</h2>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, 'garment');
                }}
                className="block w-full text-sm text-neutral-700 file:mr-4 file:py-2 file:px-4 file:rounded file:border file:border-black file:text-sm file:uppercase file:tracking-wide file:bg-neutral-100 file:text-black hover:file:bg-neutral-200"
                disabled={loading}
              />
              {garmentUrl && (
                <div className="mt-4">
                  <img src={garmentUrl} alt="Garment" className="w-32 h-32 object-cover rounded" />
                  <p className="text-sm text-green-600 mt-2">✓ Garment uploaded</p>
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-4">3. Select Pose</h2>
              <div className="grid grid-cols-2 gap-2">
                {POSE_KEYS.map((pose) => (
                  <button
                    key={pose}
                    onClick={() => setSelectedPose(pose)}
                    className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                      selectedPose === pose
                        ? 'bg-black text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    disabled={loading}
                  >
                    {pose.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleTryOn}
              disabled={loading || !modelUrl || !garmentUrl}
              className="w-full bg-black hover:bg-black/80 disabled:bg-gray-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {loading ? 'Generating...' : 'Generate Try-On'}
            </button>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {tryOnResult && (
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Try-On Result</h2>
                <img src={tryOnResult} alt="Try-on result" className="w-full max-w-md mx-auto rounded" />
                
                <div className="mt-4">
                  <h3 className="font-medium mb-2">Change Pose:</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {POSE_KEYS.map((pose) => (
                      <button
                        key={pose}
                        onClick={() => handlePoseChange(pose)}
                        className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                        disabled={loading}
                      >
                        {pose.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {poseResult && (
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Pose Result</h2>
                <img src={poseResult} alt="Pose result" className="w-full max-w-md mx-auto rounded" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
