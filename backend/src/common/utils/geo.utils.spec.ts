import {
  haversineDistance,
  walkingTimeMinutes,
  isWalkable,
  MAX_WALKING_DISTANCE_METERS,
  MIN_WALKING_DISTANCE_METERS,
} from './geo.utils';

describe('GeoUtils', () => {
  describe('haversineDistance', () => {
    it('should calculate distance between Deák Ferenc tér and Oktogon correctly', () => {
      // Deák Ferenc tér coordinates
      const deakLat = 47.497913;
      const deakLon = 19.054057;

      // Oktogon coordinates
      const oktogonLat = 47.50587;
      const oktogonLon = 19.063574;

      const distance = haversineDistance(deakLat, deakLon, oktogonLat, oktogonLon);

      // Expected distance: ~1000-1100 meters
      // Allow 5% tolerance for calculation variance
      expect(distance).toBeGreaterThan(1000);
      expect(distance).toBeLessThan(1150);
    });

    it('should return 0 meters for identical coordinates', () => {
      const lat = 47.497913;
      const lon = 19.054057;

      const distance = haversineDistance(lat, lon, lat, lon);

      expect(distance).toBe(0);
    });

    it('should calculate extreme distances correctly (Budapest to London)', () => {
      // Budapest coordinates
      const budapestLat = 47.4979;
      const budapestLon = 19.0402;

      // London coordinates
      const londonLat = 51.5074;
      const londonLon = -0.1278;

      const distance = haversineDistance(budapestLat, budapestLon, londonLat, londonLon);

      // Expected distance: ~1450-1500 km
      const distanceKm = distance / 1000;
      expect(distanceKm).toBeGreaterThan(1400);
      expect(distanceKm).toBeLessThan(1600);
    });

    it('should handle small distances accurately', () => {
      // Two very close points (~100 meters apart)
      const lat1 = 47.497913;
      const lon1 = 19.054057;
      const lat2 = 47.498813; // ~0.0009 degrees north (~100m)
      const lon2 = 19.054057;

      const distance = haversineDistance(lat1, lon1, lat2, lon2);

      // Should be approximately 100 meters (±10%)
      expect(distance).toBeGreaterThan(90);
      expect(distance).toBeLessThan(110);
    });

    it('should throw error for NaN coordinates', () => {
      expect(() => {
        haversineDistance(NaN, 19.054057, 47.50587, 19.063574);
      }).toThrow('Invalid coordinates');

      expect(() => {
        haversineDistance(47.497913, NaN, 47.50587, 19.063574);
      }).toThrow('Invalid coordinates');

      expect(() => {
        haversineDistance(47.497913, 19.054057, NaN, 19.063574);
      }).toThrow('Invalid coordinates');

      expect(() => {
        haversineDistance(47.497913, 19.054057, 47.50587, NaN);
      }).toThrow('Invalid coordinates');
    });

    it('should throw error for Infinity coordinates', () => {
      expect(() => {
        haversineDistance(Infinity, 19.054057, 47.50587, 19.063574);
      }).toThrow('Invalid coordinates');

      expect(() => {
        haversineDistance(47.497913, -Infinity, 47.50587, 19.063574);
      }).toThrow('Invalid coordinates');
    });

    it('should handle negative coordinates (southern/western hemisphere)', () => {
      // São Paulo, Brazil
      const saoPauloLat = -23.5505;
      const saoPauloLon = -46.6333;

      // Rio de Janeiro, Brazil
      const rioLat = -22.9068;
      const rioLon = -43.1729;

      const distance = haversineDistance(saoPauloLat, saoPauloLon, rioLat, rioLon);

      // Expected distance: ~350-400 km
      const distanceKm = distance / 1000;
      expect(distanceKm).toBeGreaterThan(350);
      expect(distanceKm).toBeLessThan(450);
    });
  });

  describe('walkingTimeMinutes', () => {
    it('should calculate walking time for 500 meters correctly', () => {
      const time = walkingTimeMinutes(500);

      // 500m at 5 km/h = 0.5 km / 5 km/h = 0.1 hours = 6 minutes
      expect(time).toBe(6);
    });

    it('should calculate walking time for 1000 meters correctly', () => {
      const time = walkingTimeMinutes(1000);

      // 1000m at 5 km/h = 1 km / 5 km/h = 0.2 hours = 12 minutes
      expect(time).toBe(12);
    });

    it('should return 0 minutes for 0 meters', () => {
      const time = walkingTimeMinutes(0);
      expect(time).toBe(0);
    });

    it('should round up to nearest minute', () => {
      // 100 meters should be 1.2 minutes, rounded up to 2
      const time1 = walkingTimeMinutes(100);
      expect(time1).toBe(2);

      // 250 meters should be 3 minutes
      const time2 = walkingTimeMinutes(250);
      expect(time2).toBe(3);

      // 417 meters should be exactly 5 minutes (5.004 minutes)
      const time3 = walkingTimeMinutes(417);
      expect(time3).toBe(6); // Rounded up
    });

    it('should handle large distances', () => {
      // 5000 meters = 5 km at 5 km/h = 1 hour = 60 minutes
      const time = walkingTimeMinutes(5000);
      expect(time).toBe(60);
    });

    it('should throw error for negative distance', () => {
      expect(() => {
        walkingTimeMinutes(-100);
      }).toThrow('Invalid distance: cannot be negative');
    });

    it('should throw error for NaN distance', () => {
      expect(() => {
        walkingTimeMinutes(NaN);
      }).toThrow('Invalid distance: must be a finite number');
    });

    it('should throw error for Infinity distance', () => {
      expect(() => {
        walkingTimeMinutes(Infinity);
      }).toThrow('Invalid distance: must be a finite number');
    });
  });

  describe('isWalkable', () => {
    it('should return true for stops within walking distance', () => {
      // Two stops 500 meters apart
      const lat1 = 47.497913;
      const lon1 = 19.054057;
      const lat2 = 47.502413; // ~500m north
      const lon2 = 19.054057;

      const walkable = isWalkable(lat1, lon1, lat2, lon2);
      expect(walkable).toBe(true);
    });

    it('should return false for stops too far apart', () => {
      // Deák Ferenc tér to Oktogon (~1000m)
      const deakLat = 47.497913;
      const deakLon = 19.054057;
      const oktogonLat = 47.50587;
      const oktogonLon = 19.063574;

      const walkable = isWalkable(deakLat, deakLon, oktogonLat, oktogonLon);
      expect(walkable).toBe(false); // Exceeds MAX_WALKING_DISTANCE_METERS
    });

    it('should return false for stops too close (below minimum)', () => {
      // Two stops 30 meters apart (below MIN_WALKING_DISTANCE_METERS)
      const lat1 = 47.497913;
      const lon1 = 19.054057;
      const lat2 = 47.498183; // ~30m north
      const lon2 = 19.054057;

      const walkable = isWalkable(lat1, lon1, lat2, lon2);
      expect(walkable).toBe(false);
    });

    it('should return false for identical coordinates', () => {
      const lat = 47.497913;
      const lon = 19.054057;

      const walkable = isWalkable(lat, lon, lat, lon);
      expect(walkable).toBe(false); // 0 meters, below minimum
    });

    it('should return false for invalid coordinates', () => {
      const walkable = isWalkable(NaN, 19.054057, 47.50587, 19.063574);
      expect(walkable).toBe(false);
    });

    it('should return true for stops at boundary of walking distance', () => {
      // Create two points approximately 700m apart (safely within range)
      // At Budapest latitude (~47.5°), 1 degree lat ≈ 111km
      // So 700m ≈ 0.0063 degrees
      const lat1 = 47.497913;
      const lon1 = 19.054057;
      const lat2 = lat1 + 700 / 111000; // ~700m north
      const lon2 = lon1;

      const distance = haversineDistance(lat1, lon1, lat2, lon2);
      const walkable = isWalkable(lat1, lon1, lat2, lon2);

      // Should be within acceptable range
      expect(distance).toBeGreaterThan(MIN_WALKING_DISTANCE_METERS);
      expect(distance).toBeLessThan(MAX_WALKING_DISTANCE_METERS);
      expect(walkable).toBe(true);
    });
  });

  describe('Constants', () => {
    it('should export MAX_WALKING_DISTANCE_METERS', () => {
      expect(MAX_WALKING_DISTANCE_METERS).toBe(800);
    });

    it('should export MIN_WALKING_DISTANCE_METERS', () => {
      expect(MIN_WALKING_DISTANCE_METERS).toBe(50);
    });

    it('should have MIN less than MAX', () => {
      expect(MIN_WALKING_DISTANCE_METERS).toBeLessThan(MAX_WALKING_DISTANCE_METERS);
    });
  });
});
