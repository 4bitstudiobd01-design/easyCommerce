import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbandonedCartEntity } from '../entities/abandoned-cart.entity';
import { StoreEntity } from '../../tenant/entities/store.entity';
import { SendSmsService } from '../../sms/services/send-sms.service';

@Injectable()
export class AbandonedCartService {
  constructor(
    @InjectRepository(AbandonedCartEntity)
    private readonly abandonedCartRepository: Repository<AbandonedCartEntity>,
    @InjectRepository(StoreEntity)
    private readonly storeRepository: Repository<StoreEntity>,
    private readonly sendSmsService: SendSmsService,
  ) {}

  async trackIncompleteCart(dto: {
    customerName?: string;
    customerPhone: string;
    customerEmail?: string;
    shippingAddress?: string;
    itemsJson: any[];
    totalAmount: number;
    storeSlug: string;
  }): Promise<AbandonedCartEntity> {
    const store = await this.storeRepository.findOne({ where: { slug: dto.storeSlug } });

    if (!store) {
      throw new NotFoundException(`Store with slug "${dto.storeSlug}" not found.`);
    }

    let cart = await this.abandonedCartRepository.findOne({
      where: { customerPhone: dto.customerPhone, isRecovered: false, tenantId: store.tenantId },
    });

    const recoveryToken = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);

    if (cart) {
      cart.customerName = dto.customerName || cart.customerName;
      cart.customerEmail = dto.customerEmail || cart.customerEmail;
      cart.shippingAddress = dto.shippingAddress || cart.shippingAddress;
      cart.itemsJson = dto.itemsJson;
      cart.totalAmount = dto.totalAmount;
      return this.abandonedCartRepository.save(cart);
    }

    cart = this.abandonedCartRepository.create({
      customerName: dto.customerName,
      customerPhone: dto.customerPhone,
      customerEmail: dto.customerEmail,
      shippingAddress: dto.shippingAddress,
      itemsJson: dto.itemsJson,
      totalAmount: dto.totalAmount,
      recoveryToken,
      isRecovered: false,
      tenantId: store.tenantId,
    });

    return this.abandonedCartRepository.save(cart);
  }

  async getMerchantAbandonedCarts(tenantId: string): Promise<AbandonedCartEntity[]> {
    return this.abandonedCartRepository.find({
      where: { tenantId, isRecovered: false },
      order: { createdAt: 'DESC' },
    });
  }

  async sendRecoverySms(cartId: string, tenantId: string, baseUrl: string = 'http://localhost:3000'): Promise<{ message: string }> {
    const cart = await this.abandonedCartRepository.findOne({ where: { id: cartId, tenantId } });

    if (!cart) {
      throw new NotFoundException(`Abandoned cart with ID "${cartId}" not found.`);
    }

    const store = await this.storeRepository.findOne({ where: { tenantId } });
    const recoveryUrl = `${baseUrl}/store/${store?.slug || 'shop'}?recoveryToken=${cart.recoveryToken}`;

    const smsBody = `Hi ${cart.customerName || 'Customer'}! You left items in your cart at ${store?.name || 'our store'}. Complete your order now: ${recoveryUrl}`;

    await this.sendSmsService.execute({
      tenantId,
      recipientPhone: cart.customerPhone,
      message: smsBody,
    });

    cart.lastRemindedAt = new Date();
    await this.abandonedCartRepository.save(cart);

    return { message: `Recovery SMS sent successfully to ${cart.customerPhone}!` };
  }
}
