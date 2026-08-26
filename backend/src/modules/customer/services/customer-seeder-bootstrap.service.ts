import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantEntity } from '../../tenant/entities/tenant.entity';
import { LeadEntity } from '../entities/lead.entity';
import { CustomerEntity } from '../entities/customer.entity';
import { SeedLeadsService } from './seed-leads.service';
import { SeedCustomersService } from './seed-customers.service';

@Injectable()
export class CustomerSeederBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(CustomerSeederBootstrapService.name);

  constructor(
    @InjectRepository(TenantEntity)
    private readonly tenantRepository: Repository<TenantEntity>,
    @InjectRepository(LeadEntity)
    private readonly leadRepository: Repository<LeadEntity>,
    @InjectRepository(CustomerEntity)
    private readonly customerRepository: Repository<CustomerEntity>,
    private readonly seedLeadsService: SeedLeadsService,
    private readonly seedCustomersService: SeedCustomersService,
  ) {}

  async onModuleInit() {
    try {
      const tenants = await this.tenantRepository.find({ relations: ['stores'] });
      for (const tenant of tenants) {
        const storeId = tenant.stores?.[0]?.id;

        // Auto-seed leads if 0 exist
        const leadCount = await this.leadRepository.count({ where: { tenantId: tenant.id } });
        if (leadCount === 0) {
          await this.seedLeadsService.execute(tenant.id, storeId);
          this.logger.log(`Seeded 12 CRM pipeline leads for tenant "${tenant.name}" (${tenant.id})`);
        }

        // Auto-seed customers if 0 exist
        const customerCount = await this.customerRepository.count({ where: { tenantId: tenant.id } });
        if (customerCount === 0) {
          await this.seedCustomersService.execute(tenant.id, storeId);
          this.logger.log(`Seeded 5 Customer 360 records for tenant "${tenant.name}" (${tenant.id})`);
        }
      }
    } catch (error) {
      this.logger.warn(`CustomerSeederBootstrapService execution note: ${error.message}`);
    }
  }
}
