import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Headers,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FindStoreByUserService } from '../tenant/services/find-store-by-user.service';
import { SubscribeNewsletterService } from './services/subscribe-newsletter.service';
import { ListSubscribersService } from './services/list-subscribers.service';
import { CreateCampaignService } from './services/create-campaign.service';
import { ListCampaignsService } from './services/list-campaigns.service';
import { SendCampaignBroadcastService } from './services/send-campaign-broadcast.service';
import { SubscribeNewsletterDto } from './dto/subscribe-newsletter.dto';
import { CreateEmailCampaignDto } from './dto/create-campaign.dto';

@ApiTags('Automated Email Marketing & Customer Newsletter System')
@Controller('email-marketing')
export class EmailMarketingController {
  constructor(
    private readonly subscribeNewsletterService: SubscribeNewsletterService,
    private readonly listSubscribersService: ListSubscribersService,
    private readonly createCampaignService: CreateCampaignService,
    private readonly listCampaignsService: ListCampaignsService,
    private readonly sendCampaignBroadcastService: SendCampaignBroadcastService,
    private readonly findStoreByUserService: FindStoreByUserService,
  ) {}

  private async getStoreContext(userId: string, storeIdHeader?: string) {
    const store = await this.findStoreByUserService.execute(userId, storeIdHeader);
    if (!store) {
      throw new BadRequestException('Merchant store context not found.');
    }
    return store;
  }

  // --- PUBLIC UNPROTECTED STOREFRONT ENDPOINT ---

  @Post('public/subscribe')
  @ApiOperation({ summary: 'Public endpoint for storefront visitors to subscribe to newsletter' })
  @ApiResponse({ status: 201, description: 'Subscribed to newsletter successfully' })
  async subscribePublic(@Body() dto: SubscribeNewsletterDto) {
    return this.subscribeNewsletterService.execute(dto);
  }

  // --- MERCHANT ADMIN PROTECTED ENDPOINTS ---

  @Get('subscribers')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all newsletter subscribers for active store' })
  @ApiResponse({ status: 200, description: 'List of newsletter subscribers' })
  async listSubscribers(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.listSubscribersService.execute(store.id);
  }

  @Get('campaigns')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all email marketing campaigns' })
  @ApiResponse({ status: 200, description: 'List of email campaigns' })
  async listCampaigns(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.listCampaignsService.execute(store.id);
  }

  @Post('campaigns')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new email broadcast campaign' })
  @ApiResponse({ status: 201, description: 'Campaign created successfully' })
  async createCampaign(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Body() dto: CreateEmailCampaignDto,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.createCampaignService.execute(store.tenantId, store.id, dto);
  }

  @Post('campaigns/:id/send')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Trigger 1-click email campaign broadcast' })
  @ApiResponse({ status: 200, description: 'Campaign broadcast completed' })
  async sendCampaign(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') headerStoreId: string,
    @Param('id') campaignId: string,
  ) {
    const store = await this.getStoreContext(userId, headerStoreId);
    return this.sendCampaignBroadcastService.execute(store.id, campaignId);
  }
}
