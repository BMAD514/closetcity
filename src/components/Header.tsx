import Link from "next/link";
import Container from "./Container";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-white">
      <Container className="flex items-center justify-between py-6">
        <Link href="/" className="font-mono text-xs lowercase tracking-[0.6em] text-black transition-opacity hover:opacity-70">
          closet.city
        </Link>
      </Container>
    </header>
  );
}
