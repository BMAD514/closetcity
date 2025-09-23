import Link from "next/link";
import { motion } from "framer-motion";
import { getProductMeta } from "@/lib/productMeta";

function formatPrice(cents?: number) {
  const n = typeof cents === "number" ? cents : 0;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n / 100);
}

const cardVariants = {
  rest: { y: 0 },
  hover: { y: -6 },
};

const imageVariants = {
  rest: { scale: 1, filter: "grayscale(100%)" },
  hover: { scale: 1.04, filter: "grayscale(0%)" },
};

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

  return (
    <Link
      href={`/product/${id}`}
      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-4"
    >
      <motion.article
        initial="rest"
        animate="rest"
        whileHover="hover"
        variants={cardVariants}
        className="group flex h-full flex-col gap-4 border border-black/10 bg-white p-6 transition-colors duration-300 hover:border-black hover:bg-black hover:text-white"
      >
        <motion.div
          className="aspect-[3/4] overflow-hidden"
          variants={imageVariants}
          transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
        >
          <img src={image} alt={title} className="h-full w-full object-cover" loading="lazy" />
        </motion.div>
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.5em] text-black/70 group-hover:text-white/70">
            {brand}
          </span>
          <h3 className="font-serif text-xl leading-tight">{title}</h3>
          <p className="text-xs text-black/60 group-hover:text-white/70">{meta.tagline}</p>
        </div>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="font-mono text-xs uppercase tracking-[0.4em]">{formatPrice(price_cents)}</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-black/50 group-hover:text-white/50">
            try on
          </span>
        </div>
      </motion.article>
    </Link>
  );
}
