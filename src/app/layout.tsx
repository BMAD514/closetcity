import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

// Run the entire app on the Edge runtime (required for Cloudflare Pages)
export const runtime = 'nodejs';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "closet.city",
  description: "Invite-only editorial resale with virtual try-on.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-black`}>
        <Header />
        {children}
        <footer className="border-t border-black/10 mt-16 py-10 text-xs text-neutral-500">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            AI-assisted try-on—condition preserved; no brand affiliation.
          </div>
        </footer>
      </body>
    </html>
  );
}
