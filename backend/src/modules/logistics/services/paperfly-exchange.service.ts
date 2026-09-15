import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { CourierProviderEnum } from '../entities/consignment.entity';
import { StoreEntity } from '../../tenant/entities/store.entity';
import { ResolveCourierCredentialsService } from './resolve-courier-credentials.service';
import { CreatePaperflyExchangeOrderDto, PaperflyExchangeOrderResultDto } from '../dto/paperfly-exchange.dto';
import { throwCourierError } from '../adapters/courier-error.util';
import { PAPERFLY_BASE_URL, paperflyAuthHeaders, resolvePaperflyCreds } from '../adapters/paperfly-auth.util';

/**
 * Paperfly exchange orders — PAPERFLY_INTEGRATION_GUIDE.md §3.2.
 *
 * Same physical endpoint as Create Order (new_order_v2.php) with
 * orderType: "Exchange" plus exchange-specific fields. Kept as its own
 * service rather than folded into CreateShipmentService: an exchange is a
 * merchant-initiated action against an already-delivered order, not a new
 * shipment booking in the order→shipment flow the rest of this module models.
 */
@Injectable()
export class PaperflyExchangeService {
  private readonly logger = new Logger(PaperflyExchangeService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly resolveCourierCredentials: ResolveCourierCredentialsService,
  ) {}

  async createExchangeOrder(
    tenantId: string,
    store: StoreEntity | null,
    dto: CreatePaperflyExchangeOrderDto,
  ): Promise<PaperflyExchangeOrderResultDto> {
    const credentials = await this.resolveCourierCredentials.execute(
      tenantId,
      CourierProviderEnum.PAPERFLY,
      store,
    );

    const creds = resolvePaperflyCreds(credentials, this.configService);
    if (!creds) {
      throw new BadRequestException(
        'Connect Paperfly with a Merchant Panel username, password and store name before creating an exchange order.',
      );
    }

    try {
      const res = await axios.post(
        `${PAPERFLY_BASE_URL}/merchant/api/service/new_order_v2.php`,
        {
          merchantOrderReference: dto.merchantOrderReference,
          storeName: dto.storeName || creds.storeName,
          productBrief: dto.productBrief,
          packagePrice: dto.packagePrice,
          max_weight: dto.maxWeight,
          customerName: dto.customerName,
          customerAddress: dto.customerAddress,
          customerPhone: dto.customerPhone,
          orderType: 'Exchange',
          exchangeDescription: dto.exchangeDescription,
          exchangePrice: dto.exchangePrice,
          exchangeWeight: dto.exchangeWeight,
        },
        {
          headers: paperflyAuthHeaders(creds.username, creds.password, this.configService),
          timeout: 10000,
        },
      );

      const trackingNumber = res.data?.success?.tracking_number;
      if (!trackingNumber) {
        this.logger.error(
          `Paperfly exchange order rejected for reference ${dto.merchantOrderReference}: ${JSON.stringify(res.data)}`,
        );
        throw new BadRequestException('Paperfly did not accept this exchange order.');
      }

      return {
        message: res.data?.success?.message || 'successfully inserted',
        trackingNumber: String(trackingNumber),
        trackingBarcode: res.data?.success?.tracking_barcode
          ? String(res.data.success.tracking_barcode)
          : undefined,
      };
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      this.logger.error(
        `Paperfly exchange order request failed for reference ${dto.merchantOrderReference}: ${err?.message}`,
      );
      throwCourierError('Paperfly', err);
    }
  }
}
