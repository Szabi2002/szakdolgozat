-- Generated on 2025-12-07T20:39:53.096Z
-- Insert Budapest public transport routes

-- Temporarily disable RLS for bulk insert
ALTER TABLE routes DISABLE ROW LEVEL SECURITY;

-- Insert routes
INSERT INTO routes (route_number, name, route_type, created_at, updated_at)
VALUES
  ('7', 'Albertfalva vasútállomás / Újpalota, Nyírpalota út', 'bus', NOW(), NOW()),
  ('9', 'Óbuda, Bogdáni út / Kőbánya alsó vasútállomás', 'bus', NOW(), NOW()),
  ('16', 'Deák Ferenc tér M / Széll Kálmán tér M', 'bus', NOW(), NOW()),
  ('2', 'Jászai Mari tér / Közvágóhíd H', 'tram', NOW(), NOW()),
  ('4', 'Széll Kálmán tér M / Újbuda-központ M', 'tram', NOW(), NOW()),
  ('6', 'Széll Kálmán tér M / Móricz Zsigmond körtér M', 'tram', NOW(), NOW()),
  ('M1', 'Vörösmarty tér / Mexikói út M', 'metro', NOW(), NOW()),
  ('M2', 'Déli pályaudvar M / Örs vezér tere M+H', 'metro', NOW(), NOW()),
  ('M3', 'Újpest-központ / Kőbánya-Kispest', 'metro', NOW(), NOW()),
  ('M4', 'Keleti pályaudvar / Kelenföld vasútállomás', 'metro', NOW(), NOW())
ON CONFLICT (route_number) DO NOTHING;

-- Re-enable RLS
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
