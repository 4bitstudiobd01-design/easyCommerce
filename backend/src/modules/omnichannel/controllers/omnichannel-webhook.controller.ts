import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  Headers,
  Req,
  Res,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WhatsAppChannelService } from '../services/whatsapp-channel.service';
import { FacebookChannelService } from '../services/facebook-channel.service';
import { InstagramChannelService } from '../services/instagram-channel.service';
import { TelegramChannelService } from '../services/telegram-channel.service';
import { TikTokChannelService } from '../services/tiktok-channel.service';

@ApiTags('Omnichannel Webhooks')
@Controller('webhooks')
export class OmnichannelWebhookController {
  constructor(
    private readonly whatsappService: WhatsAppChannelService,
    private readonly facebookService: FacebookChannelService,
    private readonly instagramService: InstagramChannelService,
    private readonly telegramService: TelegramChannelService,
    private readonly tiktokService: TikTokChannelService,
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

  // ─── TikTok Business Messaging Webhook ───────────────────────────────────

  @Get('tiktok')
  @ApiOperation({ summary: 'TikTok Webhook verification challenge or ping' })
  async verifyTikTok(
    @Query('challenge') challenge: string,
    @Query('event') event: string,
    @Res() res: Response,
  ) {
    return res.status(HttpStatus.OK).send(challenge || event || 'TIKTOK_WEBHOOK_READY');
  }

  @Post('tiktok')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'TikTok Business Messaging webhook event receiver' })
  async handleTikTokEvent(
    @Body() body: any,
    @Req() req: Request,
    @Headers('x-tiktok-signature') sig1: string,
    @Headers('tt-signature') sig2: string,
    @Res() res: Response,
  ) {
    const signature = sig1 || sig2;
    const rawPayload = (req as any).rawBody || JSON.stringify(body);
    const result = await this.tiktokService.handleWebhookEvent(body, rawPayload, signature);
    return res.status(HttpStatus.OK).send(result);
  }

  @Get('tiktok/oauth/callback')
  @ApiOperation({ summary: 'TikTok OAuth callback alias redirect' })
  async handleTikTokOAuthCallbackAlias(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    try {
      const result = await this.tiktokService.handleOAuthCallback(code, state);
      return res.redirect(
        `${frontendUrl}/admin/crm/omnichannel?connected=tiktok&handle=${encodeURIComponent(
          result.accountHandle,
        )}`,
      );
    } catch (err: any) {
      return res.redirect(
        `${frontendUrl}/admin/crm/omnichannel?error=${encodeURIComponent(`tiktok_${err.message}`)}`,
      );
    }
  }
}

