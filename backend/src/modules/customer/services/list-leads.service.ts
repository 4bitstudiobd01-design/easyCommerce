import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeadEntity } from '../entities/lead.entity';
import { LeadQueryDto } from '../dto/lead-query.dto';

@Injectable()
export class ListLeadsService {
  constructor(
    @InjectRepository(LeadEntity)
    private readonly leadRepository: Repository<LeadEntity>,
  ) {}

  async execute(tenantId: string, dto?: LeadQueryDto, storeId?: string): Promise<LeadEntity[]> {
    const qb = this.leadRepository.createQueryBuilder('lead')
      .where('lead.tenantId = :tenantId', { tenantId });

    if (storeId) {
      qb.andWhere('(lead.storeId = :storeId OR lead.storeId IS NULL)', { storeId });
    }

    if (dto?.stage) {
      qb.andWhere('lead.stage = :stage', { stage: dto.stage });
    }

    if (dto?.source) {
      qb.andWhere('lead.source = :source', { source: dto.source });
    }

    if (dto?.search && dto.search.trim() !== '') {
      const s = `%${dto.search.trim()}%`;
      qb.andWhere(
        '(lead.name ILIKE :s OR lead.phone ILIKE :s OR lead.email ILIKE :s OR lead.companyName ILIKE :s)',
        { s },
      );
    }

    qb.orderBy('lead.createdAt', 'DESC');

    return qb.getMany();
  }
}

