import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { PlanTripDto } from './plan-trip.dto';

describe('PlanTripDto', () => {
  describe('Valid DTOs', () => {
    it('should validate with minimal required fields', async () => {
      const dto = plainToInstance(PlanTripDto, {
        from_stop_id: '123e4567-e89b-12d3-a456-426614174000',
        to_stop_id: '123e4567-e89b-12d3-a456-426614174001',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should use default values for optional fields', async () => {
      const dto = plainToInstance(PlanTripDto, {
        from_stop_id: '123e4567-e89b-12d3-a456-426614174000',
        to_stop_id: '123e4567-e89b-12d3-a456-426614174001',
      });

      expect(dto.include_walking).toBe(true);
      expect(dto.max_alternatives).toBe(3);
      expect(dto.preference).toBe('fastest');
    });

    it('should validate with all optional fields', async () => {
      const dto = plainToInstance(PlanTripDto, {
        from_stop_id: '123e4567-e89b-12d3-a456-426614174000',
        to_stop_id: '123e4567-e89b-12d3-a456-426614174001',
        include_walking: false,
        max_alternatives: 5,
        date: '2025-11-10',
        time: '14:30',
        preference: 'least_transfers',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
      expect(dto.include_walking).toBe(false);
      expect(dto.max_alternatives).toBe(5);
      expect(dto.preference).toBe('least_transfers');
    });

    it('should validate each preference option', async () => {
      const preferences = ['fastest', 'least_transfers', 'least_walking'];

      for (const pref of preferences) {
        const dto = plainToInstance(PlanTripDto, {
          from_stop_id: '123e4567-e89b-12d3-a456-426614174000',
          to_stop_id: '123e4567-e89b-12d3-a456-426614174001',
          preference: pref,
        });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      }
    });
  });

  describe('Invalid UUIDs', () => {
    it('should fail with invalid from_stop_id', async () => {
      const dto = plainToInstance(PlanTripDto, {
        from_stop_id: 'invalid-uuid',
        to_stop_id: '123e4567-e89b-12d3-a456-426614174001',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('from_stop_id');
      expect(errors[0].constraints).toHaveProperty('isUuid');
    });

    it('should fail with invalid to_stop_id', async () => {
      const dto = plainToInstance(PlanTripDto, {
        from_stop_id: '123e4567-e89b-12d3-a456-426614174000',
        to_stop_id: 'not-a-uuid',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('to_stop_id');
      expect(errors[0].constraints).toHaveProperty('isUuid');
    });

    it('should fail with missing from_stop_id', async () => {
      const dto = plainToInstance(PlanTripDto, {
        to_stop_id: '123e4567-e89b-12d3-a456-426614174001',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const fromStopError = errors.find((e) => e.property === 'from_stop_id');
      expect(fromStopError).toBeDefined();
    });

    it('should fail with missing to_stop_id', async () => {
      const dto = plainToInstance(PlanTripDto, {
        from_stop_id: '123e4567-e89b-12d3-a456-426614174000',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const toStopError = errors.find((e) => e.property === 'to_stop_id');
      expect(toStopError).toBeDefined();
    });
  });

  describe('max_alternatives validation', () => {
    it('should fail if max_alternatives is less than 1', async () => {
      const dto = plainToInstance(PlanTripDto, {
        from_stop_id: '123e4567-e89b-12d3-a456-426614174000',
        to_stop_id: '123e4567-e89b-12d3-a456-426614174001',
        max_alternatives: 0,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const maxAltError = errors.find((e) => e.property === 'max_alternatives');
      expect(maxAltError).toBeDefined();
      expect(maxAltError?.constraints).toHaveProperty('min');
    });

    it('should fail if max_alternatives is greater than 5', async () => {
      const dto = plainToInstance(PlanTripDto, {
        from_stop_id: '123e4567-e89b-12d3-a456-426614174000',
        to_stop_id: '123e4567-e89b-12d3-a456-426614174001',
        max_alternatives: 10,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const maxAltError = errors.find((e) => e.property === 'max_alternatives');
      expect(maxAltError).toBeDefined();
      expect(maxAltError?.constraints).toHaveProperty('max');
    });

    it('should fail if max_alternatives is not an integer', async () => {
      const dto = plainToInstance(PlanTripDto, {
        from_stop_id: '123e4567-e89b-12d3-a456-426614174000',
        to_stop_id: '123e4567-e89b-12d3-a456-426614174001',
        max_alternatives: 3.5,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const maxAltError = errors.find((e) => e.property === 'max_alternatives');
      expect(maxAltError).toBeDefined();
    });

    it('should accept valid max_alternatives values (1-5)', async () => {
      const validValues = [1, 2, 3, 4, 5];

      for (const value of validValues) {
        const dto = plainToInstance(PlanTripDto, {
          from_stop_id: '123e4567-e89b-12d3-a456-426614174000',
          to_stop_id: '123e4567-e89b-12d3-a456-426614174001',
          max_alternatives: value,
        });

        const errors = await validate(dto);
        const maxAltError = errors.find((e) => e.property === 'max_alternatives');
        expect(maxAltError).toBeUndefined();
      }
    });
  });

  describe('preference validation', () => {
    it('should fail if preference is invalid', async () => {
      const dto = plainToInstance(PlanTripDto, {
        from_stop_id: '123e4567-e89b-12d3-a456-426614174000',
        to_stop_id: '123e4567-e89b-12d3-a456-426614174001',
        preference: 'invalid_option' as any,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const prefError = errors.find((e) => e.property === 'preference');
      expect(prefError).toBeDefined();
      expect(prefError?.constraints).toHaveProperty('isEnum');
    });

    it('should accept all valid preference options', async () => {
      const validPreferences: Array<'fastest' | 'least_transfers' | 'least_walking'> = [
        'fastest',
        'least_transfers',
        'least_walking',
      ];

      for (const pref of validPreferences) {
        const dto = plainToInstance(PlanTripDto, {
          from_stop_id: '123e4567-e89b-12d3-a456-426614174000',
          to_stop_id: '123e4567-e89b-12d3-a456-426614174001',
          preference: pref,
        });

        const errors = await validate(dto);
        const prefError = errors.find((e) => e.property === 'preference');
        expect(prefError).toBeUndefined();
      }
    });
  });

  describe('include_walking validation', () => {
    it('should transform string to boolean when possible', async () => {
      // The Type transformer will convert 'yes' to NaN which becomes false
      // This test verifies the transformation behavior
      const dto = plainToInstance(PlanTripDto, {
        from_stop_id: '123e4567-e89b-12d3-a456-426614174000',
        to_stop_id: '123e4567-e89b-12d3-a456-426614174001',
        include_walking: 'true' as any,
      });

      const errors = await validate(dto);
      // Type() decorator will attempt transformation, so no validation error expected
      const walkingError = errors.find((e) => e.property === 'include_walking');
      expect(walkingError).toBeUndefined();
    });

    it('should accept both true and false for include_walking', async () => {
      const trueDto = plainToInstance(PlanTripDto, {
        from_stop_id: '123e4567-e89b-12d3-a456-426614174000',
        to_stop_id: '123e4567-e89b-12d3-a456-426614174001',
        include_walking: true,
      });

      const falseDto = plainToInstance(PlanTripDto, {
        from_stop_id: '123e4567-e89b-12d3-a456-426614174000',
        to_stop_id: '123e4567-e89b-12d3-a456-426614174001',
        include_walking: false,
      });

      const trueErrors = await validate(trueDto);
      const falseErrors = await validate(falseDto);

      expect(trueErrors.find((e) => e.property === 'include_walking')).toBeUndefined();
      expect(falseErrors.find((e) => e.property === 'include_walking')).toBeUndefined();
    });
  });

  describe('date and time validation', () => {
    it('should accept valid date format', async () => {
      const dto = plainToInstance(PlanTripDto, {
        from_stop_id: '123e4567-e89b-12d3-a456-426614174000',
        to_stop_id: '123e4567-e89b-12d3-a456-426614174001',
        date: '2025-11-10',
      });

      const errors = await validate(dto);
      const dateError = errors.find((e) => e.property === 'date');
      expect(dateError).toBeUndefined();
    });

    it('should accept valid time format', async () => {
      const dto = plainToInstance(PlanTripDto, {
        from_stop_id: '123e4567-e89b-12d3-a456-426614174000',
        to_stop_id: '123e4567-e89b-12d3-a456-426614174001',
        time: '14:30',
      });

      const errors = await validate(dto);
      const timeError = errors.find((e) => e.property === 'time');
      expect(timeError).toBeUndefined();
    });

    it('should accept both date and time together', async () => {
      const dto = plainToInstance(PlanTripDto, {
        from_stop_id: '123e4567-e89b-12d3-a456-426614174000',
        to_stop_id: '123e4567-e89b-12d3-a456-426614174001',
        date: '2025-11-10',
        time: '14:30',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('Type transformation', () => {
    it('should transform string "true" to boolean true', async () => {
      const dto = plainToInstance(PlanTripDto, {
        from_stop_id: '123e4567-e89b-12d3-a456-426614174000',
        to_stop_id: '123e4567-e89b-12d3-a456-426614174001',
        include_walking: 'true' as any,
      });

      expect(dto.include_walking).toBe(true);
    });

    it('should transform string number to integer', async () => {
      const dto = plainToInstance(PlanTripDto, {
        from_stop_id: '123e4567-e89b-12d3-a456-426614174000',
        to_stop_id: '123e4567-e89b-12d3-a456-426614174001',
        max_alternatives: '4' as any,
      });

      expect(dto.max_alternatives).toBe(4);
      expect(typeof dto.max_alternatives).toBe('number');
    });
  });
});
