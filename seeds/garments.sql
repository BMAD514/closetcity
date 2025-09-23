PRAGMA foreign_keys=OFF;
-- Refreshed closet.city boutique inventory seeded from local /inventory assets
BEGIN TRANSACTION;

DELETE FROM listing_media WHERE listing_id LIKE 'g-%';
DELETE FROM garments WHERE id LIKE 'g-%';

INSERT OR IGNORE INTO users (id) VALUES ('brent');

INSERT INTO garments (id, owner_id, title, brand, size, condition, price_cents, image_url)
VALUES
  ('g-bbc','brent','Astro Logo Hoodie','Billionaire Boys Club','L','Excellent',21500,'/inventory/bbc.webp'),
  ('g-burberry-rainbow','brent','Rainbow Vintage Check Shirt','Burberry','M','Very Good',52000,'/inventory/burberry-rainbow.webp'),
  ('g-burberry-tshirt','brent','Mythic Siren Graphic Tee','Burberry','L','Excellent',39000,'/inventory/burberry-tshirt.webp'),
  ('g-evolution-polo','brent','Evolution Short-Sleeve Polo','Lululemon','M','Excellent',8900,'/inventory/evolution-short-sleeve-polo-shirt.webp'),
  ('g-gucci-mask','brent','Mask Logo Fleece Hoodie','Gucci','L','Excellent',98000,'/inventory/gucci-mask.webp'),
  ('g-jw-hoodie','brent','Classic Logo Hoodie','JW Anderson','M','Excellent',55000,'/inventory/jw-hoodie.webp'),
  ('g-jwa-tee','brent','Anchor Crest Tee','JW Anderson','L','Excellent',31000,'/inventory/jwa-tshirt.webp'),
  ('g-balenciaga-trefoil','brent','Adidas Trefoil Oversized Tee','Balenciaga x Adidas','XL','Good',46000,'/inventory/p0.webp'),
  ('g-paul-smith-camp','brent','Lotus Cloud Camp Shirt','Paul Smith','L','Excellent',38000,'/inventory/paul-smith-camp.webp'),
  ('g-paul-smith-polo','brent','Signature Button Polo','Paul Smith','M','Excellent',25500,'/inventory/paul-smith-polo.webp'),
  ('g-siberia-hills','brent','Prince Graphic Tee','Siberia Hills','L','Loved',22000,'/inventory/siberia-hills.webp'),
  ('g-stussy-vest','brent','Chevron Knit Vest','Stussy','L','Very Good',18000,'/inventory/stussy-vest.webp');

INSERT INTO listing_media (id, listing_id, type, url)
VALUES
  ('m-bbc-flat-1','g-bbc','flatlay','/inventory/bbc.webp'),
  ('m-burberry-rainbow-flat-1','g-burberry-rainbow','flatlay','/inventory/burberry-rainbow.webp'),
  ('m-burberry-tshirt-flat-1','g-burberry-tshirt','flatlay','/inventory/burberry-tshirt.webp'),
  ('m-evolution-polo-flat-1','g-evolution-polo','flatlay','/inventory/evolution-short-sleeve-polo-shirt.webp'),
  ('m-gucci-mask-flat-1','g-gucci-mask','flatlay','/inventory/gucci-mask.webp'),
  ('m-jw-hoodie-flat-1','g-jw-hoodie','flatlay','/inventory/jw-hoodie.webp'),
  ('m-jwa-tee-flat-1','g-jwa-tee','flatlay','/inventory/jwa-tshirt.webp'),
  ('m-balenciaga-trefoil-flat-1','g-balenciaga-trefoil','flatlay','/inventory/p0.webp'),
  ('m-paul-smith-camp-flat-1','g-paul-smith-camp','flatlay','/inventory/paul-smith-camp.webp'),
  ('m-paul-smith-polo-flat-1','g-paul-smith-polo','flatlay','/inventory/paul-smith-polo.webp'),
  ('m-siberia-hills-flat-1','g-siberia-hills','flatlay','/inventory/siberia-hills.webp'),
  ('m-stussy-vest-flat-1','g-stussy-vest','flatlay','/inventory/stussy-vest.webp');

INSERT INTO listing_media (id, listing_id, type, url)
VALUES
  ('m-bbc-look-1','g-bbc','tryon','/inventory/bbc.webp'),
  ('m-burberry-rainbow-look-1','g-burberry-rainbow','tryon','/inventory/burberry-rainbow.webp'),
  ('m-burberry-tshirt-look-1','g-burberry-tshirt','tryon','/inventory/burberry-tshirt.webp'),
  ('m-evolution-polo-look-1','g-evolution-polo','tryon','/inventory/evolution-short-sleeve-polo-shirt.webp'),
  ('m-gucci-mask-look-1','g-gucci-mask','tryon','/inventory/gucci-mask.webp'),
  ('m-jw-hoodie-look-1','g-jw-hoodie','tryon','/inventory/jw-hoodie.webp'),
  ('m-jwa-tee-look-1','g-jwa-tee','tryon','/inventory/jwa-tshirt.webp'),
  ('m-balenciaga-trefoil-look-1','g-balenciaga-trefoil','tryon','/inventory/p0.webp'),
  ('m-paul-smith-camp-look-1','g-paul-smith-camp','tryon','/inventory/paul-smith-camp.webp'),
  ('m-paul-smith-polo-look-1','g-paul-smith-polo','tryon','/inventory/paul-smith-polo.webp'),
  ('m-siberia-hills-look-1','g-siberia-hills','tryon','/inventory/siberia-hills.webp'),
  ('m-stussy-vest-look-1','g-stussy-vest','tryon','/inventory/stussy-vest.webp');

COMMIT;
PRAGMA foreign_keys=ON;
