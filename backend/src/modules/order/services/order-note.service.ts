import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderNoteEntity } from '../entities/order-note.entity';
import { OrderEntity } from '../entities/order.entity';

export interface CreateOrderNoteDto {
  content: string;
  isCustomerVisible?: boolean;
}

@Injectable()
export class OrderNoteService {
  constructor(
    @InjectRepository(OrderNoteEntity)
    private readonly orderNoteRepository: Repository<OrderNoteEntity>,
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
  ) {}

  async createNote(orderId: string, tenantId: string, dto: CreateOrderNoteDto, userId: string): Promise<OrderNoteEntity> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, tenantId },
    });

    if (!order) {
      throw new NotFoundException(`Order #${orderId} not found`);
    }

    const note = this.orderNoteRepository.create({
      orderId,
      content: dto.content,
      isCustomerVisible: dto.isCustomerVisible || false,
      createdBy: userId,
    });

    return await this.orderNoteRepository.save(note);
  }

  async getNotesForOrder(orderId: string, tenantId: string): Promise<OrderNoteEntity[]> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, tenantId },
    });

    if (!order) {
      throw new NotFoundException(`Order #${orderId} not found`);
    }

    return await this.orderNoteRepository.find({
      where: { orderId },
      order: { createdAt: 'DESC' },
    });
  }
}
