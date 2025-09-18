import Link from 'next/link';

function formatPrice(cents?: number) {
  const n = typeof cents === 'number' ? cents : 0;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n / 100);
}

export default function Card({ id, image, brand, title, price_cents }: { id: string; image: string; brand: string; title: string; price_cents?: number; }) {
  return (
    <Link href={`/product/${id}`} className="group block">
      <div className="aspect-[3/4] bg-neutral-100 overflow-hidden">
        <img src={image} alt={title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
      </div>
      <div className="mt-3 space-y-1">
        <div className="text-[11px] uppercase tracking-wider text-neutral-500">{brand}</div>
        <div className="text-sm leading-snug">{title}</div>
        <div className="text-sm">{formatPrice(price_cents)}</div>
      </div>
    </Link>
  );
}

