import Link from 'next/link';
import Container from './Container';

export default function Header() {
  return (
    <header className="border-b border-black/10">
      <Container className="flex items-center justify-between py-4">
        <Link href="/" className="text-xl font-semibold tracking-tight">closet.city</Link>
        <nav className="text-sm uppercase tracking-wide space-x-6">
          <Link href="/shop" className="hover:underline">Shop</Link>
          <Link href="/dashboard" className="hover:underline">Dashboard</Link>
        </nav>
      </Container>
    </header>
  );
}

