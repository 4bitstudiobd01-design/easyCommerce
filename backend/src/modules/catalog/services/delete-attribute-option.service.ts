import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttributeOptionEntity } from '../entities/attribute-option.entity';

@Injectable()
export class DeleteAttributeOptionService {
  constructor(
    @InjectRepository(AttributeOptionEntity)
    private readonly optionRepository: Repository<AttributeOptionEntity>,
  ) {}

  async execute(optionId: string, tenantId: string): Promise<{ success: boolean; message: string }> {
    const option = await this.optionRepository.findOne({
      where: { id: optionId, tenantId },
    });

    if (!option) {
      throw new NotFoundException('Attribute option not found');
    }

    await this.optionRepository.remove(option);
    return { success: true, message: 'Option deleted successfully' };
  }
}
