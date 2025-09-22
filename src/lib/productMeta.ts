/**
 * Lightweight merchandising metadata generator so API results inherit the chico.raoul atmosphere.
 */

export type ProductMeta = {
  category: string;
  rating: number;
  reviewCount: number;
  tagline: string;
};

export type MetaInput = {
  id: string;
  brand: string;
  title: string;
};

type BrandMeta = Partial<ProductMeta> & { category?: string };

const brandMeta: Record<string, BrandMeta> = {
  'Paul Smith': { category: 'Tailoring', tagline: 'London tailoring with an irreverent streak.' },
  'JW Anderson': { category: 'Statement', tagline: 'Sculptural color, born for the lens.' },
  'Burberry': { category: 'Outerwear', tagline: 'Heritage checks, remixed for the try-on floor.' },
  'Prada': { category: 'Tailoring', tagline: 'Church-quiet minimalism with runway bite.' },
  'Saint Laurent': { category: 'Statement', tagline: 'Night-out energy, razor-sharp lines.' },
  'Bottega Veneta': { category: 'Essentials', tagline: 'Italian essentials with stealth wealth energy.' },
  'Loewe': { category: 'Statement', tagline: 'Art-school volume, museum-grade craft.' },
  'Jacquemus': { category: 'Summer', tagline: 'Sun-ready silhouettes straight from Marseille.' },
};

const keywordCategories: { regex: RegExp; category: ProductMeta['category'] }[] = [
  { regex: /(coat|jacket|parka|trench|blouson)/i, category: 'Outerwear' },
  { regex: /(hoodie|sweater|knit|cardigan|crewneck)/i, category: 'Layering' },
  { regex: /(shirt|blouse|tee|top|polo)/i, category: 'Tailoring' },
  { regex: /(dress|gown|skirt)/i, category: 'Statement' },
  { regex: /(denim|jean|trouser|pant|short)/i, category: 'Denim' },
];

const fallbackTaglines = [
  'Fresh from the archive. Ready for the lens.',
  'Photoreal try-ons in under ten seconds.',
  'Curated pieces, modelled by you.',
  'Vault-kept, wardrobe-ready.'
];

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const hashString = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
};

export const getProductMeta = ({ id, brand, title }: MetaInput): ProductMeta => {
  const safeBrand = brand?.trim() || 'Archive';
  const safeTitle = title?.trim() || 'Piece';
  const brandInfo = brandMeta[safeBrand] || {};

  let category = brandInfo.category;
  if (!category) {
    const rule = keywordCategories.find(({ regex }) => regex.test(safeTitle) || regex.test(safeBrand));
    category = rule?.category || 'Archive';
  }

  const seed = hashString(`${safeBrand}-${safeTitle}-${id}`);
  const rating = Math.round((4.2 + (seed % 70) / 100) * 10) / 10; // rating range 4.2 - 4.9
  const reviewCount = 60 + (seed % 140);
  const tagline = brandInfo.tagline || fallbackTaglines[seed % fallbackTaglines.length];

  return {
    category,
    rating: clamp(rating, 4.2, 4.9),
    reviewCount,
    tagline,
  };
};
