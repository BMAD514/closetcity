-- Sample garments for closet.city boutique seeding

DELETE FROM listing_media WHERE listing_id IN (
  'g-midnight-smoking',
  'g-parker-slip',
  'g-oxford-softened',
  'g-tweed-rowhouse',
  'g-puddle-trouser',
  'g-cropped-moto'
);

DELETE FROM garments WHERE id IN (
  'g-midnight-smoking',
  'g-parker-slip',
  'g-oxford-softened',
  'g-tweed-rowhouse',
  'g-puddle-trouser',
  'g-cropped-moto'
);

INSERT OR IGNORE INTO users (id) VALUES ('brent');

INSERT INTO garments (id, owner_id, title, brand, size, condition, price_cents, image_url)
VALUES
  ('g-midnight-smoking','brent','Le Smoking Midnight Blazer','Saint Laurent','FR 38','Loved',145000,'https://images.unsplash.com/photo-1525171254930-643fc658b64d?auto=format&fit=max&w=1200&q=80'),
  ('g-parker-slip','brent','Bias-Cut Mercury Slip','The Row','S','Excellent',88000,'https://images.unsplash.com/photo-1475180098004-ca77a66827be?auto=format&fit=max&w=1200&q=80'),
  ('g-oxford-softened','brent','Rumpled Men''s Oxford','Comme des Garcons Homme','M','Softened',32000,'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=max&w=1200&q=80'),
  ('g-tweed-rowhouse','brent','City Tweed Car Coat','Dries Van Noten','M','Excellent',129000,'https://images.unsplash.com/photo-1523380744952-b1f4a5c06c37?auto=format&fit=max&w=1200&q=80'),
  ('g-puddle-trouser','brent','Puddle Hem Tux Trouser','Haider Ackermann','IT 48','Tailored',74000,'https://images.unsplash.com/photo-1521120098171-620d94c2c287?auto=format&fit=max&w=1200&q=80'),
  ('g-cropped-moto','brent','Black Cropped Moto','Helmut Lang Archive','S','Loved',99000,'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=max&w=1200&q=80');

INSERT INTO listing_media (id, listing_id, type, url)
VALUES
  ('m-midnight-flat-1','g-midnight-smoking','flatlay','https://images.unsplash.com/photo-1525171254930-643fc658b64d?auto=format&fit=max&w=1200&q=80'),
  ('m-midnight-try-1','g-midnight-smoking','tryon','https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=max&w=1200&q=80'),
  ('m-parker-flat-1','g-parker-slip','flatlay','https://images.unsplash.com/photo-1475180098004-ca77a66827be?auto=format&fit=max&w=1200&q=80'),
  ('m-parker-try-1','g-parker-slip','tryon','https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=max&w=1200&q=80'),
  ('m-oxford-flat-1','g-oxford-softened','flatlay','https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=max&w=1200&q=80'),
  ('m-oxford-try-1','g-oxford-softened','tryon','https://images.unsplash.com/photo-1463100099107-aa0980c362e6?auto=format&fit=max&w=1200&q=80'),
  ('m-tweed-flat-1','g-tweed-rowhouse','flatlay','https://images.unsplash.com/photo-1523380744952-b1f4a5c06c37?auto=format&fit=max&w=1200&q=80'),
  ('m-tweed-try-1','g-tweed-rowhouse','tryon','https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=max&w=1200&q=80'),
  ('m-trouser-flat-1','g-puddle-trouser','flatlay','https://images.unsplash.com/photo-1521120098171-620d94c2c287?auto=format&fit=max&w=1200&q=80'),
  ('m-trouser-try-1','g-puddle-trouser','tryon','https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=max&w=1200&q=80'),
  ('m-moto-flat-1','g-cropped-moto','flatlay','https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=max&w=1200&q=80'),
  ('m-moto-try-1','g-cropped-moto','tryon','https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=max&w=1200&q=80');


