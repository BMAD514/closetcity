import Link from 'next/link';
import { motion } from 'framer-motion';
import { getProductMeta } from '@/lib/productMeta';

function formatPrice(cents?: number) {
  const n = typeof cents === 'number' ? cents : 0;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n / 100);
}

const cardVariants = {
  rest: { y: 0, scale: 1, boxShadow: '0 0 0 rgba(0,0,0,0)' },
  hover: { y: -6, scale: 1.01, boxShadow: '0 18px 35px rgba(15,23,42,0.08)' },
};

const imageVariants = {
  rest: { scale: 1 },
  hover: { scale: 1.03 },
};

function Star({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={`h-4 w-4 transition-colors ${filled ? 'text-stone-900' : 'text-stone-300'}`}
      role="presentation"
    >
      <path
        d="M12 17.3 6.8 20l1-5.9L3.7 9.6l5.9-.9L12 3l2.4 5.7 5.9.9-4.1 4.5 1 5.9z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function Card({
  id,
  image,
  brand,
  title,
  price_cents,
}: {
  id: string;
  image: string;
  brand: string;
  title: string;
  price_cents?: number;
}) {
  const meta = getProductMeta({ id, brand, title });
  const reviewSnapshot = `${meta.rating.toFixed(1)} (${meta.reviewCount})`;

  return (
    <Link href={`/product/${id}`} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2">
      <motion.article initial="rest" animate="rest" whileHover="hover" variants={cardVariants} className="rounded-2xl bg-white p-4 transition-transform duration-300 ease-out">
        <motion.div className="overflow-hidden rounded-xl bg-stone-100 aspect-[3/4]" variants={imageVariants}>
          <img src={image} alt={title} className="h-full w-full object-cover" loading="lazy" />
        </motion.div>
        <div className="mt-4 flex flex-col gap-2">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.3em] text-stone-500">
            <span className="truncate">{brand}</span>
            <span className="rounded-full bg-stone-200 px-2 py-1 text-[10px] font-semibold tracking-[0.15em] text-stone-600">
              {meta.category}
            </span>
          </div>
          <div>
            <h3 className="text-sm font-medium leading-snug text-stone-900 md:text-base">{title}</h3>
            <p className="mt-1 text-xs text-stone-500">{meta.tagline}</p>
          </div>
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star key={index} filled={meta.rating >= index + 0.7} />
              ))}
              <span className="ml-1 text-xs text-stone-500">{reviewSnapshot}</span>
            </div>
            <div className="text-sm font-semibold tracking-tight text-stone-900">{formatPrice(price_cents)}</div>
          </div>
        </div>
      </motion.article>
    </Link>
  );
}
