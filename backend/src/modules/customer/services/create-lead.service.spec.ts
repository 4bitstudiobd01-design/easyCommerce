import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CreateLeadService } from './create-lead.service';
import { LeadEntity, LeadStageEnum, LeadSourceEnum } from '../entities/lead.entity';
import { CustomerEntity, CustomerStatusEnum, CustomerAccountTypeEnum } from '../entities/customer.entity';

describe('CreateLeadService', () => {
  let service: CreateLeadService;
  let leadRepository: any;
  let customerRepository: any;

  const mockTenantId = 'tenant-1';

  beforeEach(async () => {
    leadRepository = {
      create: jest.fn((dto) => ({ id: 'lead-1', ...dto })),
      save: jest.fn((entity) => Promise.resolve({ id: 'lead-1', ...entity })),
    };

    customerRepository = {
      findOne: jest.fn(),
      create: jest.fn((dto) => ({ id: 'cust-1', ...dto })),
      save: jest.fn((entity) => Promise.resolve({ id: 'cust-1', ...entity })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateLeadService,
        {
          provide: getRepositoryToken(LeadEntity),
          useValue: leadRepository,
        },
        {
          provide: getRepositoryToken(CustomerEntity),
          useValue: customerRepository,
        },
      ],
    }).compile();

    service = module.get<CreateLeadService>(CreateLeadService);
  });

  it('should auto-create guest customer when lead is added with new phone', async () => {
    customerRepository.findOne.mockResolvedValue(null);

    const dto = {
      name: 'Tanvir Ahmed',
      phone: '01711223344',
      email: 'tanvir@example.com',
      estimatedValue: 25000,
      source: LeadSourceEnum.WHATSAPP,
    };

    const lead = await service.execute(mockTenantId, dto);

    expect(lead).toBeDefined();
    expect(lead.id).toBe('lead-1');
    expect(customerRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        phone: '01711223344',
        firstName: 'Tanvir',
        lastName: 'Ahmed',
        status: CustomerStatusEnum.GUEST,
        accountType: CustomerAccountTypeEnum.GUEST,
      })
    );
    expect(leadRepository.save).toHaveBeenCalled();
  });

  it('should link to existing customer if customer already exists', async () => {
    customerRepository.findOne.mockResolvedValue({ id: 'existing-cust-99', phone: '01711223344' });

    const dto = {
      name: 'Tanvir Ahmed',
      phone: '01711223344',
    };

    const lead = await service.execute(mockTenantId, dto);

    expect(lead).toBeDefined();
    expect(customerRepository.create).not.toHaveBeenCalled();
    expect(leadRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        convertedCustomerId: 'existing-cust-99',
      })
    );
  });
});
