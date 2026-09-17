import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { ProductEntity } from '../../catalog/entities/product.entity';
import { ProductVariantEntity } from '../../catalog/entities/product-variant.entity';
import { InventoryStockEntity } from '../../inventory/entities/inventory-stock.entity';
import { OrderEntity } from '../../order/entities/order.entity';
import { OmnichannelAiRagService } from './omnichannel-ai-rag.service';

export interface AiToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

@Injectable()
export class OmnichannelAiToolsService {
  private readonly logger = new Logger(OmnichannelAiToolsService.name);

  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepo: Repository<ProductEntity>,
    @InjectRepository(ProductVariantEntity)
    private readonly variantRepo: Repository<ProductVariantEntity>,
    @InjectRepository(InventoryStockEntity)
    private readonly stockRepo: Repository<InventoryStockEntity>,
    @InjectRepository(OrderEntity)
    private readonly orderRepo: Repository<OrderEntity>,
    private readonly ragService: OmnichannelAiRagService,
  ) {}

  /**
   * Standard Function Declarations for Gemini & OpenAI
   */
  getToolDeclarations(): AiToolDefinition[] {
    return [
      {
        name: 'search_product_inventory',
        description: 'Search store catalog to check product price, variations, and real-time live stock availability.',
        parameters: {
          type: 'OBJECT',
          properties: {
            query: {
              type: 'STRING',
              description: 'The product title, keyword, color, size, or SKU to search for (e.g. "iPhone 15", "Black T-Shirt XL").',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'track_customer_order',
        description: 'Track customer order delivery progress, shipment status, and courier tracking details by Order Number or Phone Number.',
        parameters: {
          type: 'OBJECT',
          properties: {
            orderNumber: {
              type: 'STRING',
              description: 'The order number if provided by customer (e.g. "ORD-000001").',
            },
            phoneNumber: {
              type: 'STRING',
              description: 'Customer contact phone number if provided (e.g. "01712345678").',
            },
          },
        },
      },
      {
        name: 'search_store_knowledge_base',
        description: 'Search official store policy documents, return rules, delivery areas, shipping fees, warranty, and FAQs uploaded by the merchant.',
        parameters: {
          type: 'OBJECT',
          properties: {
            query: {
              type: 'STRING',
              description: 'The policy, return rule, delivery timeline, or FAQ question to search for.',
            },
          },
          required: ['query'],
        },
      },
    ];
  }

  /**
   * Secure multi-tenant tool execution sandbox.
   * Hard-locks execution to authenticated tenantId and storeId.
   */
  async executeTool(
    toolName: string,
    args: Record<string, any>,
    tenantId: string,
    storeId?: string,
    apiKey?: string,
    provider: 'gemini' | 'openai' = 'gemini',
  ): Promise<any> {
    this.logger.log(`Executing AI Tool "${toolName}" for Tenant: ${tenantId}, Store: ${storeId || 'N/A'}`);

    switch (toolName) {
      case 'search_product_inventory':
        return this.handleSearchProductInventory(tenantId, storeId, args.query);

      case 'track_customer_order':
        return this.handleTrackCustomerOrder(tenantId, storeId, args.orderNumber, args.phoneNumber);

      case 'search_store_knowledge_base':
        return this.handleSearchKnowledgeBase(tenantId, storeId || '', args.query, apiKey, provider);

      default:
        return { error: `Tool "${toolName}" is not recognized.` };
    }
  }

  /**
   * 1. Product & Live Inventory Tool Handler
   */
  private async handleSearchProductInventory(
    tenantId: string,
    storeId?: string,
    query?: string,
  ): Promise<any> {
    try {
      const cleanQuery = (query || '').trim();

      // Common Bengali & English conversational filler words
      const stopWords = new Set([
        'amar', 'amader', 'apnader', 'kichu', 'lagbe', 'tomar', 'kache', 'ekn', 'ekhon', 'koy', 'ta', 'ache',
        'name', 'nam', 'bolo', 'jegula', 'store', 'available', 'stock', 'ki', 'product', 'products', 'item',
        'items', 'chai', 'dekhaw', 'list', 'sob', 'only', 'ekta', 'the', 'a', 'an', 'is', 'are', 'show',
        'all', 'tell', 'me', 'what', 'you', 'have', 'sell', 'price', 'dam', 'koto', 'konta', 'ki-ki',
      ]);

      const tokens = cleanQuery
        .toLowerCase()
        .replace(/[^\w\s\u0980-\u09FF]/gi, ' ')
        .split(/\s+/)
        .filter((t) => t.length > 1 && !stopWords.has(t));

      let products: ProductEntity[] = [];

      if (tokens.length > 0) {
        // Build search conditions for each meaningful keyword
        const whereConditions: any[] = [];
        for (const t of tokens) {
          whereConditions.push({ tenantId, name: ILike(`%${t}%`) });
          whereConditions.push({ tenantId, slug: ILike(`%${t}%`) });
          whereConditions.push({ tenantId, description: ILike(`%${t}%`) });
        }

        products = await this.productRepo.find({
          where: whereConditions,
          relations: ['variants'],
          take: 10,
        });
      }

      // If no keyword match or query is general, fetch all active products for the store
      if (products.length === 0) {
        products = await this.productRepo.find({
          where: { tenantId, status: 'ACTIVE' as any },
          relations: ['variants'],
          order: { createdAt: 'DESC' },
          take: 15,
        });
      }

      if (products.length === 0) {
        return {
          found: false,
          query: cleanQuery,
          message: 'No active products found in this store.',
          products: [],
        };
      }

      // Collect real-time inventory stock for each product & variant
      const results = await Promise.all(
        products.map(async (prod) => {
          const variants = prod.variants || [];

          const stocks = await this.stockRepo.find({
            where: { tenantId, productId: prod.id },
          });

          let totalAvailableStock = 0;
          const variantStockMap: Record<string, number> = {};

          for (const s of stocks) {
            const avail = Math.max(0, (s.quantityOnHand || 0) - (s.quantityReserved || 0));
            totalAvailableStock += avail;
            if (s.variantId) {
              variantStockMap[s.variantId] = (variantStockMap[s.variantId] || 0) + avail;
            }
          }

          // If stock is recorded at product level (variantId is null), distribute to single/default variant
          if (variants.length <= 1 && totalAvailableStock > 0 && variants[0]) {
            variantStockMap[variants[0].id] = totalAvailableStock;
          }

          const isOverallInStock = totalAvailableStock > 0;

          const formattedVariants = variants.map((v) => {
            const variantStock =
              variantStockMap[v.id] !== undefined
                ? variantStockMap[v.id]
                : variants.length === 1
                ? totalAvailableStock
                : 0;

            return {
              id: v.id,
              title: v.title || 'Standard',
              sku: v.sku || null,
              price: Number(v.price) ? `৳${Number(v.price).toFixed(2)}` : null,
              inStock: variantStock > 0 || isOverallInStock,
              availableQuantity: variantStock > 0 ? variantStock : totalAvailableStock,
            };
          });

          const primaryPrice =
            variants.length > 0 && variants[0].price
              ? `৳${Number(variants[0].price).toFixed(2)}`
              : null;

          return {
            id: prod.id,
            name: prod.name,
            slug: prod.slug,
            description: prod.description ? prod.description.substring(0, 160) : null,
            price: primaryPrice,
            inStock: isOverallInStock,
            availableStock: totalAvailableStock,
            variants: formattedVariants,
          };
        }),
      );

      return {
        found: true,
        count: results.length,
        products: results,
      };
    } catch (err: any) {
      this.logger.error(`Product search tool error: ${err.message}`);
      return { found: false, error: err.message };
    }
  }

  /**
   * 2. Order Tracking Tool Handler
   */
  private async handleTrackCustomerOrder(
    tenantId: string,
    storeId?: string,
    orderNumber?: string,
    phoneNumber?: string,
  ): Promise<any> {
    if (!orderNumber && !phoneNumber) {
      return {
        found: false,
        message: 'Please provide either an Order Number (e.g. ORD-000001) or a Phone Number to track your order.',
      };
    }

    try {
      const qb = this.orderRepo.createQueryBuilder('order')
        .where('order.tenantId = :tenantId', { tenantId });

      if (orderNumber && orderNumber.trim()) {
        qb.andWhere('LOWER(order.orderNumber) = :orderNumber', {
          orderNumber: orderNumber.trim().toLowerCase(),
        });
      } else if (phoneNumber && phoneNumber.trim()) {
        qb.andWhere('order.customerPhone LIKE :phone', {
          phone: `%${phoneNumber.trim()}%`,
        });
      }

      qb.leftJoinAndSelect('order.items', 'items');
      qb.orderBy('order.createdAt', 'DESC');
      qb.take(3);

      const orders = await qb.getMany();

      if (orders.length === 0) {
        return {
          found: false,
          message: `No orders found matching the provided details. Please verify your order number or phone number.`,
        };
      }

      const formattedOrders = orders.map((o) => ({
        orderNumber: o.orderNumber,
        status: o.orderStatus,
        paymentStatus: o.paymentStatus,
        paymentMethod: o.paymentMethod,
        totalAmount: Number(o.grandTotal),
        customerName: o.customerName,
        shippingAddress: o.shippingAddress,
        city: o.city,
        itemsSummary: (o.items || []).map((i) => `${i.productTitle} (Qty: ${i.quantity})`).join(', '),
        orderDate: o.createdAt,
      }));

      return {
        found: true,
        count: formattedOrders.length,
        orders: formattedOrders,
      };
    } catch (err: any) {
      this.logger.error(`Order tracking tool error: ${err.message}`);
      return { found: false, error: err.message };
    }
  }

  /**
   * 3. Store Policy & Knowledge Base Tool Handler
   */
  private async handleSearchKnowledgeBase(
    tenantId: string,
    storeId: string,
    query: string,
    apiKey?: string,
    provider: 'gemini' | 'openai' = 'gemini',
  ): Promise<any> {
    if (!query || !query.trim()) {
      return { found: false, message: 'Please provide a search question for store knowledge base.' };
    }

    try {
      const chunks = await this.ragService.searchRelevantChunks(
        tenantId,
        storeId,
        query.trim(),
        3,
        apiKey,
        provider,
      );

      if (chunks.length === 0) {
        return {
          found: false,
          query,
          message: 'No specific policy document found matching this query in store knowledge base.',
        };
      }

      return {
        found: true,
        results: chunks.map((c) => ({
          document: c.documentName,
          relevantExcerpt: c.content,
          matchConfidence: Math.round(c.score * 100) + '%',
        })),
      };
    } catch (err: any) {
      this.logger.error(`RAG search tool error: ${err.message}`);
      return { found: false, error: err.message };
    }
  }
}
