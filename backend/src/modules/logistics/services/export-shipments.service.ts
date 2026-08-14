import { Injectable } from '@nestjs/common';
import { ListShipmentsService } from './list-shipments.service';
import { ListShipmentsQueryDto } from '../dto/list-shipments-query.dto';

/** Hard ceiling so a single export can never exhaust server memory. */
const MAX_EXPORT_ROWS = 10000;

const CSV_COLUMNS = [
  'Shipment',
  'Order',
  'Customer',
  'Phone',
  'Courier',
  'Tracking ID',
  'COD Amount',
  'COD Status',
  'Currency',
  'Status',
  'City',
  'Weight (kg)',
  'Created At',
] as const;

interface ShipmentExportRow {
  customerName?: string;
  customerPhone?: string;
  customerId?: string;
}

@Injectable()
export class ExportShipmentsService {
  constructor(private readonly listShipmentsService: ListShipmentsService) {}

  /**
   * Exports exactly the rows the merchant is currently looking at: the same
   * tenant scope, search, courier, status, COD status and date filters as the
   * table. Pagination is ignored on purpose — an export covers the whole
   * filtered set, never one page.
   */
  async execute(
    tenantId: string,
    queryDto: ListShipmentsQueryDto,
    currency = 'BDT',
  ): Promise<{ filename: string; content: string; rowCount: number; truncated: boolean }> {
    const qb = this.listShipmentsService.baseQuery(tenantId);
    this.listShipmentsService.applyFilters(qb, queryDto);

    const total = await qb.getCount();
    const truncated = total > MAX_EXPORT_ROWS;

    const rows = await qb
      .select('consignment')
      .addSelect('ord."customerName"', 'customerName')
      .addSelect('ord."customerPhone"', 'customerPhone')
      .addSelect('ord."customerId"', 'customerId')
      .orderBy('consignment."createdAt"', 'DESC')
      .addOrderBy('consignment.id', 'ASC')
      .limit(MAX_EXPORT_ROWS)
      .getRawAndEntities();

    const lines: string[] = [CSV_COLUMNS.join(',')];

    rows.entities.forEach((consignment, index) => {
      const item = this.listShipmentsService.toListItem(
        consignment,
        rows.raw[index] as ShipmentExportRow,
        currency,
      );

      lines.push(
        [
          item.shipmentNumber,
          item.orderNumber,
          item.customer.name,
          item.customer.phone ?? '',
          item.courierName,
          item.trackingCode ?? 'Not Assigned',
          item.codAmount.toFixed(2),
          item.codStatusLabel,
          item.currency,
          item.statusLabel,
          item.city,
          item.parcelWeight.toFixed(3),
          item.createdAt ? new Date(item.createdAt).toISOString() : '',
        ]
          .map((value) => this.toCsvCell(String(value)))
          .join(','),
      );
    });

    const stamp = new Date().toISOString().slice(0, 10);

    return {
      filename: `shipments-${stamp}.csv`,
      content: lines.join('\n'),
      rowCount: rows.entities.length,
      truncated,
    };
  }

  /**
   * Quotes a CSV cell and neutralises spreadsheet formula injection — a
   * customer-supplied name beginning with =, +, - or @ must never execute
   * when the merchant opens the file in Excel.
   */
  private toCsvCell(value: string): string {
    const raw = String(value ?? '');
    const guarded = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
    return `"${guarded.replace(/"/g, '""')}"`;
  }
}
