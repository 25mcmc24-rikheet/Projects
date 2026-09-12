-- Demo data for ScholarShop. Passwords below are for "Hunter2!" hashed with bcrypt cost 12.
-- Email domains used here must match your ALLOWED_EMAIL_DOMAINS setting.

INSERT INTO users (id, name, email, college, password_hash, is_verified, rating_avg, rating_count) VALUES
(1, 'Asha Demo',  'asha@example.edu',   'Example University', '$2b$12$ku.Yg6mBb6UWFMmXG9WJoOqx2fPeWj7m0ckHQfC9nIBUBN5gM6Cv6', 1, 4.50, 2),
(2, 'Ravi Demo',  'ravi@example.edu',   'Example University', '$2b$12$ku.Yg6mBb6UWFMmXG9WJoOqx2fPeWj7m0ckHQfC9nIBUBN5gM6Cv6', 1, 0.00, 0),
(3, 'Maya Demo',  'maya@test.ac.in',    'Test Institute',     '$2b$12$ku.Yg6mBb6UWFMmXG9WJoOqx2fPeWj7m0ckHQfC9nIBUBN5gM6Cv6', 1, 0.00, 0);


INSERT INTO products (seller_id, title, description, category, listing_type, price, rent_unit, condition_tag, city, college, status) VALUES
  (1, 'Used DSA Textbook (Cormen 3rd ed)',   'Lightly used, no markings. Great for CS students.',     'books',       'sell', 450.00, NULL,   'good',     'Bengaluru', 'Example University', 'active'),
  (1, 'Scientific Calculator Casio fx-991',  'Battery + cover included. Working perfectly.',          'electronics', 'sell', 600.00, NULL,   'like_new', 'Bengaluru', 'Example University', 'active'),
  (2, 'Cycle for rent (Hostel campus)',      'MTB cycle for daily rent. Helmet included.',            'transport',   'rent', 50.00,  'day',  'good',     'Bengaluru', 'Example University', 'active'),
  (3, 'Study Lamp - LED foldable',           'White light, 3 brightness levels.',                     'home',        'sell', 350.00, NULL,   'new',      'Pune',      'Test Institute',     'active'),
  (3, 'Drafter set for engineering drawing', 'Full kit with mini drafter, scale, compass.',           'stationery',  'rent', 30.00,  'week', 'good',     'Pune',      'Test Institute',     'active');

INSERT INTO product_images (product_id, url, position) VALUES
  (1, 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800', 0),
  (2, 'https://images.unsplash.com/photo-1587145820266-a5951ee6f620?w=800', 0),
  (3, 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800', 0),
  (4, 'https://images.unsplash.com/photo-1565374790797-b07b6f74e7c1?w=800', 0),
  (5, 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800', 0);
