import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeadEntity } from '../entities/lead.entity';
import { LeadQueryDto } from '../dto/lead-query.dto';
import { OrderEntity } from '../../order/entities/order.entity';

@Injectable()
export class ListLeadsService {
  constructor(
    @InjectRepository(LeadEntity)
    private readonly leadRepository: Repository<LeadEntity>,
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
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

    if (dto?.followUpFilter) {
      if (dto.followUpFilter === 'MISSED') {
        qb.andWhere(
          'lead.nextFollowUpAt IS NOT NULL AND lead.nextFollowUpAt < NOW() AND lead.stage NOT IN (:...closedStages)',
          { closedStages: ['CONTACTED', 'WON', 'LOST'] },
        );
      } else if (dto.followUpFilter === 'TODAY') {
        qb.andWhere(
          'lead.nextFollowUpAt IS NOT NULL AND DATE(lead.nextFollowUpAt) = CURRENT_DATE',
        );
      } else if (dto.followUpFilter === 'TOMORROW') {
        qb.andWhere(
          "lead.nextFollowUpAt IS NOT NULL AND DATE(lead.nextFollowUpAt) = CURRENT_DATE + INTERVAL '1 day'",
        );
      } else if (dto.followUpFilter === 'UPCOMING') {
        qb.andWhere('lead.nextFollowUpAt IS NOT NULL AND lead.nextFollowUpAt > NOW()');
      }
    }

    if (dto?.followUpDate) {
      qb.andWhere('lead.nextFollowUpAt IS NOT NULL AND DATE(lead.nextFollowUpAt) = :fDate', {
        fDate: dto.followUpDate,
      });
    }

    qb.orderBy('lead.createdAt', 'DESC');

    const leads = await qb.getMany();

    // Fetch and attach customer orders & purchased items
    if (leads.length > 0) {
      try {
        const orders = await this.orderRepository.find({
          where: { tenantId },
          relations: ['items'],
          order: { createdAt: 'DESC' },
          take: 500,
        });

        const normalizePhone = (p?: string | null) => (p || '').replace(/\D/g, '').slice(-10);

        for (const lead of leads) {
          const leadCleanPhone = normalizePhone(lead.phone);
          const leadCleanEmail = lead.email?.trim().toLowerCase();

          const matchingOrders = orders.filter((o) => {
            const orderCleanPhone = normalizePhone(o.customerPhone);
            const orderCleanEmail = o.customerEmail?.trim().toLowerCase();

            const isCustomerMatch = Boolean(lead.convertedCustomerId && o.customerId === lead.convertedCustomerId);
            const isPhoneMatch = Boolean(leadCleanPhone && orderCleanPhone && leadCleanPhone === orderCleanPhone);
            const isEmailMatch = Boolean(leadCleanEmail && orderCleanEmail && leadCleanEmail === orderCleanEmail);

            return isCustomerMatch || isPhoneMatch || isEmailMatch;
          });

          lead.orders = matchingOrders;
        }
      } catch (err) {
        console.warn('Failed to load orders for leads:', err);
      }
    }

    return leads;
  }
}
