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

  async execute(tenantId: string, storeId: string, dto: ExportOrdersDto): Promise<stream.Readable> {
    const qb = this.orderRepository.createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .where('order.tenantId = :tenantId', { tenantId })
      .andWhere('order.storeSlug = :storeId', { storeId })
      .orderBy('order.createdAt', 'DESC');

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

    const orders = await qb.getMany();

    // Create a robust CSV stream
    const readable = new stream.Readable({
      read() {}
    });

    // Add UTF-8 BOM for Excel compatibility
    readable.push('\\uFEFF');

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

    readable.push(this.formatCsvRow(headers) + '\\n');

    for (const order of orders) {
      const row = [
        order.orderNumber,
        order.createdAt.toISOString(),
        order.customerName,
        order.customerPhone,
        this.sanitizeCsvFormula(order.shippingAddress),
        order.city,
        order.orderStatus,
        order.paymentMethod,
        order.paymentStatus,
        order.subtotal.toString(),
        order.deliveryFee.toString(),
        order.discountAmount.toString(),
        order.grandTotal.toString(),
      ];
      readable.push(this.formatCsvRow(row) + '\\n');
    }

    readable.push(null); // End of stream
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
