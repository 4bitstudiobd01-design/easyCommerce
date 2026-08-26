import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  Res,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WhatsAppChannelService } from '../services/whatsapp-channel.service';
import { FacebookChannelService } from '../services/facebook-channel.service';
import { InstagramChannelService } from '../services/instagram-channel.service';
import { TelegramChannelService } from '../services/telegram-channel.service';

@ApiTags('Omnichannel Webhooks')
@Controller('webhooks')
export class OmnichannelWebhookController {
  constructor(
    private readonly whatsappService: WhatsAppChannelService,
    private readonly facebookService: FacebookChannelService,
    private readonly instagramService: InstagramChannelService,
    private readonly telegramService: TelegramChannelService,
  ) {}

  // ─── WhatsApp Cloud API Webhook ─────────────────────────────────────────

  @Get('whatsapp')
  @ApiOperation({ summary: 'WhatsApp Cloud API webhook verification challenge' })
  async verifyWhatsApp(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const verified = await this.whatsappService.verifyWebhook(
      mode,
      token,
      challenge,
    );
    return res.status(HttpStatus.OK).send(verified);
  }

  @Post('whatsapp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'WhatsApp Cloud API webhook event receiver' })
  async handleWhatsAppEvent(@Body() body: any, @Res() res: Response) {
    await this.whatsappService.handleWebhookEvent(body);
    return res.status(HttpStatus.OK).send('EVENT_RECEIVED');
  }

  // ─── Instagram Direct Webhook ──────────────────────────────────────────

  @Get('instagram')
  @ApiOperation({ summary: 'Instagram Direct webhook verification challenge' })
  async verifyInstagram(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const verified = await this.instagramService.verifyWebhook(
      mode,
      token,
      challenge,
    );
    return res.status(HttpStatus.OK).send(verified);
  }

  @Post('instagram')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Instagram Direct webhook event receiver' })
  async handleInstagramEvent(@Body() body: any, @Res() res: Response) {
    await this.instagramService.handleWebhookEvent(body);
    return res.status(HttpStatus.OK).send('EVENT_RECEIVED');
  }

  // ─── Facebook Messenger Webhook ──────────────────────────────────────────

  @Get('facebook')
  @ApiOperation({ summary: 'Facebook Messenger webhook verification challenge' })
  async verifyFacebook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const verified = await this.facebookService.verifyWebhook(
      mode,
      token,
      challenge,
    );
    return res.status(HttpStatus.OK).send(verified);
  }

  @Post('facebook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Facebook Messenger webhook event receiver' })
  async handleFacebookEvent(@Body() body: any, @Res() res: Response) {
    if (body?.object === 'instagram') {
      await this.instagramService.handleWebhookEvent(body);
    } else {
      await this.facebookService.handleWebhookEvent(body);
    }
    return res.status(HttpStatus.OK).send('EVENT_RECEIVED');
  }

  // ─── Telegram Webhook ───────────────────────────────────────────────────

  @Post('telegram/:tenantId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Telegram bot webhook update receiver per tenant' })
  async handleTelegramUpdate(
    @Param('tenantId') tenantId: string,
    @Body() update: any,
  ) {
    return this.telegramService.handleWebhookUpdate(tenantId, update);
  }
}

