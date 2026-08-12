import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity } from '../entities/order.entity';
import * as stream from 'stream';

export interface ExportOrdersDto {
  orderIds?: string[];
  filters?: any;
  selectAllMatching?: boolean;
}

@Injectable()
export class ExportOrdersService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
  ) {}

  private buildBaseQuery(tenantId: string, storeId: string, dto: ExportOrdersDto) {
    const qb = this.orderRepository.createQueryBuilder('order')
      .where('order.tenantId = :tenantId', { tenantId })
      .andWhere('order.storeSlug = :storeId', { storeId })
      .orderBy('order.createdAt', 'DESC')
      .addOrderBy('order.id', 'DESC');

    if (dto.selectAllMatching && dto.filters) {
      if (dto.filters.status && dto.filters.status !== 'ALL') {
        qb.andWhere('order.orderStatus = :status', { status: dto.filters.status });
      }
      if (dto.filters.paymentStatus && dto.filters.paymentStatus !== 'ALL') {
        qb.andWhere('order.paymentStatus = :paymentStatus', { paymentStatus: dto.filters.paymentStatus });
      }
      if (dto.filters.search) {
        qb.andWhere(
          '(order.orderNumber ILIKE :search OR order.customerName ILIKE :search OR order.customerPhone ILIKE :search)',
          { search: `%${dto.filters.search}%` },
        );
      }
    } else if (dto.orderIds && dto.orderIds.length > 0) {
      qb.andWhere('order.id IN (:...orderIds)', { orderIds: dto.orderIds });
    } else {
      qb.andWhere('1 = 0'); // Returns empty if no selection
    }

    return qb;
  }

  async execute(tenantId: string, storeId: string, dto: ExportOrdersDto): Promise<stream.Readable> {
    const BATCH_SIZE = 500;
    const buildBaseQuery = (offset: number) =>
      this.buildBaseQuery(tenantId, storeId, dto).skip(offset).take(BATCH_SIZE);
    const formatCsvRow = this.formatCsvRow;
    const sanitizeCsvFormula = this.sanitizeCsvFormula;

    const headers = [
      'Order Number',
      'Date',
      'Customer Name',
      'Customer Phone',
      'Shipping Address',
      'City',
      'Status',
      'Payment Method',
      'Payment Status',
      'Subtotal',
      'Delivery Fee',
      'Discount',
      'Grand Total',
    ];

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
          this.push('﻿');
          this.push(formatCsvRow(headers) + '\n');
          headerSent = true;
        }

        const batch = await buildBaseQuery(offset).getMany();
        offset += BATCH_SIZE;

        if (batch.length === 0) {
          exhausted = true;
          this.push(null);
          return;
        }

        for (const order of batch) {
          const row = [
            order.orderNumber,
            order.createdAt.toISOString(),
            order.customerName,
            order.customerPhone,
            sanitizeCsvFormula(order.shippingAddress),
            order.city,
            order.orderStatus,
            order.paymentMethod,
            order.paymentStatus,
            order.subtotal.toString(),
            order.deliveryFee.toString(),
            order.discountAmount.toString(),
            order.grandTotal.toString(),
          ];
          this.push(formatCsvRow(row) + '\n');
        }

        if (batch.length < BATCH_SIZE) {
          exhausted = true;
        }
      },
    });

    return readable;
  }

  private formatCsvRow(columns: string[]): string {
    return columns.map(col => {
      if (col === null || col === undefined) return '""';
      const str = col.toString();
      // Escape quotes by doubling them
      const escapedStr = str.replace(/"/g, '""');
      // Wrap in quotes
      return '"' + escapedStr + '"';
    }).join(',');
  }

  // Prevent CSV Injection (Formula Injection)
  private sanitizeCsvFormula(value: string | undefined): string {
    if (!value) return '';
    const dangerousPrefixes = ['=', '+', '-', '@', '\t', '\r'];
    if (dangerousPrefixes.some(prefix => value.startsWith(prefix))) {
      return "'" + value;
    }
    return value;
  }
}
