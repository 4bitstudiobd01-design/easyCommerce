import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerEntity, CustomerStatusEnum, CustomerSourceEnum } from '../entities/customer.entity';
import { ImportCustomersDto } from '../dto/import-customer.dto';
import { RecordCustomerActivityService } from './record-customer-activity.service';

@Injectable()
export class ImportCustomersService {
  constructor(
    @InjectRepository(CustomerEntity)
    private readonly customerRepository: Repository<CustomerEntity>,
    private readonly recordActivityService: RecordCustomerActivityService,
  ) {}

  async execute(
    tenantId: string,
    dto: ImportCustomersDto,
    storeId?: string,
    actorName = 'Merchant',
  ): Promise<{ created: number; updated: number; skipped: number; failed: number }> {
    if (!dto.customers || dto.customers.length === 0) {
      throw new BadRequestException('Import payload must contain at least one customer row.');
    }

    // 1. Fetch existing customers for tenant to check duplicates
    const existingCustomers = await this.customerRepository.find({
      where: { tenantId },
    });

    const existingPhones = new Set(existingCustomers.map((c) => c.phone.trim()));
    const existingEmails = new Set(
      existingCustomers.filter((c) => c.email && c.email.trim()).map((c) => c.email!.trim().toLowerCase()),
    );

    const existingByPhoneMap = new Map<string, CustomerEntity>();
    for (const c of existingCustomers) {
      existingByPhoneMap.set(c.phone.trim(), c);
    }

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    const toInsert: CustomerEntity[] = [];
    const toUpdate: CustomerEntity[] = [];

    const seenInBatchPhones = new Set<string>();
    const seenInBatchEmails = new Set<string>();

    for (const row of dto.customers) {
      const phone = (row.phone || '').trim();
      const email = (row.email || '').trim().toLowerCase();

      // Basic row validation
      if (!row.firstName || !row.lastName || !phone) {
        failedCount++;
        continue;
      }

      // Check intra-batch duplicates
      if (seenInBatchPhones.has(phone) || (email && seenInBatchEmails.has(email))) {
        skippedCount++;
        continue;
      }

      const isDbDuplicate = existingPhones.has(phone) || (email && existingEmails.has(email));

      if (isDbDuplicate) {
        if (dto.overwrite) {
          const existing = existingByPhoneMap.get(phone);
          if (existing) {
            existing.firstName = row.firstName.trim();
            existing.lastName = row.lastName.trim();
            if (email) existing.email = email;
            if (row.source) existing.source = row.source;
            if (row.status) existing.status = row.status;
            toUpdate.push(existing);
            updatedCount++;
          } else {
            skippedCount++;
          }
        } else {
          skippedCount++;
        }
        continue;
      }

      // Mark batch tracking
      seenInBatchPhones.add(phone);
      if (email) seenInBatchEmails.add(email);

      const entity = this.customerRepository.create({
        tenantId,
        storeId,
        firstName: row.firstName.trim(),
        lastName: row.lastName.trim(),
        email: email || undefined,
        phone,
        source: row.source || CustomerSourceEnum.IMPORT,
        status: row.status || CustomerStatusEnum.ACTIVE,
      });

      toInsert.push(entity);
      createdCount++;
    }

    if (toInsert.length > 0) {
      await this.customerRepository.save(toInsert);
    }

    if (toUpdate.length > 0) {
      await this.customerRepository.save(toUpdate);
    }

    // Record activity event
    if (createdCount > 0 || updatedCount > 0) {
      const firstId = toInsert.length > 0 ? toInsert[0].id : toUpdate[0]?.id;
      if (firstId) {
        await this.recordActivityService.execute({
          tenantId,
          storeId,
          customerId: firstId,
          eventType: 'CUSTOMER_IMPORT_COMPLETED',
          title: 'Customers Batch Import Completed',
          description: `Imported ${createdCount} new customer(s), updated ${updatedCount}, skipped ${skippedCount} duplicate(s).`,
          actorName,
          metadata: { createdCount, updatedCount, skippedCount, failedCount },
        });
      }
    }

    return {
      created: createdCount,
      updated: updatedCount,
      skipped: skippedCount,
      failed: failedCount,
    };
  }
}
