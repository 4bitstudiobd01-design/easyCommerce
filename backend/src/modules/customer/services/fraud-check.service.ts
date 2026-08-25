import { Injectable, Logger, NotFoundException, BadGatewayException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { CustomerEntity } from '../entities/customer.entity';

export interface FraudCourierSummary {
  logo?: string;
  data_type?: 'rating' | 'delivery';
  customer_rating?: string;
  risk_level?: string;
  message?: string;
  total: number;
  success: number;
  cancel: number;
}

export interface FraudCheckResult {
  phone: string;
  summaries: Record<string, FraudCourierSummary>;
  totalOrders: number;
  successOrders: number;
  cancelOrders: number;
  successRate: number;
  cancelRate: number;
  checkedAt: string;
  cached: boolean;
}

/** Cached results older than this are treated as stale and re-fetched. */
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Wraps FraudBD's "check-courier-info" endpoint (https://fraudbd.com/api-documentation) —
 * looks up a phone number's cross-courier delivery/cancellation history so
 * merchants can spot high-risk (frequent-cancel) customers before shipping COD.
 * Results are cached on CustomerEntity by phone; FraudBD is rate-limited to
 * 60 req/min so re-checking on every render would be wasteful and risky.
 */
@Injectable()
export class FraudCheckService {
  private readonly logger = new Logger(FraudCheckService.name);

  constructor(
    @InjectRepository(CustomerEntity)
    private readonly customerRepository: Repository<CustomerEntity>,
    private readonly configService: ConfigService,
  ) {}

  /** Look up (and cache) fraud history for a customer already resolved by id. */
  async executeForCustomer(customerId: string, tenantId: string, forceRefresh = false): Promise<FraudCheckResult> {
    const customer = await this.customerRepository.findOne({ where: { id: customerId, tenantId } });
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found.`);
    }

    if (!forceRefresh && customer.fraudCheckedAt && this.isFresh(customer.fraudCheckedAt)) {
      return this.toResult(customer, true);
    }

    const fresh = await this.fetchFromFraudBd(customer.phone);

    customer.fraudTotalOrders = fresh.totalOrders;
    customer.fraudSuccessOrders = fresh.successOrders;
    customer.fraudCancelOrders = fresh.cancelOrders;
    customer.fraudSuccessRate = fresh.successRate;
    customer.fraudCancelRate = fresh.cancelRate;
    customer.fraudSummaries = fresh.summaries;
    customer.fraudCheckedAt = new Date();
    await this.customerRepository.save(customer);

    return { ...fresh, cached: false };
  }

  /**
   * Look up fraud history by raw phone number — used by the order list,
   * where rows carry customerPhone but not always a resolved customerId.
   * Caches onto the matching CustomerEntity row when one exists for this
   * tenant, same as executeForCustomer; otherwise returns the live result
   * uncached (e.g. an order placed before the customer row was created).
   */
  async executeForPhone(phone: string, tenantId: string, forceRefresh = false): Promise<FraudCheckResult> {
    const customer = await this.customerRepository.findOne({ where: { tenantId, phone } });

    if (customer) {
      return this.executeForCustomer(customer.id, tenantId, forceRefresh);
    }

    const fresh = await this.fetchFromFraudBd(phone);
    return { ...fresh, cached: false };
  }

  private isFresh(checkedAt: Date): boolean {
    return Date.now() - new Date(checkedAt).getTime() < CACHE_TTL_MS;
  }

  private toResult(customer: CustomerEntity, cached: boolean): FraudCheckResult {
    return {
      phone: customer.phone,
      summaries: (customer.fraudSummaries as Record<string, FraudCourierSummary>) || {},
      totalOrders: customer.fraudTotalOrders || 0,
      successOrders: customer.fraudSuccessOrders || 0,
      cancelOrders: customer.fraudCancelOrders || 0,
      successRate: customer.fraudSuccessRate != null ? Number(customer.fraudSuccessRate) : 0,
      cancelRate: customer.fraudCancelRate != null ? Number(customer.fraudCancelRate) : 0,
      checkedAt: customer.fraudCheckedAt ? new Date(customer.fraudCheckedAt).toISOString() : new Date().toISOString(),
      cached,
    };
  }

  private async fetchFromFraudBd(phone: string): Promise<Omit<FraudCheckResult, 'cached'>> {
    const apiKey = this.configService.get<string>('FRAUDBD_API_KEY');
    const baseUrl = this.configService.get<string>('FRAUDBD_BASE_URL', 'https://fraudbd.com');

    if (!apiKey) {
      throw new BadGatewayException('FraudBD is not configured for this server.');
    }

    try {
      const response = await axios.post(
        `${baseUrl}/api/check-courier-info`,
        { phone_number: phone },
        {
          headers: { api_key: apiKey, 'Content-Type': 'application/json' },
          timeout: 10000,
        },
      );

      const body = response.data;
      if (!body?.status || !body?.data) {
        throw new BadGatewayException(body?.message || 'FraudBD returned an unexpected response.');
      }

      const summaries: Record<string, FraudCourierSummary> = body.data.Summaries || {};
      const totals = body.data.totalSummary || { total: 0, success: 0, cancel: 0, successRate: 0, cancelRate: 0 };

      return {
        phone,
        summaries,
        totalOrders: Number(totals.total || 0),
        successOrders: Number(totals.success || 0),
        cancelOrders: Number(totals.cancel || 0),
        successRate: Number(totals.successRate || 0),
        cancelRate: Number(totals.cancelRate || 0),
        checkedAt: new Date().toISOString(),
      };
    } catch (err) {
      if (err instanceof BadGatewayException) throw err;
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      this.logger.warn(`FraudBD check failed for a customer lookup (status ${status ?? 'network error'}).`);
      if (status === 429) {
        throw new BadGatewayException('FraudBD rate limit reached. Try again in a moment.');
      }
      throw new BadGatewayException('Unable to reach FraudBD right now.');
    }
  }
}
