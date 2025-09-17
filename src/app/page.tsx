import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-8">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">
            closet.city
          </h1>
          <div className="inline-block bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium">
            alpha build
          </div>
        </div>

        <p className="text-xl text-gray-600 mb-8 leading-relaxed">
          Virtual try-on for resale fashion. Upload your model photo and garments,
          then see how they look together with AI-powered visualization.
        </p>

        <div className="space-y-4">
          <Link
            href="/dashboard"
            className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-8 rounded-lg transition-colors duration-200 text-lg"
          >
            Go to Dashboard
          </Link>

          <div className="text-sm text-gray-500">
            Start by uploading a model photo and garment images
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-purple-600 font-semibold mb-2">1. Upload</div>
            <div className="text-gray-600">Upload model photos and garment flat-lays</div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-purple-600 font-semibold mb-2">2. Try On</div>
            <div className="text-gray-600">AI generates realistic try-on images</div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-purple-600 font-semibold mb-2">3. Pose</div>
            <div className="text-gray-600">Generate different poses and angles</div>
          </div>
        </div>
      </div>
    </div>
  );
}
