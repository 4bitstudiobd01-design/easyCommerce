import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateCourierBookingService } from './services/create-courier-booking.service';
import { ListMerchantConsignmentsService } from './services/list-merchant-consignments.service';
import { FindStoreByUserService } from '../tenant/services/find-store-by-user.service';
import { CreateCourierBookingDto } from './dto/create-courier-booking.dto';

@ApiTags('Logistics & Courier')
@Controller('logistics')
export class LogisticsController {
  constructor(
    private readonly createCourierBookingService: CreateCourierBookingService,
    private readonly listMerchantConsignmentsService: ListMerchantConsignmentsService,
    private readonly findStoreByUserService: FindStoreByUserService,
  ) {}

  private async getMerchantTenantId(userId: string): Promise<string> {
    const store = await this.findStoreByUserService.execute(userId);
    if (!store) {
      throw new BadRequestException('Merchant must create a store before booking parcel consignments.');
    }
    return store.tenantId;
  }

  @Post('book')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Book courier consignment parcel for an order' })
  @ApiResponse({ status: 201, description: 'Courier booking created successfully' })
  async bookCourier(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateCourierBookingDto,
  ) {
    const tenantId = await this.getMerchantTenantId(userId);
    return this.createCourierBookingService.execute(dto, tenantId);
  }

  @Get('consignments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all booked courier consignments for merchant' })
  @ApiResponse({ status: 200, description: 'List of courier consignments' })
  async listConsignments(@CurrentUser('sub') userId: string) {
    const tenantId = await this.getMerchantTenantId(userId);
    return this.listMerchantConsignmentsService.execute(tenantId);
  }
}
