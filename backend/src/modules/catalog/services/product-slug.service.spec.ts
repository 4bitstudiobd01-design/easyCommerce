import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductSlugService } from './product-slug.service';
import { ProductEntity } from '../entities/product.entity';

describe('ProductSlugService', () => {
  let service: ProductSlugService;
  let repository: any;

  const mockTenantId = 'tenant-uuid-1';

  beforeEach(async () => {
    repository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductSlugService,
        {
          provide: getRepositoryToken(ProductEntity),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<ProductSlugService>(ProductSlugService);
  });

  it('should clean and slugify English product names properly', () => {
    const slug = service.slugify('  Men\'s Cotton T-Shirt!!  ');
    expect(slug).toBe('mens-cotton-t-shirt');
  });

  it('should preserve Bangla Unicode characters in generated slugs', () => {
    const slug = service.slugify('প্রিমিয়াম সুতি টি-শার্ট');
    expect(slug).toBe('প্রিমিয়াম-সুতি-টি-শার্ট');
  });

  it('should return base slug if no collision exists for tenant', async () => {
    repository.findOne.mockResolvedValue(null);

    const slug = await service.generateSlug('Organic Tea', mockTenantId);
    expect(slug).toBe('organic-tea');
    expect(repository.findOne).toHaveBeenCalledWith({
      where: { tenantId: mockTenantId, slug: 'organic-tea' },
      select: ['id', 'tenantId', 'slug'],
    });
  });

  it('should increment slug counter if collision exists for tenant', async () => {
    repository.findOne
      .mockResolvedValueOnce({ id: 'p1', tenantId: mockTenantId, slug: 'organic-tea' })
      .mockResolvedValueOnce({ id: 'p2', tenantId: mockTenantId, slug: 'organic-tea-1' })
      .mockResolvedValueOnce(null);

    const slug = await service.generateSlug('Organic Tea', mockTenantId);
    expect(slug).toBe('organic-tea-2');
  });

  it('should allow current product to retain its own slug during update', async () => {
    repository.findOne.mockResolvedValue({ id: 'p1', tenantId: mockTenantId, slug: 'organic-tea' });

    const slug = await service.generateSlug('Organic Tea', mockTenantId, 'p1');
    expect(slug).toBe('organic-tea');
  });
});
