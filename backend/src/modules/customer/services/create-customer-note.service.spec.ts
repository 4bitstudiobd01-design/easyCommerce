import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { CreateCustomerNoteService } from './create-customer-note.service';
import { RecordCustomerActivityService } from './record-customer-activity.service';
import { CustomerNoteEntity } from '../entities/customer-note.entity';
import { CustomerEntity } from '../entities/customer.entity';

describe('CreateCustomerNoteService', () => {
  let service: CreateCustomerNoteService;
  let noteRepository: any;
  let customerRepository: any;
  let recordActivityService: any;

  const mockTenantId = 'tenant-1';
  const mockCustomerId = 'cust-1';

  beforeEach(async () => {
    noteRepository = {
      create: jest.fn((dto) => ({ id: 'note-1', ...dto })),
      save: jest.fn((entity) => Promise.resolve(entity)),
    };

    customerRepository = {
      findOne: jest.fn(),
    };

    recordActivityService = {
      execute: jest.fn().mockResolvedValue({ id: 'act-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateCustomerNoteService,
        {
          provide: getRepositoryToken(CustomerNoteEntity),
          useValue: noteRepository,
        },
        {
          provide: getRepositoryToken(CustomerEntity),
          useValue: customerRepository,
        },
        {
          provide: RecordCustomerActivityService,
          useValue: recordActivityService,
        },
      ],
    }).compile();

    service = module.get<CreateCustomerNoteService>(CreateCustomerNoteService);
  });

  it('should create an internal note and record a NOTE_ADDED activity event', async () => {
    customerRepository.findOne.mockResolvedValue({ id: mockCustomerId, tenantId: mockTenantId });

    const dto = { content: 'Customer requested delivery after 6 PM' };
    const result = await service.execute(mockCustomerId, mockTenantId, dto, 'user-1', 'Belal');

    expect(result).toBeDefined();
    expect(result.content).toBe('Customer requested delivery after 6 PM');
    expect(result.authorName).toBe('Belal');
    expect(recordActivityService.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'NOTE_ADDED',
        actorName: 'Belal',
      }),
    );
  });

  it('should throw NotFoundException if customer does not exist for tenant', async () => {
    customerRepository.findOne.mockResolvedValue(null);

    await expect(
      service.execute('invalid-cust', mockTenantId, { content: 'Test note' }),
    ).rejects.toThrow(NotFoundException);
  });
});
