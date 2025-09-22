import Link from 'next/link';
import Container from './Container';

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/70 bg-white/80 backdrop-blur">
      <Container className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="text-2xl font-semibold uppercase tracking-[0.4em] text-stone-900">
          closet.city
        </Link>
        <nav className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.35em] text-stone-600">
          <Link href="/shop" className="rounded-full px-4 py-2 transition-colors duration-150 hover:bg-stone-900 hover:text-white">
            Closet
          </Link>
          <Link href="/virtual-try-on" className="rounded-full border border-stone-900 px-4 py-2 transition-colors duration-150 hover:bg-stone-900 hover:text-white">
            Try on
          </Link>
        </nav>
      </Container>
    </header>
  );
}
