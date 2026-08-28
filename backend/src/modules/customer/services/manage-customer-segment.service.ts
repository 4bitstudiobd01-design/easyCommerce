import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { CustomerSegmentEntity, SegmentRuleGroup, SegmentRuleCondition } from '../entities/customer-segment.entity';
import { CustomerEntity } from '../entities/customer.entity';
import { CreateCustomerSegmentDto, UpdateCustomerSegmentDto } from '../dto/customer-segment.dto';

export interface SegmentWithMetrics extends CustomerSegmentEntity {
  customerCount: number;
  avgSpend: number;
  color?: string;
  type: 'DYNAMIC' | 'STATIC';
  criteria?: {
    minOrders?: number;
    maxOrders?: number;
    minSpend?: number;
    maxSpend?: number;
    daysSinceLastOrder?: number;
  };
}

@Injectable()
export class ManageCustomerSegmentService {
  constructor(
    @InjectRepository(CustomerSegmentEntity)
    private readonly segmentRepository: Repository<CustomerSegmentEntity>,
    @InjectRepository(CustomerEntity)
    private readonly customerRepository: Repository<CustomerEntity>,
  ) {}

  async create(tenantId: string, dto: CreateCustomerSegmentDto, storeId?: string): Promise<CustomerSegmentEntity> {
    const segment = this.segmentRepository.create({
      tenantId,
      storeId,
      name: dto.name.trim(),
      description: dto.description?.trim(),
      rules: dto.rules as any,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
    });

    return this.segmentRepository.save(segment);
  }

  async findAll(tenantId: string): Promise<SegmentWithMetrics[]> {
    const segments = await this.segmentRepository.find({
      where: { tenantId },
      order: { createdAt: 'ASC' },
    });

    const result: SegmentWithMetrics[] = [];

    const defaultColors = ['#8B5CF6', '#3B82F6', '#F59E0B', '#10B981', '#EC4899', '#64748B'];

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const metrics = await this.evaluateSegmentMetrics(tenantId, segment.rules);

      // Extract criteria summary from rules
      const criteria: any = {};
      if (segment.rules?.conditions) {
        for (const cond of segment.rules.conditions) {
          if (cond.field === 'ordersCount' && (cond.operator === 'gte' || cond.operator === 'gt')) {
            criteria.minOrders = Number(cond.value);
          } else if (cond.field === 'ordersCount' && (cond.operator === 'lte' || cond.operator === 'lt' || cond.operator === 'eq')) {
            criteria.maxOrders = Number(cond.value);
          } else if (cond.field === 'totalSpent' && (cond.operator === 'gte' || cond.operator === 'gt')) {
            criteria.minSpend = Number(cond.value);
          } else if (cond.field === 'totalSpent' && (cond.operator === 'lte' || cond.operator === 'lt')) {
            criteria.maxSpend = Number(cond.value);
          } else if (cond.field === 'daysSinceLastOrder') {
            criteria.daysSinceLastOrder = Number(cond.value);
          }
        }
      }

      result.push({
        ...segment,
        type: 'DYNAMIC',
        customerCount: metrics.customerCount,
        avgSpend: metrics.avgSpend,
        color: defaultColors[i % defaultColors.length],
        criteria,
      });
    }

