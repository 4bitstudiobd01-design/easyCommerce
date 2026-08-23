import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { OrderEntity } from '../entities/order.entity';
import { OrderStatusHistoryEntity } from '../entities/order-status-history.entity';
import { OrderNoteEntity } from '../entities/order-note.entity';
import { ConsignmentEntity } from '../../logistics/entities/consignment.entity';
import { ReturnEntity } from '../entities/return.entity';
import { UserEntity } from '../../user/entities/user.entity';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface TimelineEvent {
  id: string;
  type: 'STATUS_CHANGE' | 'ORDER_EDITED' | 'INTERNAL_NOTE' | 'CUSTOMER_COMMUNICATION' | 'SHIPMENT' | 'RETURN';
  title: string;
  description?: string;
  actor: string;
  timestamp: Date;
  metadata?: any;
}

export interface PaginatedTimeline {
  events: TimelineEvent[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
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
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async getTimeline(orderId: string, tenantId: string, page = 1, limit = 10): Promise<PaginatedTimeline> {
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

    // changedBy/createdBy store the acting user's id (or an email for a couple of
    // legacy callers) rather than a display name, so resolve every distinct id to
    // the user's fullName in one batched query instead of showing raw uuids.
    const actorIds = Array.from(
      new Set(
        [...histories.map((h) => h.changedBy), ...notes.map((n) => n.createdBy)].filter(
          (value): value is string => !!value && UUID_PATTERN.test(value),
        ),
      ),
    );
    const actors = actorIds.length
      ? await this.userRepository.find({ where: { id: In(actorIds) }, select: ['id', 'fullName'] })
      : [];
    const actorNameById = new Map(actors.map((u) => [u.id, u.fullName]));
    const resolveActor = (value: string | null | undefined, fallback: string): string => {
      if (!value) return fallback;
      return actorNameById.get(value) || value;
    };

    // 1. Status Changes — edit-order writes a history row with the status
    // unchanged (previousStatus left unset) purely as an audit marker, so those
    // render as an "Order Edited" event instead of a misleading status change.
    histories.forEach((h) => {
      const isEditMarker = !h.previousStatus;
      events.push({
        id: h.id,
        type: isEditMarker ? 'ORDER_EDITED' : 'STATUS_CHANGE',
        title: isEditMarker ? 'Order Edited' : `Status changed to ${h.newStatus}`,
        description: h.reason || undefined,
        actor: resolveActor(h.changedBy, 'System'),
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
        actor: resolveActor(n.createdBy, 'Staff'),
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

    // Sort all events chronologically, newest first, then page over the merged
    // result — the events are drawn from several tables (status history, notes,
    // consignments, returns) so pagination has to happen after the merge/sort
    // rather than at the query level for any single source.
    const sorted = events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const safePage = Math.max(1, page);
    const safeLimit = Math.max(1, limit);
    const start = (safePage - 1) * safeLimit;
    const pageEvents = sorted.slice(start, start + safeLimit);

    return {
      events: pageEvents,
      total: sorted.length,
      page: safePage,
      limit: safeLimit,
      hasMore: start + safeLimit < sorted.length,
    };
  }
}
