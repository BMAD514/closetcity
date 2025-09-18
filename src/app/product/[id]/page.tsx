export const runtime = 'edge';
import Container from '@/components/Container';
import Link from 'next/link';

function formatPrice(cents?: number) {
  const n = typeof cents === 'number' ? cents : 0;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n / 100);
}

export const dynamic = 'force-dynamic';

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await fetch(`/api/garments/${id}`, { cache: 'no-store' });
  if (!res.ok) {
    return (
      <main className="mt-10">
        <Container>
          <p className="text-sm text-neutral-500">Not found.</p>
        </Container>
      </main>
    );
  }
  const data = await res.json();
  const item = data.item as { id: string; brand: string; title: string; size?: string; condition?: string | null; price_cents?: number; image_url: string };
  const media = data.media as { flatlay: string[]; tryon: string[] };

  const imagesFlat = media.flatlay?.length ? media.flatlay : [item.image_url];
  const imagesTryon = media.tryon || [];
  const bestImageUrl = (imagesTryon[0] || imagesFlat[0] || item.image_url) as string;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: item.title,
    brand: { '@type': 'Brand', name: item.brand },
    image: [...imagesFlat, ...imagesTryon],
    offers: {
      '@type': 'Offer',
      priceCurrency: 'USD',
      price: (item.price_cents ?? 0) / 100,
      availability: 'https://schema.org/InStock',
      url: `https://closet.city/product/${id}`,
    },
  };

  return (
    <main className="mt-10">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-8">
            <section>
              <h2 className="h3 mb-3">Flat-lay</h2>
              <div className="grid grid-cols-2 gap-3">
                {imagesFlat.map((src: string, i: number) => (
                  <div key={i} className="bg-neutral-100">
                    <img src={src} alt={`${item.title} flat ${i+1}`} className="w-full h-auto object-cover" />
                  </div>
                ))}
              </div>
            </section>

            {imagesTryon.length > 0 && (
              <section>
                <h2 className="h3 mb-3">Try-on</h2>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {imagesTryon.map((src: string, i: number) => (
                    <div key={i} className="min-w-[220px] bg-neutral-100">
                      <img src={src} alt={`${item.title} try-on ${i+1}`} className="w-full h-auto object-cover" />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-6">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-neutral-500">{item.brand}</div>
              <h1 className="h1 mt-1">{item.title}</h1>
            </div>
            <div className="text-sm text-neutral-700 space-y-1">
              {item.size && <div>Size: {item.size}</div>}
              {item.condition && <div>Condition: {item.condition}</div>}
            </div>
            <div className="text-lg">{formatPrice(item.price_cents)}</div>
            <Link href={`/virtual-try-on?garmentUrl=${encodeURIComponent(bestImageUrl)}`} className="inline-flex items-center justify-center border border-black px-6 py-3 text-sm uppercase tracking-wide hover:bg-black hover:text-white transition-colors">
              Try this on
            </Link>
            <button className="mt-3 inline-flex items-center justify-center border border-neutral-300 px-6 py-3 text-sm uppercase tracking-wide hover:bg-neutral-900 hover:text-white transition-colors">Buy</button>
            <p className="text-xs text-neutral-500">Stripe Checkout: TODO</p>
          </aside>
        </div>
      </Container>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </main>
  );
}

