-- Generated on 2025-12-07T20:39:53.100Z
-- Insert route-stop relationships

-- Temporarily disable RLS for bulk insert
ALTER TABLE route_stops DISABLE ROW LEVEL SECURITY;


-- Route: M2 (Déli pályaudvar M / Örs vezér tere M+H)
WITH route_ref AS (SELECT id FROM routes WHERE route_number = 'M2' LIMIT 1)

INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 1, '00:00:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Déli pályaudvar' AND latitude = 47.50045 AND longitude = 19.024604 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 2, '00:01:37'::interval, NOW(), NOW()
FROM stops WHERE name = 'Széll Kálmán tér' AND latitude = 47.507533 AND longitude = 19.026097 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 3, '00:03:22'::interval, NOW(), NOW()
FROM stops WHERE name = 'Batthyány tér' AND latitude = 47.506826 AND longitude = 19.038103 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 4, '00:04:45'::interval, NOW(), NOW()
FROM stops WHERE name = 'Kossuth Lajos tér' AND latitude = 47.505511 AND longitude = 19.045769 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 5, '00:06:45'::interval, NOW(), NOW()
FROM stops WHERE name = 'Deák Ferenc tér' AND latitude = 47.497593 AND longitude = 19.053857 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 6, '00:08:20'::interval, NOW(), NOW()
FROM stops WHERE name = 'Astoria' AND latitude = 47.494825 AND longitude = 19.062457 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 7, '00:09:45'::interval, NOW(), NOW()
FROM stops WHERE name = 'Blaha Lujza tér' AND latitude = 47.497006 AND longitude = 19.070274 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 8, '00:11:30'::interval, NOW(), NOW()
FROM stops WHERE name = 'Keleti pályaudvar' AND latitude = 47.499683 AND longitude = 19.082881 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 9, '00:14:07'::interval, NOW(), NOW()
FROM stops WHERE name = 'Puskás Ferenc Stadion' AND latitude = 47.500174 AND longitude = 19.106381 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 10, '00:16:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Pillangó utca' AND latitude = 47.501204 AND longitude = 19.120417 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 11, '00:18:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Örs vezér tere' AND latitude = 47.502922 AND longitude = 19.135963 LIMIT 1
ON CONFLICT DO NOTHING;

-- Route: M1 (Vörösmarty tér / Mexikói út M)
WITH route_ref AS (SELECT id FROM routes WHERE route_number = 'M1' LIMIT 1)

INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 1, '00:00:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Vörösmarty tér' AND latitude = 47.496737 AND longitude = 19.050593 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 2, '00:01:10'::interval, NOW(), NOW()
FROM stops WHERE name = 'Deák Ferenc tér' AND latitude = 47.497728 AND longitude = 19.054142 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 3, '00:02:30'::interval, NOW(), NOW()
FROM stops WHERE name = 'Bajcsy-Zsilinszky út' AND latitude = 47.499937 AND longitude = 19.055655 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 4, '00:03:35'::interval, NOW(), NOW()
FROM stops WHERE name = 'Opera' AND latitude = 47.502305 AND longitude = 19.059161 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 5, '00:04:45'::interval, NOW(), NOW()
FROM stops WHERE name = 'Oktogon' AND latitude = 47.505023 AND longitude = 19.063233 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 6, '00:05:52'::interval, NOW(), NOW()
FROM stops WHERE name = 'Vörösmarty utca' AND latitude = 47.507238 AND longitude = 19.066529 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 7, '00:06:50'::interval, NOW(), NOW()
FROM stops WHERE name = 'Kodály körönd' AND latitude = 47.509261 AND longitude = 19.069544 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 8, '00:07:50'::interval, NOW(), NOW()
FROM stops WHERE name = 'Bajza utca' AND latitude = 47.511342 AND longitude = 19.072662 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 9, '00:09:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Hősök tere' AND latitude = 47.51411 AND longitude = 19.076883 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 10, '00:10:40'::interval, NOW(), NOW()
FROM stops WHERE name = 'Széchenyi fürdő' AND latitude = 47.517407 AND longitude = 19.081481 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 11, '00:12:15'::interval, NOW(), NOW()
FROM stops WHERE name = 'Mexikói út' AND latitude = 47.519513 AND longitude = 19.091037 LIMIT 1
ON CONFLICT DO NOTHING;

