import type { Metadata } from "next";
import { Space_Mono, Instrument_Serif, Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Link from "next/link";

export const runtime = "nodejs";

const spaceMono = Space_Mono({ subsets: ["latin"], variable: "--font-space-mono", weight: ["400", "700"] });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const instrument = Instrument_Serif({ subsets: ["latin"], variable: "--font-instrument-serif", weight: ["400"] });

export const metadata: Metadata = {
  title: "closet.city",
  description: "Underground artist beta. Curated garments, experimental AI fitting room.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const year = new Date().getFullYear();

  return (
    <html lang="en">
      <body className={`${spaceMono.variable} ${inter.variable} ${instrument.variable} bg-white text-black antialiased`}>
        <Header />
        <main className="min-h-[70vh]">{children}</main>
        <footer className="border-t border-black/10 py-12">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 text-xs uppercase tracking-[0.4em] text-black">
            <span className="font-mono lowercase">closet.city © {year}</span>
            <Link href="/manifesto" className="font-mono lowercase transition-opacity hover:opacity-70">
              manifesto
            </Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
