import Link from "next/link";
import WelcomeMat from "@/components/WelcomeMat";

export default function Home() {
  return (
    <main className="mt-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="h1 mb-2">closet.city</h1>
        <p className="text-sm text-neutral-500 mb-8">invite-only editorial resale with virtual try-on</p>
        <div className="space-x-4">
          <Link href="/shop" className="inline-flex items-center border border-black px-6 py-3 text-sm uppercase tracking-wide hover:bg-black hover:text-white transition-colors">Shop</Link>
          <Link href="/dashboard" className="inline-flex items-center border border-black px-6 py-3 text-sm uppercase tracking-wide hover:bg-black hover:text-white transition-colors">Dashboard</Link>
        </div>
      </div>
      <WelcomeMat />
    </main>
  );
}
