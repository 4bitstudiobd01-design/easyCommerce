import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { CustomerSegmentEntity, SegmentRuleGroup, SegmentRuleCondition } from '../entities/customer-segment.entity';
import { CustomerEntity } from '../entities/customer.entity';
import { CreateCustomerSegmentDto, UpdateCustomerSegmentDto } from '../dto/customer-segment.dto';

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

  async findAll(tenantId: string): Promise<(CustomerSegmentEntity & { customerCount: number })[]> {
    const segments = await this.segmentRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });

    const result: (CustomerSegmentEntity & { customerCount: number })[] = [];

    for (const segment of segments) {
      const count = await this.evaluateSegmentCount(tenantId, segment.rules);
      result.push({
        ...segment,
        customerCount: count,
      });
    }

    return result;
  }

  async findById(id: string, tenantId: string): Promise<CustomerSegmentEntity & { customerCount: number }> {
    const segment = await this.segmentRepository.findOne({
      where: { id, tenantId },
    });

    if (!segment) {
      throw new NotFoundException(`Customer segment with ID "${id}" not found.`);
    }

    const count = await this.evaluateSegmentCount(tenantId, segment.rules);

    return {
      ...segment,
      customerCount: count,
    };
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
    const count = await this.evaluateSegmentCount(tenantId, rules);
    return { customerCount: count };
  }

  async evaluateSegmentCount(tenantId: string, rules: SegmentRuleGroup): Promise<number> {
    const qb = this.customerRepository.createQueryBuilder('c')
      .where('c.tenantId = :tenantId', { tenantId });

    this.applySegmentRulesToQuery(qb, rules, tenantId);

    return qb.getCount();
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

    // Subquery for order stats if rules involve ordersCount, totalSpent, or daysSinceLastOrder
    const needsOrdersSubquery = rules.conditions.some((c) =>
      ['ordersCount', 'totalSpent', 'daysSinceLastOrder'].includes(c.field),
    );

    if (needsOrdersSubquery) {
      qb.leftJoin(
        (subQb) => {
          return subQb
            .select('COALESCE(o."customerId", o."customerPhone")', 'cust_key')
            .addSelect('COUNT(o.id)::int', 'orders_count')
            .addSelect('COALESCE(SUM(CASE WHEN o."orderStatus" NOT IN (\'CANCELLED\', \'RETURNED\') THEN o."grandTotal" ELSE 0 END), 0)::numeric', 'total_spent')
            .addSelect('MAX(o."createdAt")', 'last_order_at')
            .from('orders', 'o')
            .where('o."tenantId" = :tId', { tId: tenantId })
            .groupBy('COALESCE(o."customerId", o."customerPhone")');
        },
        'ostats',
        'ostats.cust_key = c.id OR ostats.cust_key = c.phone',
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
}