-- Route: 2 (Jászai Mari tér / Közvágóhíd H)
WITH route_ref AS (SELECT id FROM routes WHERE route_number = '2' LIMIT 1)

INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 1, '00:00:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Jászai Mari tér' AND latitude = 47.512837 AND longitude = 19.047936 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 2, '00:01:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Országház, látogatóközpont' AND latitude = 47.508879 AND longitude = 19.046582 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 3, '00:03:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Kossuth Lajos tér M' AND latitude = 47.505749 AND longitude = 19.046834 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 4, '00:05:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Széchenyi István tér' AND latitude = 47.500685 AND longitude = 19.046064 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 5, '00:06:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Eötvös tér' AND latitude = 47.497969 AND longitude = 19.04702 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 6, '00:07:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Vigadó tér' AND latitude = 47.495837 AND longitude = 19.048215 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 7, '00:09:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Március 15. tér' AND latitude = 47.490719 AND longitude = 19.051652 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 8, '00:10:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Fővám tér M' AND latitude = 47.486941 AND longitude = 19.056482 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 9, '00:12:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Zsil utca' AND latitude = 47.483036 AND longitude = 19.062439 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 10, '00:13:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Boráros tér H' AND latitude = 47.479726 AND longitude = 19.066299 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 11, '00:15:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Haller utca / Soroksári út' AND latitude = 47.474022 AND longitude = 19.070622 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 12, '00:17:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Müpa - Nemzeti Színház H' AND latitude = 47.470972 AND longitude = 19.073181 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 13, '00:19:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Közvágóhíd H' AND latitude = 47.467527 AND longitude = 19.075886 LIMIT 1
ON CONFLICT DO NOTHING;

-- Route: M3 (Újpest-központ / Kőbánya-Kispest)
WITH route_ref AS (SELECT id FROM routes WHERE route_number = 'M3' LIMIT 1)

INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 1, '00:00:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Újpest-központ' AND latitude = 47.560437 AND longitude = 19.08976 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 2, '00:01:40'::interval, NOW(), NOW()
FROM stops WHERE name = 'Újpest-városkapu' AND latitude = 47.559146 AND longitude = 19.079567 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 3, '00:03:42'::interval, NOW(), NOW()
FROM stops WHERE name = 'Gyöngyösi utca' AND latitude = 47.548374 AND longitude = 19.073019 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 4, '00:05:40'::interval, NOW(), NOW()
FROM stops WHERE name = 'Forgách utca' AND latitude = 47.538163 AND longitude = 19.069055 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 5, '00:07:10'::interval, NOW(), NOW()
FROM stops WHERE name = 'Göncz Árpád városközpont' AND latitude = 47.532171 AND longitude = 19.066471 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 6, '00:08:50'::interval, NOW(), NOW()
FROM stops WHERE name = 'Dózsa György út' AND latitude = 47.524358 AND longitude = 19.063088 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 7, '00:10:30'::interval, NOW(), NOW()
FROM stops WHERE name = 'Lehel tér' AND latitude = 47.517595 AND longitude = 19.060285 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 8, '00:12:15'::interval, NOW(), NOW()
FROM stops WHERE name = 'Nyugati pályaudvar' AND latitude = 47.510828 AND longitude = 19.055952 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 9, '00:13:55'::interval, NOW(), NOW()
FROM stops WHERE name = 'Arany János utca' AND latitude = 47.50367 AND longitude = 19.054513 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 10, '00:15:30'::interval, NOW(), NOW()
FROM stops WHERE name = 'Deák Ferenc tér' AND latitude = 47.497591 AND longitude = 19.054525 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 11, '00:17:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Ferenciek tere' AND latitude = 47.49182 AND longitude = 19.056789 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 12, '00:18:20'::interval, NOW(), NOW()
FROM stops WHERE name = 'Kálvin tér' AND latitude = 47.48949 AND longitude = 19.06192 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 13, '00:20:05'::interval, NOW(), NOW()
FROM stops WHERE name = 'Corvin-negyed' AND latitude = 47.484862 AND longitude = 19.072242 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 14, '00:21:25'::interval, NOW(), NOW()
FROM stops WHERE name = 'Semmelweis Klinikák' AND latitude = 47.482872 AND longitude = 19.078425 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 15, '00:23:25'::interval, NOW(), NOW()
FROM stops WHERE name = 'Nagyvárad tér' AND latitude = 47.478365 AND longitude = 19.091071 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 16, '00:25:15'::interval, NOW(), NOW()
FROM stops WHERE name = 'Népliget' AND latitude = 47.474913 AND longitude = 19.100672 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 17, '00:26:57'::interval, NOW(), NOW()
FROM stops WHERE name = 'Ecseri út' AND latitude = 47.470529 AND longitude = 19.111646 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 18, '00:28:20'::interval, NOW(), NOW()
FROM stops WHERE name = 'Pöttyös utca' AND latitude = 47.467939 AND longitude = 19.118838 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 19, '00:29:45'::interval, NOW(), NOW()
FROM stops WHERE name = 'Határ út' AND latitude = 47.465749 AND longitude = 19.126228 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 20, '00:32:10'::interval, NOW(), NOW()
FROM stops WHERE name = 'Kőbánya-Kispest' AND latitude = 47.463443 AND longitude = 19.148764 LIMIT 1
ON CONFLICT DO NOTHING;

-- Route: M4 (Keleti pályaudvar / Kelenföld vasútállomás)
WITH route_ref AS (SELECT id FROM routes WHERE route_number = 'M4' LIMIT 1)

INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 1, '00:00:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Keleti pályaudvar' AND latitude = 47.500116 AND longitude = 19.080722 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 2, '00:01:20'::interval, NOW(), NOW()
FROM stops WHERE name = 'II. János Pál pápa tér' AND latitude = 47.495593 AND longitude = 19.077229 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 3, '00:02:43'::interval, NOW(), NOW()
FROM stops WHERE name = 'Rákóczi tér' AND latitude = 47.492725 AND longitude = 19.071361 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 4, '00:04:28'::interval, NOW(), NOW()
FROM stops WHERE name = 'Kálvin tér' AND latitude = 47.488903 AND longitude = 19.061022 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 5, '00:05:46'::interval, NOW(), NOW()
FROM stops WHERE name = 'Fővám tér' AND latitude = 47.485792 AND longitude = 19.057571 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 6, '00:06:56'::interval, NOW(), NOW()
FROM stops WHERE name = 'Szent Gellért tér - Műegyetem' AND latitude = 47.482635 AND longitude = 19.054014 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 7, '00:08:36'::interval, NOW(), NOW()
FROM stops WHERE name = 'Móricz Zsigmond körtér' AND latitude = 47.476629 AND longitude = 19.047227 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 8, '00:09:46'::interval, NOW(), NOW()
FROM stops WHERE name = 'Újbuda-központ' AND latitude = 47.47286 AND longitude = 19.045954 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 9, '00:11:51'::interval, NOW(), NOW()
FROM stops WHERE name = 'Bikás park' AND latitude = 47.464881 AND longitude = 19.032345 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 10, '00:13:10'::interval, NOW(), NOW()
FROM stops WHERE name = 'Kelenföld vasútállomás' AND latitude = 47.464515 AND longitude = 19.019618 LIMIT 1
ON CONFLICT DO NOTHING;

