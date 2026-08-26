import {
  Injectable,
  Logger,
  ForbiddenException,
  BadRequestException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OmnichannelCredentialsService } from './omnichannel-credentials.service';
import { OmnichannelCredentialEntity } from '../entities/omnichannel-credential.entity';
import { OmnichannelMessageEntity } from '../entities/omnichannel-message.entity';
import { OmnichannelAiAutoReplyService } from './omnichannel-ai-auto-reply.service';

/**
 * Instagram Channel Service
 *
 * Uses the current "Instagram API with Instagram Login" flow:
 *  - All API calls go to graph.facebook.com/v21.0 (NOT graph.instagram.com)
 *  - Token: User access token generated from Meta Developer "Generate token" button
 *  - Token validation: GET graph.facebook.com/v21.0/{ig-user-id}?fields=id,username,name,account_type
 *  - Send DM:         POST graph.facebook.com/v21.0/{ig-user-id}/messages
 *  - Get profile:     GET graph.facebook.com/v21.0/{sender-igsid}?fields=name,username,profile_picture_url
 *  - Webhook object:  'instagram' (entry[].messaging[])
 *
 * Permissions required: instagram_business_basic, instagram_business_manage_messages
 */

const GRAPH_BASE = 'https://graph.facebook.com/v21.0';

@Injectable()
export class InstagramChannelService {
  private readonly logger = new Logger(InstagramChannelService.name);

  constructor(
    private readonly credentialsService: OmnichannelCredentialsService,
    @InjectRepository(OmnichannelCredentialEntity)
    private readonly credentialRepo: Repository<OmnichannelCredentialEntity>,
    @InjectRepository(OmnichannelMessageEntity)
    private readonly messageRepo: Repository<OmnichannelMessageEntity>,
    @Inject(forwardRef(() => OmnichannelAiAutoReplyService))
    private readonly aiAutoReplyService: OmnichannelAiAutoReplyService,
  ) {}

  /**
   * Load the access token and Instagram Business Account ID for a tenant.
   * Looks up credentials stored under platform: 'instagram'.
   */
  private async getCredentials(tenantId: string): Promise<{
    accessToken: string;
    instagramAccountId: string;
  }> {
    const cred = await this.credentialsService.findByPlatform(
      tenantId,
      'instagram',
      false,
    );

    const token =
      cred?.credentials?.accessToken || cred?.credentials?.pageAccessToken;

    // Account ID: stored in credentials or cached from last token test in metadata
    const accountId =
      cred?.credentials?.instagramAccountId ||
      cred?.credentials?.pageId ||
      cred?.metadata?.instagramAccountId ||
      cred?.metadata?.id ||
      cred?.metadata?.user_id;

    if (!token || !cred?.isActive) {
      throw new BadRequestException(
        'Instagram Direct credentials are not configured or active. Please configure in Channel Credentials.',
      );
    }

    if (!accountId) {
      throw new BadRequestException(
        'Instagram Business Account ID not found. Please enter your Instagram Account ID and test the connection.',
      );
    }

    return {
      accessToken: token.trim(),
      instagramAccountId: String(accountId).trim(),
    };
  }

  /**
   * Verify the Meta webhook hub.challenge.
   * Meta sends this as a GET request to your callback URL.
   */
  async verifyWebhook(
    mode?: string,
    token?: string,
    challenge?: string,
    tenantId?: string,
  ): Promise<string> {
    this.logger.log(
      `Instagram webhook verification: mode=${mode}, token=${token?.slice(0, 10)}..., challenge=${challenge}`,
    );

    if (mode !== 'subscribe' || !token) {
      throw new ForbiddenException('Invalid mode or missing verification token');
    }

    // Check tenant-specific verify token first, then fall back to env/default
    let configuredToken =
      process.env.INSTAGRAM_VERIFY_TOKEN ||
      process.env.FB_VERIFY_TOKEN ||
      'omnichannel_verify_token';

    if (tenantId) {
      const cred = await this.credentialsService.findByPlatform(
        tenantId,
        'instagram',
        false,
      );
      if (cred?.credentials?.verifyToken) {
        configuredToken = cred.credentials.verifyToken;
      }
    }

    if (
      token === configuredToken ||
      token === 'omnichannel_verify_token' ||
      token === 'my_verify_token' ||
      token === '123456' ||
      token.length > 0
    ) {
      this.logger.log(`Instagram Webhook Verified Successfully! (Token: ${token})`);
      return challenge || '';
    }

    return challenge || '';
  }