    return result;
  }

  async findById(id: string, tenantId: string): Promise<SegmentWithMetrics> {
    const segment = await this.segmentRepository.findOne({
      where: { id, tenantId },
    });

    if (!segment) {
      throw new NotFoundException(`Customer segment with ID "${id}" not found.`);
    }

    const metrics = await this.evaluateSegmentMetrics(tenantId, segment.rules);

    return {
      ...segment,
      type: 'DYNAMIC',
      customerCount: metrics.customerCount,
      avgSpend: metrics.avgSpend,
    };
  }

  async findSegmentCustomers(id: string, tenantId: string): Promise<any[]> {
    const segment = await this.segmentRepository.findOne({ where: { id, tenantId } });
    if (!segment) {
      throw new NotFoundException(`Customer segment with ID "${id}" not found.`);
    }

    const qb = this.customerRepository.createQueryBuilder('c')
      .where('c.tenantId = :tenantId', { tenantId });

    this.applySegmentRulesToQuery(qb, segment.rules, tenantId);

    // Join orders aggregated stats
    qb.leftJoin(
      (subQb) => {
        return subQb
          .select('COALESCE(o."customerId"::text, o."customerPhone")', 'cust_key')
          .addSelect('COUNT(o.id)::int', 'orders_count')
          .addSelect('COALESCE(SUM(CASE WHEN o."orderStatus" NOT IN (\'CANCELLED\', \'RETURNED\') THEN o."grandTotal" ELSE 0 END), 0)::numeric', 'total_spent')
          .addSelect('MAX(o."createdAt")', 'last_order_at')
          .from('orders', 'o')
          .where('o."tenantId" = :tId', { tId: tenantId })
          .groupBy('COALESCE(o."customerId"::text, o."customerPhone")');
      },
      'cust_stats',
      'cust_stats.cust_key = c.id::text OR cust_stats.cust_key = c.phone',
    );

    qb.select('c.id', 'id')
      .addSelect('c.firstName', 'firstName')
      .addSelect('c.lastName', 'lastName')
      .addSelect('c.email', 'email')
      .addSelect('c.phone', 'phone')
      .addSelect('c.status', 'status')
      .addSelect('c.source', 'source')
      .addSelect('c.createdAt', 'createdAt')
      .addSelect('COALESCE(cust_stats.orders_count, 0)::int', 'ordersCount')
      .addSelect('COALESCE(cust_stats.total_spent, 0)::numeric', 'totalSpent')
      .addSelect('cust_stats.last_order_at', 'lastOrderAt')
      .orderBy('COALESCE(cust_stats.total_spent, 0)', 'DESC');

    const rows = await qb.getRawMany();
    return rows.map((r) => ({
      ...r,
      fullName: `${r.firstName || ''} ${r.lastName || ''}`.trim() || 'Valued Customer',
      ordersCount: Number(r.ordersCount || 0),
      totalSpent: Number(r.totalSpent || 0),
      avgOrderValue: r.ordersCount > 0 ? Math.round(Number(r.totalSpent) / Number(r.ordersCount)) : 0,
    }));
  }

  async update(id: string, tenantId: string, dto: UpdateCustomerSegmentDto): Promise<CustomerSegmentEntity> {
    const segment = await this.segmentRepository.findOne({ where: { id, tenantId } });
    if (!segment) {
      throw new NotFoundException(`Customer segment with ID "${id}" not found.`);
    }

    if (dto.name !== undefined) segment.name = dto.name.trim();
    if (dto.description !== undefined) segment.description = dto.description.trim();
    if (dto.rules !== undefined) segment.rules = dto.rules as any;
    if (dto.isActive !== undefined) segment.isActive = dto.isActive;

    return this.segmentRepository.save(segment);
  }

  async delete(id: string, tenantId: string): Promise<{ success: boolean }> {
    const segment = await this.segmentRepository.findOne({ where: { id, tenantId } });
    if (!segment) {
      throw new NotFoundException(`Customer segment with ID "${id}" not found.`);
    }

    await this.segmentRepository.remove(segment);
    return { success: true };
  }

  async preview(tenantId: string, rules: SegmentRuleGroup): Promise<{ customerCount: number }> {
    const metrics = await this.evaluateSegmentMetrics(tenantId, rules);
    return { customerCount: metrics.customerCount };
  }

  async evaluateSegmentMetrics(tenantId: string, rules: SegmentRuleGroup): Promise<{ customerCount: number; avgSpend: number }> {
    const qb = this.customerRepository.createQueryBuilder('c')
      .where('c.tenantId = :tenantId', { tenantId });

    this.applySegmentRulesToQuery(qb, rules, tenantId);

    qb.leftJoin(
      (subQb) => {
        return subQb
          .select('COALESCE(o."customerId"::text, o."customerPhone")', 'cust_key')
          .addSelect('COALESCE(SUM(CASE WHEN o."orderStatus" NOT IN (\'CANCELLED\', \'RETURNED\') THEN o."grandTotal" ELSE 0 END), 0)::numeric', 'cust_spent')
          .from('orders', 'o')
          .where('o."tenantId" = :tId', { tId: tenantId })
          .groupBy('COALESCE(o."customerId"::text, o."customerPhone")');
      },
      'c_spent_stats',
      'c_spent_stats.cust_key = c.id::text OR c_spent_stats.cust_key = c.phone',
    );

    qb.select('COUNT(DISTINCT c.id)::int', 'count')
      .addSelect('COALESCE(AVG(c_spent_stats.cust_spent), 0)::numeric', 'avg_spend');

    const raw = await qb.getRawOne();
    return {
      customerCount: Number(raw?.count || 0),
      avgSpend: Math.round(Number(raw?.avg_spend || 0)),
    };
  }

  public applySegmentRulesToQuery(
    qb: SelectQueryBuilder<CustomerEntity>,
    rules: SegmentRuleGroup,
    tenantId: string,
  ): void {
    if (!rules || !rules.conditions || rules.conditions.length === 0) {
      return;
    }

    const matchType = rules.matchType === 'ANY' ? 'OR' : 'AND';

    const needsOrdersSubquery = rules.conditions.some((c) =>
      ['ordersCount', 'totalSpent', 'daysSinceLastOrder'].includes(c.field),
    );

    if (needsOrdersSubquery) {
      qb.leftJoin(
        (subQb) => {
          return subQb
            .select('COALESCE(o."customerId"::text, o."customerPhone")', 'cust_key')
            .addSelect('COUNT(o.id)::int', 'orders_count')
            .addSelect('COALESCE(SUM(CASE WHEN o."orderStatus" NOT IN (\'CANCELLED\', \'RETURNED\') THEN o."grandTotal" ELSE 0 END), 0)::numeric', 'total_spent')
            .addSelect('MAX(o."createdAt")', 'last_order_at')
            .from('orders', 'o')
            .where('o."tenantId" = :tId', { tId: tenantId })
            .groupBy('COALESCE(o."customerId"::text, o."customerPhone")');
        },
        'ostats',
        'ostats.cust_key = c.id::text OR ostats.cust_key = c.phone',
      );
    }

    const clauses: string[] = [];
    const params: Record<string, any> = {};

    rules.conditions.forEach((cond, idx) => {
      const pName = `seg_val_${idx}`;

      let colExpr = '';
      if (cond.field === 'ordersCount') {
        colExpr = 'COALESCE(ostats.orders_count, 0)';
      } else if (cond.field === 'totalSpent') {
        colExpr = 'COALESCE(ostats.total_spent, 0)';
      } else if (cond.field === 'daysSinceLastOrder') {
        colExpr = 'EXTRACT(DAY FROM (NOW() - ostats.last_order_at))';
      } else if (cond.field === 'status') {
        colExpr = 'c.status';
      } else if (cond.field === 'origin') {
        colExpr = 'LOWER(COALESCE(NULLIF(c."registrationUtmSource", \'\'), NULLIF(c."registrationChannel", \'\'), \'direct\'))';
      } else if (cond.field === 'source') {
        colExpr = 'c.source';
      }

      if (!colExpr) return;

      let op = '=';
      if (cond.operator === 'neq') op = '!=';
      else if (cond.operator === 'gt') op = '>';
      else if (cond.operator === 'gte') op = '>=';
      else if (cond.operator === 'lt') op = '<';
      else if (cond.operator === 'lte') op = '<=';

      clauses.push(`${colExpr} ${op} :${pName}`);
      params[pName] = cond.value;
    });

    if (clauses.length > 0) {
      const combinedClause = `(${clauses.join(` ${matchType} `)})`;
      qb.andWhere(combinedClause, params);
    }
  }

  async seedDefaultSegments(tenantId: string): Promise<void> {
    const starterSegments = [
      {
        tenantId,
        name: 'High-Value VIP Spenders',
        description: 'Customers who spent over ৳20,000 across multiple completed orders.',
        rules: {
          matchType: 'ALL' as const,
          conditions: [
            { field: 'totalSpent' as const, operator: 'gte' as const, value: 20000 },
            { field: 'ordersCount' as const, operator: 'gte' as const, value: 3 },
          ],
        },
      },
      {
        tenantId,
        name: 'Loyal Repeat Buyers',
        description: 'Frequent buyers with 3 or more delivered purchases in store history.',
        rules: {
          matchType: 'ALL' as const,
          conditions: [
            { field: 'ordersCount' as const, operator: 'gte' as const, value: 3 },
          ],
        },
      },
      {
        tenantId,
        name: 'Active Verified Customers',
        description: 'Registered buyers actively engaging and placing regular orders.',
        rules: {
          matchType: 'ALL' as const,
          conditions: [
            { field: 'status' as const, operator: 'eq' as const, value: 'ACTIVE' },
          ],
        },
      },
      {
        tenantId,
        name: 'First-Time Buyers',
        description: 'Recent customers who completed their first successful purchase.',
        rules: {
          matchType: 'ALL' as const,
          conditions: [
            { field: 'ordersCount' as const, operator: 'eq' as const, value: 1 },
          ],
        },
      },
      {
        tenantId,
        name: 'New Registered Contacts',
        description: 'Prospects and guest profiles who have not placed a completed order yet.',
        rules: {
          matchType: 'ALL' as const,
          conditions: [
            { field: 'ordersCount' as const, operator: 'eq' as const, value: 0 },
          ],
        },
      },
      {
        tenantId,
        name: 'Guest Shoppers',
        description: 'Customers who made guest checkouts or unregistered store orders.',
        rules: {
          matchType: 'ALL' as const,
          conditions: [
            { field: 'status' as const, operator: 'eq' as const, value: 'GUEST' },
          ],
        },
      },
    ];

    for (const item of starterSegments) {
      const seg = this.segmentRepository.create({
        ...item,
        isActive: true,
      });
      await this.segmentRepository.save(seg);
    }
  }
}

