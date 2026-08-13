import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CustomerEntity, CustomerStatusEnum } from '../entities/customer.entity';
import { CustomerListDto, ALLOWED_CUSTOMER_SORT_FIELDS } from '../dto/customer-list.dto';
import { roundMoney } from '../utils/money.util';
import * as stream from 'stream';

@Injectable()
export class ExportCustomersService {
  constructor(
    @InjectRepository(CustomerEntity)
    private readonly customerRepository: Repository<CustomerEntity>,
    private readonly dataSource: DataSource,
  ) {}

  private sanitizeCsvFormula(value: string | null | undefined): string {
    if (!value) return '';
    const dangerousPrefixes = ['=', '+', '-', '@', '\t', '\r'];
    if (dangerousPrefixes.some((prefix) => value.startsWith(prefix))) {
      return "'" + value;
    }
    return value;
  }

  private formatCsvRow(columns: string[]): string {
    return columns
      .map((col) => {
        if (col === null || col === undefined) return '""';
        const str = col.toString();
        const escapedStr = str.replace(/"/g, '""');
        return '"' + escapedStr + '"';
      })
      .join(',');
  }

  async execute(tenantId: string, dto: CustomerListDto): Promise<stream.Readable> {
    const BATCH_SIZE = 200;
    const customerRepo = this.customerRepository;

    const buildQuery = (offset: number) => {
      const qb = customerRepo.createQueryBuilder('c')
        .where('c.tenantId = :tenantId', { tenantId });

      if (dto.status) {
        qb.andWhere('c.status = :status', { status: dto.status });
      }

      if (dto.source) {
        qb.andWhere('c.source = :source', { source: dto.source });
      }

      if (dto.search && dto.search.trim() !== '') {
        const s = `%${dto.search.trim()}%`;
        qb.andWhere(
          '(c.firstName ILIKE :s OR c.lastName ILIKE :s OR CONCAT(c.firstName, \' \', c.lastName) ILIKE :s OR c.email ILIKE :s OR c.phone ILIKE :s)',
          { s },
        );
      }

      let dateFromStr = dto.dateFrom;
      if (!dateFromStr && dto.dateRange && dto.dateRange !== 'ALL') {
        const days = parseInt(dto.dateRange, 10);
        if (Number.isFinite(days) && days > 0) {
          dateFromStr = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
        }
      }

      if (dateFromStr) {
        qb.andWhere('c.createdAt >= :dateFromStr', { dateFromStr });
      }
      if (dto.dateTo) {
        qb.andWhere('c.createdAt <= :dateTo', { dateTo: dto.dateTo });
      }

      const sortOrder = dto.sortOrder === 'ASC' ? 'ASC' : 'DESC';
      const sortByParam = dto.sortBy && ALLOWED_CUSTOMER_SORT_FIELDS.includes(dto.sortBy as any)
        ? dto.sortBy
        : 'createdAt';

      if (sortByParam === 'firstName' || sortByParam === 'name') {
        qb.addOrderBy('c.firstName', sortOrder);
        qb.addOrderBy('c.lastName', sortOrder);
      } else if (sortByParam === 'lastName') {
        qb.addOrderBy('c.lastName', sortOrder);
      } else {
        qb.addOrderBy('c.createdAt', sortOrder);
      }

      qb.addOrderBy('c.id', 'ASC');
      return qb.skip(offset).take(BATCH_SIZE);
    };

    const headers = [
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Source',
      'Status',
      'Orders Count',
      'Total Spent (BDT)',
      'Last Order Date',
      'Date Joined',
    ];

    const sanitize = this.sanitizeCsvFormula;
    const formatRow = this.formatCsvRow;

    let offset = 0;
    let headerSent = false;
    let exhausted = false;

    const readable = new stream.Readable({
      async read() {
        if (exhausted) {
          this.push(null);
          return;
        }

        if (!headerSent) {
          // Push UTF-8 BOM to preserve Bangla text in Excel
          this.push('﻿');
          this.push(formatRow(headers) + '\n');
          headerSent = true;
        }

        const batch = await buildQuery(offset).getMany();
        offset += BATCH_SIZE;

        if (batch.length === 0) {
          exhausted = true;
          this.push(null);
          return;
        }

        // Fetch order stats for current batch customers
        const customerIds = batch.map((c) => c.id);
        const customerPhones = batch.map((c) => c.phone);

        const statsRaw = await customerRepo.manager.query(
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
          if (row.customerId) statsMapByCustId.set(row.customerId, data);
          if (row.customerPhone) statsMapByPhone.set(row.customerPhone, data);
        }

        for (const c of batch) {
          const stats = statsMapByCustId.get(c.id) || statsMapByPhone.get(c.phone) || {
            ordersCount: 0,
            totalSpent: 0,
            lastOrderAt: null,
          };

          const rowData = [
            sanitize(c.firstName),
            sanitize(c.lastName),
            sanitize(c.email || ''),
            sanitize(c.phone),
            c.source,
            c.status,
            stats.ordersCount.toString(),
            stats.totalSpent.toString(),
            stats.lastOrderAt ? new Date(stats.lastOrderAt).toLocaleDateString('en-US') : 'No orders',
            new Date(c.createdAt).toLocaleDateString('en-US'),
          ];

          this.push(formatRow(rowData) + '\n');
        }

        if (batch.length < BATCH_SIZE) {
          exhausted = true;
        }
      },
    });

    return readable;
  }
}
