import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentEntity, PaymentTransactionStatusEnum } from '../entities/payment.entity';
import { OrderEntity } from '../../order/entities/order.entity';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as querystring from 'querystring';

export interface SslCommerzInitiateResponse {
  gatewayUrl: string;
  tranId: string;
}

@Injectable()
export class InitiateSslCommerzPaymentService {
  constructor(
    @InjectRepository(PaymentEntity)
    private readonly paymentRepository: Repository<PaymentEntity>,
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    private readonly configService: ConfigService,
  ) {}

  async execute(orderId: string): Promise<SslCommerzInitiateResponse> {
    const order = await this.orderRepository.findOne({ where: { id: orderId } });

    if (!order) {
      throw new NotFoundException(`Order with ID "${orderId}" not found.`);
    }

    const storeId =
      this.configService.get<string>('SSL_STORE_ID') ||
      this.configService.get<string>('SSLCOMMERZ_STORE_ID', 'testbox');
    const storePass =
      this.configService.get<string>('SSL_STORE_PASSWORD') ||
      this.configService.get<string>('SSLCOMMERZ_STORE_PASSWORD', 'qwerty');
    const isSandbox =
      this.configService.get<string>('SSL_IS_SANDBOX', 'true') === 'true';
    const isLive =
      !isSandbox &&
      this.configService.get<string>('SSLCOMMERZ_IS_LIVE', 'false') === 'true';

    const baseUrl = isLive
      ? 'https://securepay.sslcommerz.com'
      : 'https://sandbox.sslcommerz.com';

    const backendUrl = this.configService.get<string>('BACKEND_URL', 'http://localhost:5001');

    const tranId = `TXN-${order.orderNumber}-${Date.now().toString().slice(-4)}`;

    const postData = {
      store_id: storeId,
      store_passwd: storePass,
      total_amount: order.grandTotal,
      currency: 'BDT',
      tran_id: tranId,
      success_url: `${backendUrl}/api/v1/payments/sslcommerz/success`,
      fail_url: `${backendUrl}/api/v1/payments/sslcommerz/fail`,
      cancel_url: `${backendUrl}/api/v1/payments/sslcommerz/cancel`,
      ipn_url: `${backendUrl}/api/v1/payments/sslcommerz/ipn`,
      cus_name: order.customerName,
      cus_email: order.customerEmail || 'customer@example.com',
      cus_add1: order.shippingAddress,
      cus_city: order.city,
      cus_postcode: '1200',
      cus_country: 'Bangladesh',
      cus_phone: order.customerPhone,
      shipping_method: 'NO',
      product_name: `Order #${order.orderNumber}`,
      product_category: 'E-commerce',
      product_profile: 'general',
    };

    try {
      const response = await axios.post(
        `${baseUrl}/gwprocess/v4/api.php`,
        querystring.stringify(postData),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      const resData = response.data;

      if (resData.status === 'SUCCESS' && resData.GatewayPageURL) {
        const payment = this.paymentRepository.create({
          orderId: order.id,
          orderNumber: order.orderNumber,
          tranId,
          amount: Number(order.grandTotal),
          currency: 'BDT',
          status: PaymentTransactionStatusEnum.PENDING,
          tenantId: order.tenantId,
        });

        await this.paymentRepository.save(payment);

        return {
          gatewayUrl: resData.GatewayPageURL,
          tranId,
        };
      }

      throw new BadRequestException(
        resData.failedreason || 'SSLCommerz payment session initialization failed.',
      );
    } catch (err: any) {
      throw new BadRequestException(
        err?.response?.data?.failedreason || err.message || 'SSLCommerz API connection error.',
      );
    }
  }
}