-- Route: 16 (Deák Ferenc tér M / Széll Kálmán tér M)
WITH route_ref AS (SELECT id FROM routes WHERE route_number = '16' LIMIT 1)

INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 1, '00:00:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Deák Ferenc tér M' AND latitude = 47.497701 AND longitude = 19.053353 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 2, '00:01:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Hild tér' AND latitude = 47.498978 AND longitude = 19.050884 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 3, '00:02:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Széchenyi István tér' AND latitude = 47.500543 AND longitude = 19.04669 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 4, '00:04:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Clark Ádám tér' AND latitude = 47.498312 AND longitude = 19.039816 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 5, '00:06:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Donáti utca' AND latitude = 47.501307 AND longitude = 19.036072 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 6, '00:07:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Halászbástya (Schulek Frigyes lépcső)' AND latitude = 47.50224 AND longitude = 19.035339 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 7, '00:08:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Dísz tér' AND latitude = 47.499398 AND longitude = 19.03599 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 8, '00:09:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Szentháromság tér' AND latitude = 47.501306 AND longitude = 19.033896 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 9, '00:10:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Bécsi kapu tér' AND latitude = 47.504553 AND longitude = 19.030683 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 10, '00:11:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Mátray utca' AND latitude = 47.505965 AND longitude = 19.028598 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 11, '00:12:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Széll Kálmán tér M' AND latitude = 47.506881 AND longitude = 19.023541 LIMIT 1
ON CONFLICT DO NOTHING;

-- Route: 4 (Széll Kálmán tér M / Újbuda-központ M)
WITH route_ref AS (SELECT id FROM routes WHERE route_number = '4' LIMIT 1)

INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 1, '00:00:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Széll Kálmán tér M' AND latitude = 47.507258 AND longitude = 19.025182 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 2, '00:01:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Széna tér' AND latitude = 47.508491 AND longitude = 19.027319 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 3, '00:02:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Mechwart liget' AND latitude = 47.510965 AND longitude = 19.032111 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 4, '00:05:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Margit híd, budai hídfő H' AND latitude = 47.514564 AND longitude = 19.038894 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 5, '00:06:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Margitsziget / Margit híd' AND latitude = 47.514447 AND longitude = 19.044324 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 6, '00:08:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Jászai Mari tér' AND latitude = 47.512864 AND longitude = 19.048785 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 7, '00:10:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Nyugati pályaudvar M' AND latitude = 47.509922 AND longitude = 19.056658 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 8, '00:12:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Oktogon M' AND latitude = 47.505586 AND longitude = 19.06287 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 9, '00:13:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Király utca / Erzsébet körút' AND latitude = 47.502806 AND longitude = 19.066187 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 10, '00:14:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Wesselényi utca / Erzsébet körút' AND latitude = 47.499856 AND longitude = 19.06916 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 11, '00:16:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Blaha Lujza tér M' AND latitude = 47.496248 AND longitude = 19.070671 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 12, '00:17:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Rákóczi tér M' AND latitude = 47.49239 AND longitude = 19.071001 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 13, '00:19:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Harminckettesek tere' AND latitude = 47.489592 AND longitude = 19.070589 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 14, '00:20:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Corvin-negyed M' AND latitude = 47.48621 AND longitude = 19.070057 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 15, '00:22:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Mester utca / Ferenc körút' AND latitude = 47.482199 AND longitude = 19.068463 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 16, '00:23:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Boráros tér H' AND latitude = 47.480149 AND longitude = 19.066074 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 17, '00:25:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Petőfi híd, budai hídfő' AND latitude = 47.476695 AND longitude = 19.058975 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 18, '00:27:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Budafoki út / Szerémi sor' AND latitude = 47.473691 AND longitude = 19.052818 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 19, '00:29:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Újbuda-központ M' AND latitude = 47.474042 AND longitude = 19.046862 LIMIT 1
ON CONFLICT DO NOTHING;

