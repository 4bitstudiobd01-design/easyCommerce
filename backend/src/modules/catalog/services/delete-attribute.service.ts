import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttributeDefinitionEntity } from '../entities/attribute-definition.entity';

@Injectable()
export class DeleteAttributeService {
  constructor(
    @InjectRepository(AttributeDefinitionEntity)
    private readonly attributeRepository: Repository<AttributeDefinitionEntity>,
  ) {}

  async execute(attributeId: string, tenantId: string): Promise<{ success: boolean; message: string }> {
    const attribute = await this.attributeRepository.findOne({
      where: { id: attributeId, tenantId },
    });

    if (!attribute) {
      throw new NotFoundException('Attribute definition not found');
    }

    await this.attributeRepository.remove(attribute);
    return { success: true, message: 'Attribute deleted successfully' };
  }
}
