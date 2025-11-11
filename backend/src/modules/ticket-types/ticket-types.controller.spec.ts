import { Test, TestingModule } from '@nestjs/testing';
import { TicketTypesController } from './ticket-types.controller';
import { TicketTypesService } from './ticket-types.service';
import { AuthGuard } from '@common/guards/auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';

describe('TicketTypesController', () => {
  let controller: TicketTypesController;
  let service: TicketTypesService;

  const mockTicketTypesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findAllIncludingInactive: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  const mockRolesGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TicketTypesController],
      providers: [
        {
          provide: TicketTypesService,
          useValue: mockTicketTypesService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    controller = module.get<TicketTypesController>(TicketTypesController);
    service = module.get<TicketTypesService>(TicketTypesService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a ticket type', async () => {
      const createDto = {
        name: 'Single Ticket',
        type: 'single' as const,
        price: 350.0,
      };

      const mockTicketType = {
        id: '123',
        ...createDto,
        created_at: new Date().toISOString(),
      };

      mockTicketTypesService.create.mockResolvedValue(mockTicketType);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockTicketType);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return all active ticket types', async () => {
      const mockTicketTypes = [
        { id: '1', name: 'Single Ticket', price: 350.0 },
        { id: '2', name: 'Day Pass', price: 1650.0 },
      ];

      mockTicketTypesService.findAll.mockResolvedValue(mockTicketTypes);

      const result = await controller.findAll();

      expect(result).toEqual(mockTicketTypes);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a ticket type by ID', async () => {
      const mockTicketType = {
        id: '123',
        name: 'Single Ticket',
        price: 350.0,
      };

      mockTicketTypesService.findOne.mockResolvedValue(mockTicketType);

      const result = await controller.findOne('123');

      expect(result).toEqual(mockTicketType);
      expect(service.findOne).toHaveBeenCalledWith('123');
    });
  });

  describe('update', () => {
    it('should update a ticket type', async () => {
      const updateDto = { price: 400.0 };
      const mockUpdatedTicketType = {
        id: '123',
        name: 'Single Ticket',
        price: 400.0,
      };

      mockTicketTypesService.update.mockResolvedValue(mockUpdatedTicketType);

      const result = await controller.update('123', updateDto);

      expect(result).toEqual(mockUpdatedTicketType);
      expect(service.update).toHaveBeenCalledWith('123', updateDto);
    });
  });

  describe('remove', () => {
    it('should delete a ticket type', async () => {
      mockTicketTypesService.remove.mockResolvedValue(undefined);

      await controller.remove('123');

      expect(service.remove).toHaveBeenCalledWith('123');
    });
  });
});