-- Route: 6 (Széll Kálmán tér M / Móricz Zsigmond körtér M)
WITH route_ref AS (SELECT id FROM routes WHERE route_number = '6' LIMIT 1)

INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 1, '00:00:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Széll Kálmán tér M' AND latitude = 47.507258 AND longitude = 19.025182 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 2, '00:01:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Széna tér' AND latitude = 47.508491 AND longitude = 19.027319 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 3, '00:02:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Mechwart liget' AND latitude = 47.510965 AND longitude = 19.032111 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 4, '00:05:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Margit híd, budai hídfő H' AND latitude = 47.514564 AND longitude = 19.038894 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 5, '00:06:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Margitsziget / Margit híd' AND latitude = 47.514447 AND longitude = 19.044324 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 6, '00:08:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Jászai Mari tér' AND latitude = 47.512864 AND longitude = 19.048785 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 7, '00:10:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Nyugati pályaudvar M' AND latitude = 47.509922 AND longitude = 19.056658 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 8, '00:12:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Oktogon M' AND latitude = 47.505586 AND longitude = 19.06287 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 9, '00:13:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Király utca / Erzsébet körút' AND latitude = 47.502806 AND longitude = 19.066187 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 10, '00:14:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Wesselényi utca / Erzsébet körút' AND latitude = 47.499856 AND longitude = 19.06916 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 11, '00:16:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Blaha Lujza tér M' AND latitude = 47.496248 AND longitude = 19.070671 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 12, '00:17:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Rákóczi tér M' AND latitude = 47.49239 AND longitude = 19.071001 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 13, '00:19:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Harminckettesek tere' AND latitude = 47.489592 AND longitude = 19.070589 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 14, '00:20:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Corvin-negyed M' AND latitude = 47.48621 AND longitude = 19.070057 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 15, '00:22:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Mester utca / Ferenc körút' AND latitude = 47.482199 AND longitude = 19.068463 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 16, '00:23:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Boráros tér H' AND latitude = 47.480149 AND longitude = 19.066074 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 17, '00:25:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Petőfi híd, budai hídfő' AND latitude = 47.476695 AND longitude = 19.058975 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 18, '00:27:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Budafoki út / Karinthy Frigyes út' AND latitude = 47.476048 AND longitude = 19.053455 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 19, '00:29:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Móricz Zsigmond körtér M' AND latitude = 47.477496 AND longitude = 19.048347 LIMIT 1
ON CONFLICT DO NOTHING;

-- Route: 9 (Óbuda, Bogdáni út / Kőbánya alsó vasútállomás)
WITH route_ref AS (SELECT id FROM routes WHERE route_number = '9' LIMIT 1)

INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 1, '00:00:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Óbuda, Bogdáni út' AND latitude = 47.550127 AND longitude = 19.041973 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 2, '00:01:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Bogdáni út' AND latitude = 47.548409 AND longitude = 19.043102 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 3, '00:02:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Raktár utca' AND latitude = 47.544713 AND longitude = 19.042212 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 4, '00:03:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Flórián tér' AND latitude = 47.541987 AND longitude = 19.04119 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 5, '00:05:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Kiscelli utca' AND latitude = 47.538517 AND longitude = 19.040218 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 6, '00:07:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Tímár utca' AND latitude = 47.534333 AND longitude = 19.03973 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 7, '00:09:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Galagonya utca' AND latitude = 47.530133 AND longitude = 19.039386 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 8, '00:11:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Kolosy tér' AND latitude = 47.526913 AND longitude = 19.038204 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 9, '00:12:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Zsigmond tér' AND latitude = 47.524053 AND longitude = 19.037421 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 10, '00:14:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Császár-Komjádi uszoda' AND latitude = 47.51961 AND longitude = 19.038046 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 11, '00:16:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Margit híd, budai hídfő H' AND latitude = 47.515365 AND longitude = 19.039282 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 12, '00:19:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Jászai Mari tér' AND latitude = 47.512504 AND longitude = 19.049555 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 13, '00:22:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Nyugati pályaudvar M' AND latitude = 47.509906 AND longitude = 19.05504 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 14, '00:25:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Báthory utca / Bajcsy-Zsilinszky út' AND latitude = 47.506101 AND longitude = 19.054854 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 15, '00:27:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Arany János utca M' AND latitude = 47.502881 AND longitude = 19.054734 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 16, '00:28:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Szent István Bazilika' AND latitude = 47.500141 AND longitude = 19.054665 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 17, '00:30:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Deák Ferenc tér M' AND latitude = 47.497089 AND longitude = 19.05541 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 18, '00:32:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Astoria M' AND latitude = 47.494561 AND longitude = 19.059696 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 19, '00:34:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Kálvin tér M' AND latitude = 47.489083 AND longitude = 19.062694 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 20, '00:36:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Szentkirályi utca' AND latitude = 47.488975 AND longitude = 19.065852 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 21, '00:38:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Harminckettesek tere' AND latitude = 47.489388 AND longitude = 19.071638 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 22, '00:41:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Horváth Mihály tér' AND latitude = 47.489377 AND longitude = 19.077397 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 23, '00:42:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Muzsikus cigányok parkja' AND latitude = 47.488963 AND longitude = 19.081125 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 24, '00:44:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Kálvária tér' AND latitude = 47.488791 AND longitude = 19.085371 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 25, '00:46:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Orczy tér' AND latitude = 47.48913 AND longitude = 19.092218 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 26, '00:48:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Kőbányai út 31.' AND latitude = 47.487452 AND longitude = 19.103721 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 27, '00:50:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Kőbányai út / Könyves Kálmán körút' AND latitude = 47.486155 AND longitude = 19.108284 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 28, '00:51:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Eiffel Műhelyház' AND latitude = 47.484704 AND longitude = 19.114015 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 29, '00:52:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Egészségház' AND latitude = 47.483676 AND longitude = 19.117463 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 30, '00:55:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Kőbánya alsó vasútállomás (Mázsa tér)' AND latitude = 47.482564 AND longitude = 19.126059 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 31, '00:56:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Liget tér' AND latitude = 47.483074 AND longitude = 19.131221 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 32, '00:58:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Szent László tér' AND latitude = 47.485907 AND longitude = 19.130668 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 33, '00:59:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Kőbánya alsó vasútállomás' AND latitude = 47.484011 AND longitude = 19.127574 LIMIT 1
ON CONFLICT DO NOTHING;

-- Route: 7 (Albertfalva vasútállomás / Újpalota, Nyírpalota út)
WITH route_ref AS (SELECT id FROM routes WHERE route_number = '7' LIMIT 1)

INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 1, '00:00:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Albertfalva vasútállomás' AND latitude = 47.441603 AND longitude = 19.034191 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 2, '00:00:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Fonyód utca / Sáfrány utca' AND latitude = 47.443905 AND longitude = 19.033885 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 3, '00:01:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Herend utca' AND latitude = 47.446672 AND longitude = 19.033591 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 4, '00:02:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Nyírbátor utca' AND latitude = 47.449545 AND longitude = 19.033366 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 5, '00:03:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Csurgói út' AND latitude = 47.453979 AND longitude = 19.033445 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 6, '00:04:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Andor utca / Tétényi út' AND latitude = 47.457127 AND longitude = 19.033537 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 7, '00:05:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Bornemissza tér' AND latitude = 47.458435 AND longitude = 19.033573 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 8, '00:05:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Puskás Tivadar utca' AND latitude = 47.460437 AND longitude = 19.033642 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 9, '00:07:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Bikás park M' AND latitude = 47.464277 AND longitude = 19.033826 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 10, '00:08:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Tétényi út 30.' AND latitude = 47.466355 AND longitude = 19.034157 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 11, '00:09:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Szent Imre Kórház' AND latitude = 47.469445 AND longitude = 19.033716 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 12, '00:09:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Karolina út (Sárbogárdi út)' AND latitude = 47.472818 AND longitude = 19.034351 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 13, '00:10:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Karolina út' AND latitude = 47.473371 AND longitude = 19.035389 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 14, '00:11:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Kosztolányi Dezső tér' AND latitude = 47.475179 AND longitude = 19.040191 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 15, '00:13:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Móricz Zsigmond körtér M' AND latitude = 47.477491 AND longitude = 19.046864 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 16, '00:15:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Gárdonyi tér' AND latitude = 47.480522 AND longitude = 19.051932 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 17, '00:16:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Szent Gellért tér - Műegyetem M' AND latitude = 47.482482 AND longitude = 19.05294 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 18, '00:18:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Rudas Gyógyfürdő' AND latitude = 47.489273 AND longitude = 19.046916 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 19, '00:19:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Március 15. tér' AND latitude = 47.491564 AND longitude = 19.051333 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 20, '00:20:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Ferenciek tere M' AND latitude = 47.492925 AND longitude = 19.055343 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 21, '00:23:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Astoria M' AND latitude = 47.494478 AND longitude = 19.061168 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 22, '00:24:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Uránia' AND latitude = 47.495586 AND longitude = 19.065257 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 23, '00:26:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Blaha Lujza tér M' AND latitude = 47.496689 AND longitude = 19.06953 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 24, '00:27:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Huszár utca' AND latitude = 47.499136 AND longitude = 19.078384 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 25, '00:28:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Keleti pályaudvar M' AND latitude = 47.500466 AND longitude = 19.081955 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 26, '00:30:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Reiner Frigyes park' AND latitude = 47.503468 AND longitude = 19.088169 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 27, '00:31:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Cházár András utca' AND latitude = 47.505814 AND longitude = 19.091582 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 28, '00:32:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Stefánia út / Thököly út' AND latitude = 47.5087 AND longitude = 19.095394 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 29, '00:34:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Zugló vasútállomás' AND latitude = 47.511145 AND longitude = 19.098662 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 30, '00:35:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Amerikai út' AND latitude = 47.513581 AND longitude = 19.102501 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 31, '00:36:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Tisza István tér' AND latitude = 47.516951 AND longitude = 19.108478 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 32, '00:38:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Bosnyák tér' AND latitude = 47.519892 AND longitude = 19.112835 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 33, '00:39:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Bosnyák tér (bevásárlóközpont)' AND latitude = 47.521956 AND longitude = 19.115484 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 34, '00:40:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Rákospatak utca / Csömöri út' AND latitude = 47.524554 AND longitude = 19.118781 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 35, '00:41:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Miskolci utca / Csömöri út' AND latitude = 47.527214 AND longitude = 19.122035 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 36, '00:42:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Cinkotai út' AND latitude = 47.528472 AND longitude = 19.123842 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 37, '00:44:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Molnár Viktor utca' AND latitude = 47.533531 AND longitude = 19.13049 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 38, '00:45:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Apolló utca' AND latitude = 47.537242 AND longitude = 19.13525 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 39, '00:46:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Madách utca' AND latitude = 47.539093 AND longitude = 19.137697 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 40, '00:47:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Fő tér' AND latitude = 47.541511 AND longitude = 19.140106 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 41, '00:48:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Vásárcsarnok' AND latitude = 47.545962 AND longitude = 19.140592 LIMIT 1,
INSERT INTO route_stops (route_id, stop_id, stop_order, arrival_offset, created_at, updated_at)
SELECT (SELECT id FROM route_ref), id, 42, '00:50:00'::interval, NOW(), NOW()
FROM stops WHERE name = 'Újpalota, Nyírpalota út' AND latitude = 47.547329 AND longitude = 19.141457 LIMIT 1
ON CONFLICT DO NOTHING;

-- Re-enable RLS
ALTER TABLE route_stops ENABLE ROW LEVEL SECURITY;
