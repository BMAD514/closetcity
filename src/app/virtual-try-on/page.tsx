export const runtime = 'edge';
import VirtualTryOnApp from '@/features/virtualtryon/app';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <main>
      <VirtualTryOnApp />
    </main>
  );
}


