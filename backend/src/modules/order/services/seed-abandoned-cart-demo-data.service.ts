import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { AbandonedCartEntity } from '../entities/abandoned-cart.entity';
import { ProductEntity } from '../../catalog/entities/product.entity';

export interface SeedAbandonedCartDemoResult {
  success: boolean;
  message: string;
  cartsCreated: number;
}

const DEMO_CUSTOMERS = [
  { name: 'Ayesha Siddika', phone: '+8801712345678', email: 'ayesha@example.com', address: 'House 12, Road 5, Dhanmondi, Dhaka' },
  { name: 'Rakib Hasan', phone: '+8801811223344', email: 'rakib@example.com', address: 'Flat B3, Green Road, Dhaka' },
  { name: 'Sumaiya Akter', phone: '+8801911556677', email: undefined, address: 'Agrabad C/A, Chittagong' },
  { name: 'Tanvir Ahmed', phone: '+8801611889900', email: 'tanvir@example.com', address: 'Zindabazar, Sylhet' },
  { name: undefined, phone: '+8801511101010', email: undefined, address: undefined },
];

function hoursAgo(n: number): Date {
  const d = new Date();
  d.setUTCHours(d.getUTCHours() - n);
  return d;
}

/**
 * Seeds demo abandoned carts so the checkout-recovery page shows data
 * immediately in dev. Idempotent — if the store already has abandoned carts it
 * does nothing. Needs at least one catalog product to build cart line items.
 */
@Injectable()
export class SeedAbandonedCartDemoDataService {
  constructor(
    @InjectRepository(AbandonedCartEntity)
    private readonly abandonedCartRepository: Repository<AbandonedCartEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
  ) {}

  async execute(tenantId: string): Promise<SeedAbandonedCartDemoResult> {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException(
        'The abandoned-cart demo seeder is disabled in production environments.',
      );
    }

    const existing = await this.abandonedCartRepository.count({ where: { tenantId } });
    if (existing > 0) {
      return {
        success: true,
        message: 'Abandoned-cart demo data already present — nothing seeded.',
        cartsCreated: 0,
      };
    }

    const products = await this.productRepository.find({
      where: { tenantId },
      take: 8,
      order: { createdAt: 'ASC' },
    });
    if (products.length === 0) {
      return {
        success: false,
        message: 'No catalog products found — add products before seeding abandoned carts.',
        cartsCreated: 0,
      };
    }

    const rows: Partial<AbandonedCartEntity>[] = DEMO_CUSTOMERS.map((customer, i) => {
      const lineCount = 1 + (i % 3);
      const items = Array.from({ length: lineCount }).map((_, j) => {
        const product = products[(i + j) % products.length];
        const unitPrice = Number(product.basePrice) > 0 ? Number(product.basePrice) : 500 + (j % 4) * 250;
        const quantity = 1 + ((i + j) % 3);
        return {
          productId: product.id,
          name: product.name,
          unitPrice,
          quantity,
          lineTotal: Number((unitPrice * quantity).toFixed(2)),
        };
      });
      const totalAmount = Number(
        items.reduce((sum, it) => sum + it.lineTotal, 0).toFixed(2),
      );
      // The oldest cart is marked recovered so the list shows both states.
      const isRecovered = i === DEMO_CUSTOMERS.length - 1;
      return {
        customerName: customer.name,
        customerPhone: customer.phone,
        customerEmail: customer.email,
        shippingAddress: customer.address,
        itemsJson: items,
        totalAmount,
        recoveryToken: randomBytes(16).toString('hex'),
        isRecovered,
        lastRemindedAt: i % 2 === 0 ? hoursAgo(i * 6 + 2) : undefined,
        tenantId,
        createdAt: hoursAgo(i * 8 + 3),
      };
    });

    const saved = await this.abandonedCartRepository.save(
      rows.map((r) => this.abandonedCartRepository.create(r)),
    );

    return {
      success: true,
      message: 'Abandoned-cart demo data seeded.',
      cartsCreated: saved.length,
    };
  }
}
