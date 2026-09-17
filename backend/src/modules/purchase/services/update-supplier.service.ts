import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { SupplierEntity } from '../entities/supplier.entity';
import { UpdateSupplierDto } from '../dto/supplier.dto';

/**
 * Edits a supplier in the active store. A rename is rejected if it collides with another
 * supplier in the same store.
 */
@Injectable()
export class UpdateSupplierService {
  constructor(
    @InjectRepository(SupplierEntity)
    private readonly supplierRepository: Repository<SupplierEntity>,
  ) {}

  async execute(
    storeId: string,
    id: string,
    dto: UpdateSupplierDto,
  ): Promise<SupplierEntity> {
    const supplier = await this.supplierRepository.findOne({ where: { id, storeId } });
    if (!supplier) {
      throw new NotFoundException('Supplier not found in this store.');
    }

    if (dto.name !== undefined) {
      const name = dto.name.trim();
      const clash = await this.supplierRepository.findOne({
        where: { storeId, name, id: Not(id) },
      });
      if (clash) {
        throw new BadRequestException('A supplier with this name already exists.');
      }
      supplier.name = name;
    }

    if (dto.contactPerson !== undefined) supplier.contactPerson = dto.contactPerson.trim();
    if (dto.email !== undefined) supplier.email = dto.email.trim();
    if (dto.phone !== undefined) supplier.phone = dto.phone.trim();
    if (dto.location !== undefined) supplier.location = dto.location.trim();
    if (dto.status !== undefined) supplier.status = dto.status;
    if (dto.openingBalance !== undefined) {
      supplier.openingBalance = dto.openingBalance.toFixed(2);
    }
    if (dto.notes !== undefined) supplier.notes = dto.notes.trim();

    return this.supplierRepository.save(supplier);
  }
}