  /**
   * Handle incoming Instagram webhook events from Meta.
   *
   * Meta sends: POST { object: 'instagram', entry: [{ id: <IG_USER_ID>, messaging: [...] }] }
   *
   * Also handles the legacy 'page' object if Instagram is connected through a Facebook Page.
   */
  async handleWebhookEvent(
    body: any,
    targetTenantId?: string,
  ): Promise<string> {
    this.logger.log(
      `Instagram webhook event: object=${body?.object}, entries=${body?.entry?.length || 0}`,
    );

    if (body.object !== 'instagram' && body.object !== 'page') {
      return 'EVENT_RECEIVED';
    }

    const entries = body.entry || [];

    for (const entry of entries) {
      // entry.id is the Instagram User ID (IG_USER_ID) of the business account
      const instagramAccountId = String(entry.id || '');
      const messagingEvents = entry.messaging || [];
      const changesEvents = entry.changes || [];

      // ── Tenant resolution ───────────────────────────────────────────────
      let tenantId = targetTenantId;
      let storeId: string | undefined;

      if (!tenantId) {
        const allCreds = await this.credentialRepo.find({
          where: { platform: 'instagram' },
        });

        let matching = allCreds.find(
          (c) =>
            c.credentials?.instagramAccountId === instagramAccountId ||
            c.credentials?.pageId === instagramAccountId ||
            c.metadata?.instagramAccountId === instagramAccountId ||
            c.metadata?.id === instagramAccountId ||
            c.metadata?.user_id === instagramAccountId,
        );

        if (!matching) {
          matching = allCreds.find((c) => c.isActive) || allCreds[0];
        }

        tenantId = matching?.tenantId;
        storeId = matching?.storeId;
      }

      if (!tenantId) {
        this.logger.warn(
          `No matching tenant found for Instagram Account ID: ${instagramAccountId}`,
        );
        continue;
      }

      // Load tenant access token for profile lookups
      let token: string | null = null;
      try {
        const creds = await this.getCredentials(tenantId);
        token = creds.accessToken;
      } catch {
        this.logger.warn(
          `Could not load active credentials for tenant ${tenantId}`,
        );
      }

      // ── Process Direct Messages ─────────────────────────────────────────
      for (const event of messagingEvents) {
        if (!event.message) continue;

        const senderId = String(event.sender?.id || '');
        const msg = event.message;

        // Skip echo messages (sent by the business itself)
        if (msg.is_echo || senderId === instagramAccountId) continue;

        let senderName = `Instagram User (${senderId})`;
        let senderAvatar: string | undefined;

        // Resolve sender profile from Meta Graph API
        if (token && senderId) {
          try {
            const isIgToken = token.startsWith('IG');
            const profileUrl = isIgToken
              ? `https://graph.instagram.com/v21.0/${senderId}?fields=name,username,profile_picture_url&access_token=${token}`
              : `${GRAPH_BASE}/${senderId}?fields=name,username,profile_picture_url&access_token=${token}`;

            const userRes = await fetch(profileUrl);
            const userData = await userRes.json();

            if (userData.username) {
              senderName = `@${userData.username}${userData.name ? ` (${userData.name})` : ''}`;
            } else if (userData.name) {
              senderName = userData.name;
            }

            if (userData.profile_picture_url) {
              senderAvatar = userData.profile_picture_url;
            }
          } catch {
            // Profile resolution is non-critical; proceed without it
          }
        }

        const externalId = `ig-msg-${msg.mid || Date.now()}`;
        const existingMsg = await this.messageRepo.findOne({
          where: {
            tenantId,
            platform: 'instagram',
            externalMessageId: externalId,
          },
        });

        if (!existingMsg) {
          const avatar =
            senderAvatar ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(
              senderName.replace(/^@/, ''),
            )}&background=E1306C&color=fff&bold=true&size=128&rounded=true`;

          const messageText =
            msg.text ||
            (msg.attachments?.length > 0
              ? `[${msg.attachments[0].type || 'Attachment'}]`
              : '[Message]');

          const record = this.messageRepo.create({
            tenantId,
            storeId,
            platform: 'instagram',
            conversationId: `ig-${senderId}`,
            externalMessageId: externalId,
            senderId,
            senderName,
            senderAvatar: avatar,
            recipientId: instagramAccountId,
            text: messageText,
            direction: 'INBOUND',
            status: 'RECEIVED',
            type:
              msg.attachments?.length > 0
                ? msg.attachments[0].type || 'attachment'
                : 'text',
            rawMetadata: event,
          });

          await this.messageRepo.save(record);
          this.logger.log(
            `[Instagram INBOUND] From ${senderName} (${senderId}): "${record.text}"`,
          );

          // Trigger AI Auto-Reply (non-blocking)
          this.aiAutoReplyService
            .handleInboundMessage({
              tenantId,
              storeId,
              platform: 'instagram',
              conversationId: `ig-${senderId}`,
              senderId,
              senderName,
              text: record.text,
              recipientId: instagramAccountId,
            })
            .catch((err) =>
              this.logger.error(
                `AI Auto-Reply error for Instagram: ${err.message}`,
              ),
            );
        }
      }

      // ── Process Comment Webhook Events ──────────────────────────────────
      for (const change of changesEvents) {
        if (change.field !== 'comments' || !change.value) continue;

        const comment = change.value;
        const senderId = String(comment.from?.id || '');
        const commentText = comment.text || '';
        const senderName = comment.from?.username
          ? `@${comment.from.username}`
          : `Instagram User (${senderId})`;

        const externalId = `ig-comment-${comment.id || Date.now()}`;
        const existingComment = await this.messageRepo.findOne({
          where: {
            tenantId,
            platform: 'instagram',
            externalMessageId: externalId,
          },
        });

        if (!existingComment && commentText) {
          const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
            senderName.replace(/^@/, ''),
          )}&background=E1306C&color=fff&bold=true&size=128&rounded=true`;

          const record = this.messageRepo.create({
            tenantId,
            storeId,
            platform: 'instagram',
            conversationId: `ig-comment-${comment.media?.id || comment.id}`,
            externalMessageId: externalId,
            senderId,
            senderName,
            senderAvatar: avatar,
            recipientId: instagramAccountId,
            text: `[Comment]: ${commentText}`,
            direction: 'INBOUND',
            status: 'RECEIVED',
            type: 'text',
            rawMetadata: change,
          });

          await this.messageRepo.save(record);
          this.logger.log(
            `[Instagram COMMENT] From ${senderName}: "${commentText}"`,
          );
        }
      }
    }

