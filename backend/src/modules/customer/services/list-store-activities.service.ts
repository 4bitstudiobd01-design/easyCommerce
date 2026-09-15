import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CustomerActivityEntity } from '../entities/customer-activity.entity';

export interface StoreActivityItem {
  id: string;
  type: 'LEAD_CREATED' | 'CUSTOMER_CREATED' | 'ORDER_PLACED' | 'ORDER_DELIVERED' | 'LEAD_STAGE_CHANGED' | 'NOTE_ADDED' | 'CALL' | 'WHATSAPP' | 'SMS' | 'MEETING';
  title: string;
  description: string;
  actorName: string;
  customerName?: string;
  leadName?: string;
  outcome?: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class ListStoreActivitiesService {
  constructor(
    @InjectRepository(CustomerActivityEntity)
    private readonly activityRepository: Repository<CustomerActivityEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async execute(
    tenantId: string,
    storeId?: string,
    limit = 50,
    type?: string,
    search?: string,
  ): Promise<StoreActivityItem[]> {
    const activities: StoreActivityItem[] = [];

    // ─── 1. Customer creation events ──────────────────────────────────────
    const customers = await this.dataSource.query(
      `SELECT c.id, c."firstName", c."lastName", c.phone, c.email, c.source, c."createdAt"
       FROM customers c
       WHERE c."tenantId" = $1 ${storeId ? 'AND (c."storeId" = $2 OR c."storeId" IS NULL)' : ''}
       ORDER BY c."createdAt" DESC
       LIMIT $${storeId ? 3 : 2}`,
      storeId ? [tenantId, storeId, limit] : [tenantId, limit],
    );

    for (const c of customers) {
      const fullName = `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Valued Customer';
      activities.push({
        id: `customer-created-${c.id}`,
        type: 'CUSTOMER_CREATED',
        title: 'New Customer Registered',
        description: `${fullName} joined via ${c.source?.replace(/_/g, ' ') || 'Store'}. Phone: ${c.phone}${c.email ? ` | Email: ${c.email}` : ''}.`,
        actorName: 'System',
        customerName: fullName,
        createdAt: new Date(c.createdAt).toISOString(),
        metadata: { customerId: c.id, phone: c.phone, source: c.source },
      });
    }

    // ─── 2. Lead creation events ───────────────────────────────────────────
    const leads = await this.dataSource.query(
      `SELECT l.id, l.name, l.phone, l.email, l.source, l.stage,
              l.estimated_value AS "estimatedValue",
              l.lead_score AS "leadScore",
              l.store_id AS "storeId",
              l.created_at AS "createdAt"
       FROM crm_leads l
       WHERE l.tenant_id = $1 ${storeId ? 'AND (l.store_id = $2 OR l.store_id IS NULL)' : ''}
       ORDER BY l.created_at DESC
       LIMIT $${storeId ? 3 : 2}`,
      storeId ? [tenantId, storeId, limit] : [tenantId, limit],
    );

    for (const l of leads) {
      activities.push({
        id: `lead-created-${l.id}`,
        type: 'LEAD_CREATED',
        title: 'New Lead Added to Pipeline',
        description: `${l.name} entered pipeline as ${l.stage.replace(/_/g, ' ')} lead via ${l.source?.replace(/_/g, ' ')}. Est. Value: ৳${Number(l.estimatedValue || 0).toLocaleString()}. Score: ${l.leadScore || 0}/100.`,
        actorName: 'CRM System',
        leadName: l.name,
        outcome: l.stage,
        createdAt: new Date(l.createdAt).toISOString(),
        metadata: { leadId: l.id, phone: l.phone, source: l.source, stage: l.stage, estimatedValue: l.estimatedValue },
      });
    }

    // ─── 3. Order events ───────────────────────────────────────────────────
    const orders = await this.dataSource.query(
      `SELECT o.id, o."orderNumber", o."orderStatus", o."grandTotal",
              o."customerPhone", o."customerName", o."customerId", o."createdAt"
       FROM orders o
       WHERE o."tenantId" = $1
       ORDER BY o."createdAt" DESC
       LIMIT $2`,
      [tenantId, limit],
    );

    for (const o of orders) {
      const custName = o.customerName || 'Guest Customer';
      const status = o.orderStatus?.replace(/_/g, ' ') || '';
      const isDelivered = ['DELIVERED', 'COMPLETED'].includes(o.orderStatus);

      activities.push({
        id: `order-${o.id}`,
        type: isDelivered ? 'ORDER_DELIVERED' : 'ORDER_PLACED',
        title: isDelivered ? `Order ${o.orderNumber} Delivered` : `New Order ${o.orderNumber} Placed`,
        description: `${custName} ${isDelivered ? 'received' : 'placed'} order worth ৳${Number(o.grandTotal || 0).toLocaleString()}. Status: ${status}.`,
        actorName: custName,
        customerName: custName,
        outcome: status,
        createdAt: new Date(o.createdAt).toISOString(),
        metadata: { orderId: o.id, orderNumber: o.orderNumber, grandTotal: o.grandTotal, status: o.orderStatus },
      });
    }

    // ─── 4. Explicit customer activity logs (notes, calls, etc.) ──────────
    const dbActivities = await this.activityRepository
      .createQueryBuilder('a')
      .leftJoin('a.customer', 'cust')
      .select([
        'a.id', 'a.eventType', 'a.title', 'a.description',
        'a.actorName', 'a.metadata', 'a.createdAt',
        'cust.firstName', 'cust.lastName',
      ])
      .where('a.tenantId = :tenantId', { tenantId })
      .orderBy('a.createdAt', 'DESC')
      .limit(limit)
      .getMany();

    for (const a of dbActivities) {
      const customerName = a.customer
        ? `${(a.customer as any).firstName || ''} ${(a.customer as any).lastName || ''}`.trim()
        : undefined;

      const eventTypeMap: Record<string, StoreActivityItem['type']> = {
        NOTE_ADDED: 'NOTE_ADDED',
        CUSTOMER_CREATED: 'CUSTOMER_CREATED',
        ORDER_PLACED: 'ORDER_PLACED',
        CALL: 'CALL',
        WHATSAPP: 'WHATSAPP',
        SMS: 'SMS',
        MEETING: 'MEETING',
        STAGE_CHANGE: 'LEAD_STAGE_CHANGED',
      };

      activities.push({
        id: `activity-${a.id}`,
        type: (eventTypeMap[a.eventType] as StoreActivityItem['type']) || 'NOTE_ADDED',
        title: a.title,
        description: a.description || '',
        actorName: a.actorName || 'System',
        customerName,
        createdAt: new Date(a.createdAt).toISOString(),
        metadata: a.metadata,
      });
    }

    // ─── 5. De-duplicate (by id), apply type filter, apply search, sort by date ──
    const unique = new Map<string, StoreActivityItem>();
    for (const act of activities) {
      if (!unique.has(act.id)) unique.set(act.id, act);
    }

    let result = Array.from(unique.values());

    // Filter by type
    if (type && type !== 'ALL') {
      result = result.filter((a) => a.type === type || a.type.includes(type as any));
    }

    // Filter by search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          (a.customerName && a.customerName.toLowerCase().includes(q)) ||
          (a.leadName && a.leadName.toLowerCase().includes(q)),
      );
    }

    // Sort by date DESC
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return result.slice(0, limit);
  }
}
