-- Enhanced population script for cargo with realistic sender data
-- This script adds sample users and cargo offers to demonstrate the SenderHeader component

-- First, add the sender_id column to the cargo table if it doesn't exist
ALTER TABLE cargo ADD COLUMN IF NOT EXISTS sender_id TEXT;

-- Add some realistic sender users with complete profiles
INSERT INTO users (id, name, email, role, rating, verified, avatar, company, location, last_seen, is_online, created_ts) 
VALUES 
  ('sender_001', 'Marco Rossi', 'marco.rossi@logitalia.com', 'CARGO_OWNER', 4.8, true, 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face', 'Logistica Italia SpA', 'Milan, Italy', extract(epoch from now() - interval '2 hours') * 1000, true, extract(epoch from now() - interval '6 months') * 1000),
  
  ('sender_002', 'Emma van der Berg', 'emma.vandeberg@hollandfreight.nl', 'CARGO_OWNER', 4.6, true, 'https://images.unsplash.com/photo-1494790108755-2616b9e0b23e?w=100&h=100&fit=crop&crop=face', 'Holland Freight Solutions', 'Amsterdam, Netherlands', extract(epoch from now() - interval '1 hour') * 1000, true, extract(epoch from now() - interval '8 months') * 1000),
  
  ('sender_003', 'Klaus Müller', 'klaus.mueller@deutschetransport.de', 'CARGO_OWNER', 4.9, true, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face', 'Deutsche Transport GmbH', 'Munich, Germany', extract(epoch from now() - interval '30 minutes') * 1000, true, extract(epoch from now() - interval '1 year') * 1000),
  
  ('sender_004', 'Sophie Dubois', 'sophie.dubois@frenchcargo.fr', 'CARGO_OWNER', 4.4, true, 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face', 'French Cargo Express', 'Lyon, France', extract(epoch from now() - interval '3 hours') * 1000, false, extract(epoch from now() - interval '10 months') * 1000),
  
  ('sender_005', 'Jan Kowalski', 'jan.kowalski@polishlogistics.pl', 'CARGO_OWNER', 4.7, true, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face', 'Polish Logistics Group', 'Warsaw, Poland', extract(epoch from now() - interval '5 hours') * 1000, false, extract(epoch from now() - interval '4 months') * 1000),
  
  ('sender_006', 'Maria Santos', 'maria.santos@iberianfreight.es', 'CARGO_OWNER', 4.3, false, 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=face', 'Iberian Freight Network', 'Madrid, Spain', extract(epoch from now() - interval '1 day') * 1000, false, extract(epoch from now() - interval '2 months') * 1000),
  
  ('sender_007', 'Andreas Lindqvist', 'andreas.lindqvist@nordiclogistics.se', 'CARGO_OWNER', 4.8, true, 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop&crop=face', 'Nordic Logistics AB', 'Stockholm, Sweden', extract(epoch from now() - interval '4 hours') * 1000, true, extract(epoch from now() - interval '7 months') * 1000),
  
  ('sender_008', 'Dimitri Popov', 'dimitri.popov@balkanfreight.bg', 'CARGO_OWNER', 4.5, true, 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop&crop=face', 'Balkan Freight Solutions', 'Sofia, Bulgaria', extract(epoch from now() - interval '6 hours') * 1000, false, extract(epoch from now() - interval '5 months') * 1000),
  
  ('sender_009', 'Petra Novak', 'petra.novak@centraleuropelogistics.cz', 'CARGO_OWNER', 4.9, true, 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop&crop=face', 'Central Europe Logistics', 'Prague, Czech Republic', extract(epoch from now() - interval '2 hours') * 1000, true, extract(epoch from now() - interval '11 months') * 1000),
  
  ('sender_010', 'Hiroshi Tanaka', 'hiroshi.tanaka@euroasiafreight.com', 'CARGO_OWNER', 4.6, true, 'https://images.unsplash.com/photo-1566492031773-4f4e44671d66?w=100&h=100&fit=crop&crop=face', 'Euro-Asia Freight Co.', 'Vienna, Austria', extract(epoch from now() - interval '8 hours') * 1000, false, extract(epoch from now() - interval '3 months') * 1000)
ON CONFLICT (id) DO NOTHING;

-- Add realistic cargo offers with sender information
INSERT INTO cargo (
  id, title, type, urgency, weight, volume, 
  from_addr, from_country, from_postal, from_city,
  to_addr, to_country, to_postal, to_city,
  from_lat, from_lng, to_lat, to_lng,
  load_date, delivery_date, price, price_per_kg,
  provider_name, provider_status, sender_id, status,
  created_ts, updated_ts, posting_date
) VALUES 
  (
    'cargo_001', 'Electronics Components - Dell Server Parts', 'General', 'High', 2500, 8.5,
    'Corso Buenos Aires 77, Milan, Italy', 'Italy', '20124', 'Milan',
    'Calea Victoriei 120, Bucharest, Romania', 'Romania', '010096', 'Bucharest',
    45.4654, 9.1866, 44.4268, 26.1025,
    '2025-01-10', '2025-01-12', 3200, 1.28,
    'Logistica Italia SpA', 'Premium', 'sender_001', 'NEW',
    extract(epoch from now() - interval '2 hours') * 1000,
    extract(epoch from now() - interval '2 hours') * 1000,
    '2025-01-08'
  ),
  
  (
    'cargo_002', 'Fresh Flower Shipment - Tulips Export', 'Refrigerated', 'Urgent', 1200, 12.0,
    'Bloemenmarkt 1, Amsterdam, Netherlands', 'Netherlands', '1012', 'Amsterdam',
    'Unter den Linden 5, Berlin, Germany', 'Germany', '10117', 'Berlin',
    52.3702, 4.8951, 52.5200, 13.4050,
    '2025-01-09', '2025-01-10', 2800, 2.33,
    'Holland Freight Solutions', 'Verified', 'sender_002', 'OPEN',
    extract(epoch from now() - interval '1 hour') * 1000,
    extract(epoch from now() - interval '1 hour') * 1000,
    '2025-01-08'
  ),
  
  (
    'cargo_003', 'Automotive Parts - BMW Components', 'General', 'Medium', 3500, 15.2,
    'Maximilianstraße 13, Munich, Germany', 'Germany', '80539', 'Munich',
    'Ringstraße 1, Vienna, Austria', 'Austria', '1010', 'Vienna',
    48.1351, 11.5820, 48.2082, 16.3738,
    '2025-01-11', '2025-01-13', 4200, 1.20,
    'Deutsche Transport GmbH', 'Premium', 'sender_003', 'NEW',
    extract(epoch from now() - interval '30 minutes') * 1000,
    extract(epoch from now() - interval '30 minutes') * 1000,
    '2025-01-08'
  ),
  
  (
    'cargo_004', 'Fashion Textiles - Luxury Garments', 'Fragile', 'Medium', 800, 25.0,
    'Rue de Rivoli 210, Lyon, France', 'France', '69002', 'Lyon',
    'Via Montenapoleone 8, Milan, Italy', 'Italy', '20121', 'Milan',
    45.7640, 4.8357, 45.4654, 9.1866,
    '2025-01-12', '2025-01-15', 2400, 3.00,
    'French Cargo Express', 'Standard', 'sender_004', 'NEW',
    extract(epoch from now() - interval '3 hours') * 1000,
    extract(epoch from now() - interval '3 hours') * 1000,
    '2025-01-08'
  ),
  
  (
    'cargo_005', 'Construction Materials - Steel Beams', 'Oversized', 'Low', 18000, 45.0,
    'Marszałkowska 140, Warsaw, Poland', 'Poland', '00-061', 'Warsaw',
    'Wenceslas Square 1, Prague, Czech Republic', 'Czech Republic', '110 00', 'Prague',
    52.2297, 21.0122, 50.0755, 14.4378,
    '2025-01-15', '2025-01-18', 8500, 0.47,
    'Polish Logistics Group', 'Verified', 'sender_005', 'OPEN',
    extract(epoch from now() - interval '5 hours') * 1000,
    extract(epoch from now() - interval '5 hours') * 1000,
    '2025-01-08'
  ),
  
  (
    'cargo_006', 'Food Products - Olive Oil Export', 'General', 'Medium', 2200, 18.5,
    'Gran Vía 45, Madrid, Spain', 'Spain', '28013', 'Madrid',
    'Champs-Élysées 100, Paris, France', 'France', '75008', 'Paris',
    40.4168, -3.7038, 48.8566, 2.3522,
    '2025-01-13', '2025-01-16', 3600, 1.64,
    'Iberian Freight Network', 'Standard', 'sender_006', 'NEW',
    extract(epoch from now() - interval '1 day') * 1000,
    extract(epoch from now() - interval '1 day') * 1000,
    '2025-01-07'
  ),
  
  (
    'cargo_007', 'Medical Equipment - Surgical Instruments', 'Fragile', 'High', 450, 3.2,
    'Gamla Stan 20, Stockholm, Sweden', 'Sweden', '111 29', 'Stockholm',
    'Nyhavn 12, Copenhagen, Denmark', 'Denmark', '1051', 'Copenhagen',
    59.3293, 18.0686, 55.6761, 12.5683,
    '2025-01-10', '2025-01-11', 1800, 4.00,
    'Nordic Logistics AB', 'Premium', 'sender_007', 'TAKEN',
    extract(epoch from now() - interval '4 hours') * 1000,
    extract(epoch from now() - interval '4 hours') * 1000,
    '2025-01-08'
  ),
  
  (
    'cargo_008', 'Agricultural Products - Organic Wheat', 'General', 'Low', 12000, 60.0,
    'Vitosha Boulevard 75, Sofia, Bulgaria', 'Bulgaria', '1463', 'Sofia',
    'Andrássy Avenue 60, Budapest, Hungary', 'Hungary', '1062', 'Budapest',
    42.6977, 23.3219, 47.4979, 19.0402,
    '2025-01-14', '2025-01-17', 4800, 0.40,
    'Balkan Freight Solutions', 'Verified', 'sender_008', 'NEW',
    extract(epoch from now() - interval '6 hours') * 1000,
    extract(epoch from now() - interval '6 hours') * 1000,
    '2025-01-08'
  ),
  
  (
    'cargo_009', 'Technology Hardware - Servers and Networking', 'Fragile', 'Urgent', 1800, 6.8,
    'Wenceslas Square 25, Prague, Czech Republic', 'Czech Republic', '110 00', 'Prague',
    'Bahnhofstraße 50, Zurich, Switzerland', 'Switzerland', '8001', 'Zurich',
    50.0755, 14.4378, 47.3769, 8.5417,
    '2025-01-09', '2025-01-10', 5400, 3.00,
    'Central Europe Logistics', 'Premium', 'sender_009', 'IN_PROGRESS',
    extract(epoch from now() - interval '2 hours') * 1000,
    extract(epoch from now() - interval '2 hours') * 1000,
    '2025-01-08'
  ),
  
  (
    'cargo_010', 'Chemical Products - Laboratory Supplies', 'Dangerous', 'High', 950, 4.5,
    'Kärtner Straße 51, Vienna, Austria', 'Austria', '1010', 'Vienna',
    'Paradeplatz 6, Zurich, Switzerland', 'Switzerland', '8001', 'Zurich',
    48.2082, 16.3738, 47.3769, 8.5417,
    '2025-01-11', '2025-01-12', 3800, 4.00,
    'Euro-Asia Freight Co.', 'Verified', 'sender_010', 'NEW',
    extract(epoch from now() - interval '8 hours') * 1000,
    extract(epoch from now() - interval '8 hours') * 1000,
    '2025-01-08'
  )
ON CONFLICT (id) DO NOTHING;

-- Add foreign key constraint to link cargo to sender
ALTER TABLE cargo ADD CONSTRAINT fk_cargo_sender FOREIGN KEY (sender_id) REFERENCES users(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_cargo_sender ON cargo(sender_id);

-- Update the existing cargo table structure to make provider_name match sender company
UPDATE cargo SET provider_name = u.company 
FROM users u 
WHERE cargo.sender_id = u.id AND u.company IS NOT NULL;

-- Add some sample messages for demonstration (optional)
INSERT INTO offer_requests (
  id, cargo_id, transporter_id, proposed_price, message, status, created_ts
) VALUES 
  ('offer_001', 'cargo_001', 'transporter_001', 3000, 'I can handle this shipment with express delivery. My truck is equipped for electronics.', 'PENDING', extract(epoch from now() - interval '1 hour') * 1000),
  ('offer_002', 'cargo_002', 'transporter_002', 2600, 'Specialized in refrigerated transport. Temperature control guaranteed.', 'PENDING', extract(epoch from now() - interval '2 hours') * 1000),
  ('offer_003', 'cargo_003', 'transporter_003', 4000, 'BMW certified transport. Perfect condition guaranteed.', 'ACCEPTED', extract(epoch from now() - interval '3 hours') * 1000)
ON CONFLICT (id) DO NOTHING;

-- Add a few more sender companies for variety
INSERT INTO users (id, name, email, role, rating, verified, avatar, company, location, last_seen, is_online, created_ts) 
VALUES 
  ('sender_011', 'Luca Bianchi', 'luca.bianchi@mediterraneancargo.it', 'CARGO_OWNER', 4.7, true, 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&h=100&fit=crop&crop=face', 'Mediterranean Cargo Ltd', 'Rome, Italy', extract(epoch from now() - interval '1 hour') * 1000, true, extract(epoch from now() - interval '9 months') * 1000),
  
  ('sender_012', 'Ingrid Hansen', 'ingrid.hansen@scandinaviantransport.no', 'CARGO_OWNER', 4.8, true, 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=100&h=100&fit=crop&crop=face', 'Scandinavian Transport AS', 'Oslo, Norway', extract(epoch from now() - interval '3 hours') * 1000, false, extract(epoch from now() - interval '6 months') * 1000)
ON CONFLICT (id) DO NOTHING;

-- Add a few more diverse cargo entries
INSERT INTO cargo (
  id, title, type, urgency, weight, volume, 
  from_addr, from_country, from_postal, from_city,
  to_addr, to_country, to_postal, to_city,
  from_lat, from_lng, to_lat, to_lng,
  load_date, delivery_date, price, price_per_kg,
  provider_name, provider_status, sender_id, status,
  created_ts, updated_ts, posting_date
) VALUES 
  (
    'cargo_011', 'Luxury Furniture - Handcrafted Italian Pieces', 'Fragile', 'Medium', 1500, 35.0,
    'Via del Corso 300, Rome, Italy', 'Italy', '00186', 'Rome',
    'Bond Street 150, London, UK', 'UK', 'W1S 2YF', 'London',
    41.9028, 12.4964, 51.5074, -0.1278,
    '2025-01-13', '2025-01-16', 4500, 3.00,
    'Mediterranean Cargo Ltd', 'Premium', 'sender_011', 'NEW',
    extract(epoch from now() - interval '1 hour') * 1000,
    extract(epoch from now() - interval '1 hour') * 1000,
    '2025-01-08'
  ),
  
  (
    'cargo_012', 'Seafood Export - Fresh Norwegian Salmon', 'Refrigerated', 'Urgent', 2800, 20.0,
    'Karl Johans gate 25, Oslo, Norway', 'Norway', '0159', 'Oslo',
    'Fisketorget 1, Bergen, Norway', 'Norway', '5014', 'Bergen',
    59.9139, 10.7522, 60.3913, 5.3221,
    '2025-01-09', '2025-01-10', 5600, 2.00,
    'Scandinavian Transport AS', 'Premium', 'sender_012', 'OPEN',
    extract(epoch from now() - interval '3 hours') * 1000,
    extract(epoch from now() - interval '3 hours') * 1000,
    '2025-01-08'
  )
ON CONFLICT (id) DO NOTHING;

-- Add some statistics info
SELECT 
  'Sample Data Summary:' as info,
  (SELECT COUNT(*) FROM users WHERE role = 'CARGO_OWNER') as total_senders,
  (SELECT COUNT(*) FROM cargo WHERE sender_id IS NOT NULL) as cargo_with_senders,
  (SELECT COUNT(*) FROM cargo WHERE status = 'NEW') as new_cargo,
  (SELECT COUNT(*) FROM cargo WHERE status = 'OPEN') as open_cargo,
  (SELECT COUNT(*) FROM offer_requests) as total_offers;