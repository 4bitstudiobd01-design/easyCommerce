import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupplierEntity } from '../entities/supplier.entity';
import { CreateSupplierDto } from '../dto/supplier.dto';

/**
 * Adds a supplier to a merchant store. Supplier names are unique per store so filters and
 * the PO/bill supplier pickers stay unambiguous.
 */
@Injectable()
export class CreateSupplierService {
  constructor(
    @InjectRepository(SupplierEntity)
    private readonly supplierRepository: Repository<SupplierEntity>,
  ) {}

  async execute(
    tenantId: string,
    storeId: string,
    dto: CreateSupplierDto,
    userId: string,
  ): Promise<SupplierEntity> {
    const name = dto.name.trim();
    const existing = await this.supplierRepository.findOne({ where: { storeId, name } });
    if (existing) {
      throw new BadRequestException('A supplier with this name already exists.');
    }

    return this.supplierRepository.save(
      this.supplierRepository.create({
        tenantId,
        storeId,
        name,
        contactPerson: dto.contactPerson?.trim(),
        email: dto.email?.trim(),
        phone: dto.phone?.trim(),
        location: dto.location?.trim(),
        status: dto.status,
        openingBalance: (dto.openingBalance ?? 0).toFixed(2),
        notes: dto.notes?.trim(),
        createdByUserId: userId,
      }),
    );
  }
}