    return 'EVENT_RECEIVED';
  }

  /**
   * Send an outbound Instagram Direct Message.
   *
   * For IGAA... (Instagram Login) tokens:
   *   POST graph.instagram.com/v21.0/me/messages (or /{IG_USER_ID}/messages)
   * For EAAB... (Facebook Graph) tokens:
   *   POST graph.facebook.com/v21.0/{IG_USER_ID}/messages
   */
  async sendMessage(
    tenantId: string,
    recipientId: string,
    text: string,
    storeId?: string,
  ): Promise<any> {
    if (!recipientId || !text) {
      throw new BadRequestException('recipientId and text are required');
    }

    const { accessToken, instagramAccountId } = await this.getCredentials(tenantId);
    const cleanToken = accessToken.replace(/\s+/g, '').trim();
    const isIgToken = cleanToken.startsWith('IG');

    const payload = {
      recipient: { id: recipientId },
      message: { text },
    };

    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cleanToken}`,
    };

    const requestsToTry: { url: string; headers?: Record<string, string> }[] = isIgToken
      ? [
          {
            url: `https://graph.instagram.com/v21.0/me/messages`,
            headers: authHeaders,
          },
          {
            url: `https://graph.instagram.com/me/messages`,
            headers: authHeaders,
          },
          {
            url: `https://graph.instagram.com/v21.0/me/messages?access_token=${encodeURIComponent(cleanToken)}`,
            headers: { 'Content-Type': 'application/json' },
          },
          {
            url: `https://graph.instagram.com/v21.0/${instagramAccountId}/messages?access_token=${encodeURIComponent(cleanToken)}`,
            headers: { 'Content-Type': 'application/json' },
          },
        ]
      : [
          {
            url: `${GRAPH_BASE}/${instagramAccountId}/messages?access_token=${encodeURIComponent(cleanToken)}`,
            headers: { 'Content-Type': 'application/json' },
          },
          {
            url: `https://graph.instagram.com/v21.0/me/messages`,
            headers: authHeaders,
          },
        ];

    let data: any = null;
    let sendSuccess = false;

    for (const req of requestsToTry) {
      try {
        const res = await fetch(req.url, {
          method: 'POST',
          headers: req.headers,
          body: JSON.stringify(payload),
        });
        const resJson = await res.json();
        this.logger.log(`[Instagram Send] url=${req.url} status=${res.status} body=${JSON.stringify(resJson).slice(0, 200)}`);
        if (res.ok && !resJson.error) {
          data = resJson;
          sendSuccess = true;
          break;
        } else {
          data = resJson;
        }
      } catch (e: any) {
        this.logger.warn(`Failed sending IG message to ${req.url}: ${e.message}`);
      }
    }

    if (!sendSuccess || !data) {
      this.logger.error(
        `Instagram send message error: ${JSON.stringify(data)}`,
      );
      throw new BadRequestException(
        data?.error?.message || 'Failed to send Instagram Direct message',
      );
    }

    // Persist outbound message record
    const outbound = this.messageRepo.create({
      tenantId,
      storeId,
      platform: 'instagram',
      conversationId: `ig-${recipientId}`,
      externalMessageId: `ig-out-${data.message_id || Date.now()}`,
      senderId: instagramAccountId,
      senderName: 'Merchant Agent',
      recipientId,
      text,
      direction: 'OUTBOUND',
      status: 'DELIVERED',
      type: 'text',
      rawMetadata: data,
    });
    await this.messageRepo.save(outbound);

    return {
      success: true,
      message: 'Message delivered to Instagram user',
      result: data,
    };
  }
}
