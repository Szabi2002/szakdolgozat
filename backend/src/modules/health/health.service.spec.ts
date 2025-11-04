import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from './health.service';
import { SupabaseService } from '@common/supabase/supabase.service';

describe('HealthService', () => {
  let service: HealthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: SupabaseService,
          useValue: {
            getClient: jest.fn().mockReturnValue({
              from: jest.fn().mockReturnThis(),
              select: jest.fn().mockReturnThis(),
              limit: jest.fn().mockResolvedValue({ data: [], error: null }),
              storage: {
                listBuckets: jest.fn().mockResolvedValue({ data: [] }),
              },
            }),
          },
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return health status', async () => {
    const result = await service.check();
    expect(result.status).toBe('ok');
    expect(result.version).toBe('0.1.0');
  });
});
