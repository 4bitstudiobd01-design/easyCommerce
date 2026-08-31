import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeadEntity, LeadStageEnum } from '../entities/lead.entity';
import { CustomerEntity, CustomerStatusEnum, CustomerAccountTypeEnum, CustomerSourceEnum } from '../entities/customer.entity';
import { OrderEntity, OrderStatusEnum, PaymentStatusEnum, PaymentMethodEnum } from '../../order/entities/order.entity';
import { OrderItemEntity } from '../../order/entities/order-item.entity';
import { RecordCustomerActivityService } from './record-customer-activity.service';

export interface LeadPurchasedItemDto {
  productId?: string;
  productTitle: string;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
}

@Injectable()
export class ConvertLeadToCustomerService {
  constructor(
    @InjectRepository(LeadEntity)
    private readonly leadRepository: Repository<LeadEntity>,
    @InjectRepository(CustomerEntity)
    private readonly customerRepository: Repository<CustomerEntity>,
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    @InjectRepository(OrderItemEntity)
    private readonly orderItemRepository: Repository<OrderItemEntity>,
    private readonly recordCustomerActivityService: RecordCustomerActivityService,
  ) {}

  private splitName(name: string): { firstName: string; lastName: string } {
    const trimmed = (name || '').trim();
    if (!trimmed) return { firstName: 'Valued', lastName: 'Customer' };
    const parts = trimmed.split(/\s+/);
    if (parts.length === 1) return { firstName: parts[0].slice(0, 100), lastName: '-' };
    return {
      firstName: parts.slice(0, -1).join(' ').slice(0, 100),
      lastName: parts[parts.length - 1].slice(0, 100),
    };
  }

  async execute(
    leadId: string,
    tenantId: string,
    storeId?: string,
    wonAmount?: number,
    createInitialOrder = false,
    paymentMethod?: string,
    items?: LeadPurchasedItemDto[],
  ): Promise<CustomerEntity> {
    const lead = await this.leadRepository.findOne({
      where: { id: leadId, tenantId },
    });

    if (!lead) {
      throw new NotFoundException(`Lead with ID "${leadId}" not found`);
    }

    // 1. Calculate final deal amount from items or explicit wonAmount
    let finalDealAmount = 0;
    if (wonAmount !== undefined && !isNaN(Number(wonAmount)) && Number(wonAmount) > 0) {
      finalDealAmount = Number(wonAmount);
    } else if (items && items.length > 0) {
      finalDealAmount = items.reduce(
        (sum, it) => sum + (Number(it.unitPrice || 0) * Number(it.quantity || 1)),
        0,
      );
    } else {
      finalDealAmount = Number(lead.estimatedValue || 0);
    }

    lead.estimatedValue = finalDealAmount;

    // 2. Find or create registered customer
    const phone = lead.phone.trim();
    let customer = await this.customerRepository.findOne({
      where: { tenantId, phone },
    });

    const { firstName, lastName } = this.splitName(lead.name);

    if (customer) {
      // Upgrade customer to REGISTERED and ACTIVE
      if (customer.firstName === 'Guest' || !customer.firstName) {
        customer.firstName = firstName;
        customer.lastName = lastName;
      }
      if (lead.email && !customer.email) {
        customer.email = lead.email.trim().toLowerCase();
      }
      customer.status = CustomerStatusEnum.ACTIVE;
      customer.accountType = CustomerAccountTypeEnum.REGISTERED;
      customer = await this.customerRepository.save(customer);
    } else {
      // Create new active customer
      const newCustomer = this.customerRepository.create({
        tenantId,
        storeId: storeId || lead.storeId,
        firstName,
        lastName,
        email: lead.email ? lead.email.trim().toLowerCase() : undefined,
        phone,
        status: CustomerStatusEnum.ACTIVE,
        accountType: CustomerAccountTypeEnum.REGISTERED,
        source: CustomerSourceEnum.ONLINE_STORE,
      });
      customer = await this.customerRepository.save(newCustomer);
    }

    // 3. Mark lead as WON and link to customer
    lead.stage = LeadStageEnum.WON;
    lead.convertedCustomerId = customer.id;
    lead.followUpStatus = 'COMPLETED';
    lead.nextFollowUpAt = null;
    lead.followUpNote = undefined;
    await this.leadRepository.save(lead);

    // 4. Optionally create initial store order with purchased products/items
    if (createInitialOrder && finalDealAmount > 0) {
      try {
        const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
        const initialOrder = this.orderRepository.create({
          tenantId,
          storeSlug: storeId || 'default',
          orderNumber,
          customerId: customer.id,
          customerName: `${customer.firstName} ${customer.lastName}`.trim(),
          customerPhone: customer.phone,
          customerEmail: customer.email,
          shippingAddress: 'Direct Lead Conversion',
          city: 'Dhaka',
          deliveryFee: 0,
          discountAmount: 0,
          orderStatus: OrderStatusEnum.CONFIRMED,
          paymentStatus: PaymentStatusEnum.PAID,
          paymentMethod: (paymentMethod as any) || PaymentMethodEnum.BKASH,
          subtotal: finalDealAmount,
          grandTotal: finalDealAmount,
          channel: 'crm_lead',
        });
        const savedOrder = await this.orderRepository.save(initialOrder);

        // Create line items if products were selected
        const orderItemsToSave: OrderItemEntity[] = (items && items.length > 0)
          ? items.map((it) =>
              this.orderItemRepository.create({
                tenantId,
                orderId: savedOrder.id,
                productId: it.productId || null,
                productTitle: it.productTitle || 'Product Item',
                unitPrice: Number(it.unitPrice) || 0,
                quantity: Number(it.quantity) || 1,
                totalPrice: Number(it.totalPrice) || (Number(it.unitPrice || 0) * Number(it.quantity || 1)),
                isCustomItem: !it.productId,
              }),
            )
          : [
              this.orderItemRepository.create({
                tenantId,
                orderId: savedOrder.id,
                productTitle: 'Direct Deal Items',
                unitPrice: finalDealAmount,
                quantity: 1,
                totalPrice: finalDealAmount,
                isCustomItem: true,
              }),
            ];

        await this.orderItemRepository.save(orderItemsToSave);
      } catch (err) {
        // Non-blocking order creation
      }
    }

    // 5. Record customer activity
    try {
      const itemsSummary = items && items.length > 0
        ? items.map((it) => `${it.productTitle} (x${it.quantity})`).join(', ')
        : 'Deal items';

      await this.recordCustomerActivityService.execute({
        tenantId,
        storeId: storeId || lead.storeId,
        customerId: customer.id,
        eventType: 'LEAD_CONVERTED',
        title: 'Converted from Sales Lead (Deal WON)',
        description: `Lead "${lead.name}" was marked WON with deal amount ৳${finalDealAmount.toLocaleString()}. Products: ${itemsSummary}.`,
        actorName: 'Merchant Staff',
        metadata: {
          leadId: lead.id,
          leadName: lead.name,
          companyName: lead.companyName,
          wonAmount: finalDealAmount,
          items: items || [],
        },
      });
    } catch {
      // Non-blocking activity
    }

    return customer;
  }
}
