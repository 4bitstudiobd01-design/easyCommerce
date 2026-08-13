import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttributeDefinitionEntity } from '../entities/attribute-definition.entity';

@Injectable()
export class ListAttributesService {
  constructor(
    @InjectRepository(AttributeDefinitionEntity)
    private readonly attributeRepository: Repository<AttributeDefinitionEntity>,
  ) {}

  async execute(tenantId: string): Promise<AttributeDefinitionEntity[]> {
    return this.attributeRepository.find({
      where: { tenantId },
      relations: ['options'],
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }
}
