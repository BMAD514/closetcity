export const runtime = 'edge';
import Container from '@/components/Container';
import Grid from '@/components/Grid';
import Card from '@/components/Card';

export const dynamic = 'force-dynamic';

export default async function ShopPage() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/garments`, { cache: 'no-store' });
  const data = await res.json();
  const items: Array<{ id: string; brand: string; title: string; price_cents?: number; image_url: string }>
    = data.items || [];

  return (
    <main className="mt-10">
      <Container>
        <h1 className="h1 mb-6">Shop</h1>
        <Grid>
          {items.map((g) => (
            <Card key={g.id} id={g.id} image={g.image_url} brand={g.brand} title={g.title} price_cents={g.price_cents} />
          ))}
        </Grid>
      </Container>
    </main>
  );
}


