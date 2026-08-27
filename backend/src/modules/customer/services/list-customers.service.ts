import { Injectable, Optional, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CustomerEntity, CustomerStatusEnum } from '../entities/customer.entity';
import { CustomerSegmentEntity } from '../entities/customer-segment.entity';
import { CustomerListDto, ALLOWED_CUSTOMER_SORT_FIELDS } from '../dto/customer-list.dto';
import { roundMoney } from '../utils/money.util';

export interface CustomerListItem extends CustomerEntity {
  ordersCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
}

@Injectable()
export class ListCustomersService {
  constructor(
    @InjectRepository(CustomerEntity)
    private readonly customerRepository: Repository<CustomerEntity>,
    @InjectRepository(CustomerSegmentEntity)
    private readonly segmentRepository: Repository<CustomerSegmentEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async execute(tenantId: string, dto: CustomerListDto) {
    const page = Math.max(1, dto.page || 1);
    const limit = Math.min(100, Math.max(1, dto.limit || 20));
    const skip = (page - 1) * limit;

    // Build base query
    const query = this.customerRepository.createQueryBuilder('c')
      .where('c.tenantId = :tenantId', { tenantId });

    // Status filter
    if (dto.status) {
      query.andWhere('c.status = :status', { status: dto.status });
    }

    // Source filter
    if (dto.source) {
      query.andWhere('c.source = :source', { source: dto.source });
    }

    // Origin filter (matches registrationUtmSource or registrationChannel)
    if (dto.origin && dto.origin.trim() !== '' && dto.origin !== 'ALL') {
      const orig = dto.origin.trim().toLowerCase();
      query.andWhere(
        '(LOWER(c.registrationUtmSource) = :orig OR LOWER(c.registrationChannel) = :orig)',
        { orig },
      );
    }

    // Search filter
    if (dto.search && dto.search.trim() !== '') {
      const s = `%${dto.search.trim()}%`;
      query.andWhere(
        '(c.firstName ILIKE :s OR c.lastName ILIKE :s OR CONCAT(c.firstName, \' \', c.lastName) ILIKE :s OR c.email ILIKE :s OR c.phone ILIKE :s)',
        { s },
      );
    }

    // Date range filter
    let dateFromStr = dto.dateFrom;
    if (!dateFromStr && dto.dateRange && dto.dateRange !== 'ALL') {
      const days = parseInt(dto.dateRange, 10);
      if (Number.isFinite(days) && days > 0) {
        dateFromStr = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      }
    }

    if (dateFromStr) {
      query.andWhere('c.createdAt >= :dateFromStr', { dateFromStr });
    }
    if (dto.dateTo) {
      query.andWhere('c.createdAt <= :dateTo', { dateTo: dto.dateTo });
    }

    // Segment Filter
    if (dto.segmentId) {
      const segment = await this.segmentRepository.findOne({
        where: { id: dto.segmentId, tenantId },
      });

      if (segment && segment.rules && segment.rules.conditions && segment.rules.conditions.length > 0) {
        const matchType = segment.rules.matchType === 'ANY' ? 'OR' : 'AND';
        const needsOrdersSubquery = segment.rules.conditions.some((cond) =>
          ['ordersCount', 'totalSpent', 'daysSinceLastOrder'].includes(cond.field),
        );

        if (needsOrdersSubquery) {
          query.leftJoin(
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
            'ostats_seg',
            'ostats_seg.cust_key = c.id::text OR ostats_seg.cust_key = c.phone',
          );
        }

        const clauses: string[] = [];
        const params: Record<string, any> = {};

        segment.rules.conditions.forEach((cond, idx) => {
          const pName = `seg_filter_${idx}`;
          let colExpr = '';
          if (cond.field === 'ordersCount') colExpr = 'COALESCE(ostats_seg.orders_count, 0)';
          else if (cond.field === 'totalSpent') colExpr = 'COALESCE(ostats_seg.total_spent, 0)';
          else if (cond.field === 'daysSinceLastOrder') colExpr = 'EXTRACT(DAY FROM (NOW() - ostats_seg.last_order_at))';
          else if (cond.field === 'status') colExpr = 'c.status';
          else if (cond.field === 'origin') colExpr = 'LOWER(COALESCE(NULLIF(c."registrationUtmSource", \'\'), NULLIF(c."registrationChannel", \'\'), \'direct\'))';
          else if (cond.field === 'source') colExpr = 'c.source';

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
          query.andWhere(`(${clauses.join(` ${matchType} `)})`, params);
        }
      }
    }

    // Fetch tab status counts in parallel
    const statusCountsRaw = await this.dataSource.query(
      `
      SELECT 
        status, 
        COUNT(id)::int AS count 
      FROM customers 
      WHERE "tenantId" = $1 
      GROUP BY status
      `,
      [tenantId],
    );

    const statusCounts = {
      ALL: 0,
      ACTIVE: 0,
      INACTIVE: 0,
      BLOCKED: 0,
      GUEST: 0,
    };

    for (const row of statusCountsRaw) {
      if (row.status === CustomerStatusEnum.ACTIVE) {
        statusCounts.ACTIVE = Number(row.count || 0);
      } else if (row.status === CustomerStatusEnum.INACTIVE) {
        statusCounts.INACTIVE = Number(row.count || 0);
      } else if (row.status === CustomerStatusEnum.BLOCKED) {
        statusCounts.BLOCKED = Number(row.count || 0);
      } else if (row.status === CustomerStatusEnum.GUEST) {
        statusCounts.GUEST = Number(row.count || 0);
      }
    }
    statusCounts.ALL = statusCounts.ACTIVE + statusCounts.INACTIVE + statusCounts.BLOCKED + statusCounts.GUEST;

    // Sorting & Order Stats aggregation
    const sortOrder = dto.sortOrder === 'ASC' ? 'ASC' : 'DESC';
    const sortByParam = dto.sortBy && ALLOWED_CUSTOMER_SORT_FIELDS.includes(dto.sortBy as any)
      ? dto.sortBy
      : 'createdAt';

    // If sorting by derived fields (ordersCount, totalSpent, lastOrderAt), join aggregated stats
    const isDerivedSort = ['ordersCount', 'totalSpent', 'lastOrderAt'].includes(sortByParam);

    if (isDerivedSort) {
      query.leftJoin(
        (subQuery) => {
          return subQuery
            .select('COALESCE("customerId"::text, \'\')', 'cid')
            .addSelect('"customerPhone"', 'cphone')
            .addSelect('COUNT(id)::int', 'orders_count')
            .addSelect(
              'COALESCE(SUM(CASE WHEN "orderStatus" NOT IN (\'CANCELLED\', \'RETURNED\') THEN "grandTotal" ELSE 0 END), 0)::numeric',
              'total_spent',
            )
            .addSelect('MAX("createdAt")', 'last_order_at')
            .from('orders', 'o')
            .where('o."tenantId" = :tenantId', { tenantId })
            .groupBy('"customerId", "customerPhone"');
        },
        'ostats',
        'c.id::text = ostats.cid OR c.phone = ostats.cphone',
      );

      // TypeORM's orderBy/addOrderBy parses string arguments for "alias.column"
      // patterns to auto-escape them — passing a raw expression like
      // "COALESCE(ostats.orders_count, 0)" trips that parser and throws
      // '"COALESCE(ostats" alias was not found'. Routing the expression through
      // addSelect(...) with a plain alias, then ordering by that alias name,
      // sidesteps the parser entirely.
      if (sortByParam === 'ordersCount') {
        query.addSelect('COALESCE(ostats.orders_count, 0)', 'sort_val');
        query.addOrderBy('sort_val', sortOrder);
      } else if (sortByParam === 'totalSpent') {
        query.addSelect('COALESCE(ostats.total_spent, 0)', 'sort_val');
        query.addOrderBy('sort_val', sortOrder);
      } else if (sortByParam === 'lastOrderAt') {
        query.addSelect('ostats.last_order_at', 'sort_val');
        query.addOrderBy('sort_val', sortOrder, 'NULLS LAST');
      }
    } else {
      // Direct Customer table field sorting
      if (sortByParam === 'firstName' || sortByParam === 'name') {
        query.addOrderBy('c.firstName', sortOrder);
        query.addOrderBy('c.lastName', sortOrder);
      } else if (sortByParam === 'lastName') {
        query.addOrderBy('c.lastName', sortOrder);
      } else {
        query.addOrderBy('c.createdAt', sortOrder);
      }
    }

    // Always add secondary deterministic sort tie-breaker
    query.addOrderBy('c.id', 'ASC');

    query.skip(skip).take(limit);

    const [customers, total] = await query.getManyAndCount();

    const totalPages = Math.ceil(total / limit) || 0;

    if (customers.length === 0) {
      return {
        data: [],
        meta: {
          page,
          limit,
          total,
          totalPages,
          statusCounts,
        },
      };
    }

    // Aggregate order stats for retrieved page
    const customerIds = customers.map((c) => c.id);
    const customerPhones = customers.map((c) => c.phone);

    const statsRaw = await this.dataSource.query(
      `
      SELECT 
        "customerId",
        "customerPhone",
        COUNT(id)::int AS "ordersCount",
        COALESCE(SUM(CASE WHEN "orderStatus" NOT IN ('CANCELLED', 'RETURNED') THEN "grandTotal" ELSE 0 END), 0)::numeric AS "totalSpent",
        MAX("createdAt") AS "lastOrderAt"
      FROM orders
      WHERE "tenantId" = $1
        AND ("customerId" = ANY($2) OR "customerPhone" = ANY($3))
      GROUP BY "customerId", "customerPhone"
      `,
      [tenantId, customerIds, customerPhones],
    );

    const statsMapByCustId = new Map<string, { ordersCount: number; totalSpent: number; lastOrderAt: string | null }>();
    const statsMapByPhone = new Map<string, { ordersCount: number; totalSpent: number; lastOrderAt: string | null }>();

    for (const row of statsRaw) {
      const data = {
        ordersCount: Number(row.ordersCount || 0),
        totalSpent: roundMoney(row.totalSpent),
        lastOrderAt: row.lastOrderAt ? new Date(row.lastOrderAt).toISOString() : null,
      };
      if (row.customerId) {
        statsMapByCustId.set(row.customerId, data);
      }
      if (row.customerPhone) {
        statsMapByPhone.set(row.customerPhone, data);
      }
    }

    const items: CustomerListItem[] = customers.map((cust) => {
      const stats = statsMapByCustId.get(cust.id) || statsMapByPhone.get(cust.phone) || {
        ordersCount: 0,
        totalSpent: 0,
        lastOrderAt: null,
      };

      return {
        ...cust,
        ordersCount: stats.ordersCount,
        totalSpent: stats.totalSpent,
        lastOrderAt: stats.lastOrderAt,
      };
    });

    return {
      data: items,
      meta: {
        page,
        limit,
        total,
        totalPages,
        statusCounts,
      },
    };
  }
}
