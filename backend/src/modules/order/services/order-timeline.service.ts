import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity } from '../entities/order.entity';
import { OrderStatusHistoryEntity } from '../entities/order-status-history.entity';
import { OrderNoteEntity } from '../entities/order-note.entity';
import { ConsignmentEntity } from '../../logistics/entities/consignment.entity';
import { ReturnEntity } from '../entities/return.entity';

export interface TimelineEvent {
  id: string;
  type: 'STATUS_CHANGE' | 'INTERNAL_NOTE' | 'CUSTOMER_COMMUNICATION' | 'SHIPMENT' | 'RETURN';
  title: string;
  description?: string;
  actor: string;
  timestamp: Date;
  metadata?: any;
}

@Injectable()
export class OrderTimelineService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    @InjectRepository(OrderStatusHistoryEntity)
    private readonly statusHistoryRepository: Repository<OrderStatusHistoryEntity>,
    @InjectRepository(OrderNoteEntity)
    private readonly orderNoteRepository: Repository<OrderNoteEntity>,
    @InjectRepository(ConsignmentEntity)
    private readonly consignmentRepository: Repository<ConsignmentEntity>,
    @InjectRepository(ReturnEntity)
    private readonly returnRepository: Repository<ReturnEntity>,
  ) {}

  async getTimeline(orderId: string, tenantId: string): Promise<TimelineEvent[]> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, tenantId },
    });

    if (!order) {
      throw new NotFoundException(`Order #${orderId} not found`);
    }

    const events: TimelineEvent[] = [];

    const [histories, notes, consignments, returns] = await Promise.all([
      this.statusHistoryRepository.find({
        where: { orderId, tenantId },
        order: { createdAt: 'ASC' },
      }),
      this.orderNoteRepository.find({
        where: { orderId, tenantId },
        order: { createdAt: 'ASC' },
      }),
      this.consignmentRepository.find({
        where: { orderId, tenantId },
        order: { createdAt: 'ASC' },
      }),
      this.returnRepository.find({
        where: { orderId, tenantId },
        order: { requestedAt: 'ASC' },
      }),
    ]);

    // 1. Status Changes
    histories.forEach((h) => {
      events.push({
        id: h.id,
        type: 'STATUS_CHANGE',
        title: `Status changed to ${h.newStatus}`,
        description: h.reason || undefined,
        actor: h.changedBy || 'System',
        timestamp: h.createdAt,
        metadata: {
          previousStatus: h.previousStatus,
          newStatus: h.newStatus,
        },
      });
    });

    // 2. Internal Notes & Customer Messages
    notes.forEach((n) => {
      events.push({
        id: n.id,
        type: n.isCustomerVisible ? 'CUSTOMER_COMMUNICATION' : 'INTERNAL_NOTE',
        title: n.isCustomerVisible ? 'Customer Message' : 'Internal Note',
        description: n.content,
        actor: n.createdBy || 'Staff',
        timestamp: n.createdAt,
        metadata: {
          isCustomerVisible: n.isCustomerVisible,
        },
      });
    });

    // 3. Consignments / Shipping
    consignments.forEach((c) => {
      events.push({
        id: c.id,
        type: 'SHIPMENT',
        title: `Consignment Created (${c.courierProvider})`,
        description: `Tracking Code: ${c.trackingCode || 'N/A'}, Status: ${c.status}`,
        actor: 'Logistics',
        timestamp: c.createdAt,
        metadata: {
          courier: c.courierProvider,
          trackingCode: c.trackingCode,
          status: c.status,
        },
      });
    });

    // 4. Returns
    returns.forEach((r) => {
      events.push({
        id: r.id,
        type: 'RETURN',
        title: `Return Request (${r.status})`,
        description: `Reason: ${r.reason || 'N/A'}`,
        actor: 'Merchant',
        timestamp: r.requestedAt,
        metadata: {
          status: r.status,
          note: r.note,
        },
      });
    });

    // Sort all events chronologically (newest first for UI rendering, or oldest first if preferred)
    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
}
