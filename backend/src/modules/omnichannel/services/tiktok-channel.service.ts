import {
  Injectable,
  Logger,
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { OmnichannelCredentialsService } from './omnichannel-credentials.service';
import { OmnichannelMessageEntity } from '../entities/omnichannel-message.entity';
import { OmnichannelCredentialEntity } from '../entities/omnichannel-credential.entity';
import { OmnichannelAiAutoReplyService } from './omnichannel-ai-auto-reply.service';
import { CustomerEntity, CustomerStatusEnum, CustomerAccountTypeEnum, CustomerSourceEnum } from '../../customer/entities/customer.entity';

export interface TikTokOAuthStatePayload {
  tenantId: string;
  storeId?: string;
  timestamp: number;
  nonce: string;
  codeVerifier?: string; // PKCE verifier — needed at token exchange step
}

@Injectable()
export class TikTokChannelService {
  private readonly logger = new Logger(TikTokChannelService.name);

  constructor(
    private readonly credentialsService: OmnichannelCredentialsService,
    @InjectRepository(OmnichannelMessageEntity)
    private readonly messageRepo: Repository<OmnichannelMessageEntity>,
    @InjectRepository(CustomerEntity)
    private readonly customerRepo: Repository<CustomerEntity>,
    @Inject(forwardRef(() => OmnichannelAiAutoReplyService))
    private readonly aiAutoReplyService: OmnichannelAiAutoReplyService,
  ) {}

  /**
   * Resolve TikTok credentials: checks tenant-specific saved credentials first, then falls back to environment variables
   */
  async getEffectiveConfig(
    tenantId?: string,
    overrides?: { clientKey?: string; clientSecret?: string },
  ): Promise<{ clientKey: string; clientSecret: string; redirectUri: string }> {
    let clientKey = overrides?.clientKey?.trim() || '';
    let clientSecret = overrides?.clientSecret?.trim() || '';

    if (tenantId && (!clientKey || !clientSecret)) {
      // mask=false → returns raw unencrypted values (NOT masked with ••••)
      const cred = await this.credentialsService.findByPlatform(tenantId, 'tiktok', false);
      if (cred?.credentials) {
        if (!clientKey && cred.credentials.clientKey) {
          clientKey = String(cred.credentials.clientKey).trim();
        }
        if (!clientSecret && cred.credentials.clientSecret) {
          clientSecret = String(cred.credentials.clientSecret).trim();
        }
      }
    }

    if (!clientKey) {
      clientKey = process.env.TIKTOK_CLIENT_KEY?.trim() || '';
    }
    if (!clientSecret) {
      clientSecret = process.env.TIKTOK_CLIENT_SECRET?.trim() || '';
    }

    const redirectUri =
      process.env.TIKTOK_REDIRECT_URI?.trim() ||
      'http://localhost:5001/api/v1/omnichannel/credentials/tiktok/oauth/callback';

    this.logger.debug(`TikTok effective config — clientKey: "${clientKey?.slice(0,8)}...", redirectUri: "${redirectUri}"`);

    return { clientKey, clientSecret, redirectUri };
  }

  /**
   * Generate a PKCE code_verifier (RFC 7636)
   */
  private generateCodeVerifier(): string {
    return crypto.randomBytes(64).toString('base64url');
  }

  /**
   * Derive PKCE code_challenge from verifier using S256 method
   */
  private deriveCodeChallenge(codeVerifier: string): string {
    return crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');
  }

  /**
   * Generate signed OAuth state for CSRF & multi-tenant attribution.
   * The codeVerifier is embedded so it can be retrieved at the callback step.
   */
  private generateSignedState(
    tenantId: string,
    storeId?: string,
    clientSecret?: string,
    codeVerifier?: string,
  ): string {
    const secret = clientSecret || process.env.JWT_SECRET || 'bitcommerce_tiktok_state_secret';

    const payload: TikTokOAuthStatePayload = {
      tenantId,
      storeId,
      timestamp: Date.now(),
      nonce: crypto.randomBytes(8).toString('hex'),
      codeVerifier,
    };

    const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', secret)
      .update(payloadStr)
      .digest('hex');

    return `${payloadStr}.${signature}`;
  }

  /**
   * Parse and verify signed OAuth state
   */
  public async parseAndVerifyState(state: string): Promise<TikTokOAuthStatePayload> {
    if (!state || !state.includes('.')) {
      throw new BadRequestException('Invalid OAuth state parameter format');
    }

    const [payloadStr, signature] = state.split('.');

    let decoded: TikTokOAuthStatePayload;
    try {
      decoded = JSON.parse(Buffer.from(payloadStr, 'base64url').toString('utf-8'));
    } catch (err: any) {
      throw new BadRequestException(`Malformed OAuth state payload: ${err.message}`);
    }

    // Verify state is not older than 30 minutes
    if (Date.now() - decoded.timestamp > 30 * 60 * 1000) {
      throw new BadRequestException('TikTok OAuth state has expired. Please try connecting again.');
    }

    const { clientSecret } = await this.getEffectiveConfig(decoded.tenantId);
    const secret = clientSecret || process.env.JWT_SECRET || 'bitcommerce_tiktok_state_secret';

    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(payloadStr)
      .digest('hex');

    const sigBuf = Buffer.from(signature, 'hex');
    const expBuf = Buffer.from(expectedSig, 'hex');

    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      throw new ForbiddenException('Invalid OAuth state signature. Possible CSRF attempt.');
    }

    return decoded;
  }

  /**
   * Returns the official TikTok OAuth authorization URL for the merchant
   */
  async getOAuthUrl(
    tenantId: string,
    storeId?: string,
    overrides?: { clientKey?: string; clientSecret?: string },
  ): Promise<{ url: string; state: string }> {
    // If merchant provided keys directly in the modal, persist them first so they stay in DB
    if (overrides?.clientKey || overrides?.clientSecret) {
      const existing = await this.credentialsService.findByPlatform(tenantId, 'tiktok', false);
      const updatedCreds = {
        ...(existing?.credentials || {}),
        ...(overrides.clientKey ? { clientKey: overrides.clientKey.trim() } : {}),
        ...(overrides.clientSecret ? { clientSecret: overrides.clientSecret.trim() } : {}),
      };

      await this.credentialsService.upsert(
        tenantId,
        {
          platform: 'tiktok',
          name: 'TikTok Business',
          credentials: updatedCreds,
        },
        storeId,
      );
    }

    const { clientKey, clientSecret, redirectUri } = await this.getEffectiveConfig(
      tenantId,
      overrides,
    );

    if (!clientKey || !clientSecret) {
      throw new BadRequestException(
        'TikTok App ID / Client Key and Client Secret are required. Please enter them in the configuration modal and click Connect.',
      );
    }

    const isDevApp = clientKey.startsWith('aw') || !/^\d+$/.test(clientKey);

    // Generate PKCE pair for TikTok for Developers (v2 OAuth requires it)
    const codeVerifier = isDevApp ? this.generateCodeVerifier() : undefined;
    const codeChallenge = codeVerifier ? this.deriveCodeChallenge(codeVerifier) : undefined;

    // Embed codeVerifier in state so it's available at the callback
    const state = this.generateSignedState(tenantId, storeId, clientSecret, codeVerifier);

    let url: string;
    if (isDevApp) {
      // TikTok for Developers App (developers.tiktok.com) — requires PKCE
      const devScopes = 'user.info.basic';
      const params = new URLSearchParams({
        client_key: clientKey,
        scope: devScopes,
        response_type: 'code',
        redirect_uri: redirectUri,
        state,
        code_challenge: codeChallenge!,
        code_challenge_method: 'S256',
      });
      url = `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`;
      this.logger.log(`Generated TikTok for Developers (v2 + PKCE) OAuth URL for tenant: ${tenantId} (ClientKey: ${clientKey})`);
    } else {
      // TikTok for Business App (business-api.tiktok.com) — no PKCE needed
      const businessScopes = encodeURIComponent('business.inbox.messages,user.info.basic');
      url = `https://business-api.tiktok.com/portal/auth?app_id=${encodeURIComponent(
        clientKey,
      )}&state=${encodeURIComponent(state)}&redirect_uri=${encodeURIComponent(
        redirectUri,
      )}&scope=${businessScopes}`;
      this.logger.log(`Generated TikTok for Business OAuth URL for tenant: ${tenantId} (AppId: ${clientKey})`);
    }

    return { url, state };
  }

  /**
   * Complete the OAuth code exchange and save tokens securely
   */
  async handleOAuthCallback(code: string, state: string): Promise<{
    tenantId: string;
    storeId?: string;
    accountHandle: string;
    credential: OmnichannelCredentialEntity;
  }> {
    if (!code) {
      throw new BadRequestException('Authorization code is missing from TikTok callback');
    }

    const statePayload = await this.parseAndVerifyState(state);
    const { tenantId, storeId, codeVerifier } = statePayload;
    const { clientKey, clientSecret, redirectUri } = await this.getEffectiveConfig(tenantId);

    if (!clientKey || !clientSecret) {
      throw new BadRequestException('TikTok credentials could not be resolved for this account');
    }

    this.logger.log(`Exchanging TikTok OAuth code for tenant: ${tenantId}...`);

    const isDevApp = clientKey.startsWith('aw') || !/^\d+$/.test(clientKey);
    let tokenData: any;

    // 1. Exchange code for Access & Refresh Tokens
    if (isDevApp) {
      // TikTok for Developers v2 endpoint — requires code_verifier (PKCE)
      try {
        const bodyParams: Record<string, string> = {
          client_key: clientKey,
          client_secret: clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        };
        // Include PKCE verifier if we generated one
        if (codeVerifier) {
          bodyParams.code_verifier = codeVerifier;
        }
        const v2Res = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(bodyParams).toString(),
        });
        const v2Data = await v2Res.json();
        this.logger.log(`TikTok v2 token response: ${JSON.stringify(v2Data)}`);
        if (v2Data?.access_token || v2Data?.data?.access_token) {
          tokenData = {
            code: 0,
            data: v2Data.data || v2Data,
          };
        } else {
          tokenData = v2Data;
        }
      } catch (err: any) {
        this.logger.warn(`TikTok v2 token exchange network notice: ${err.message}`);
      }
    }

    // Fallback or Business API endpoint
    if (!tokenData || (tokenData.code !== 0 && !tokenData.data?.access_token)) {
      try {
        const tokenRes = await fetch('https://business-api.tiktok.com/open_api/v1.3/oauth2/token/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_key: clientKey,
            client_secret: clientSecret,
            code,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri,
          }),
        });
        const bizData = await tokenRes.json();
        if (bizData?.data?.access_token) {
          tokenData = bizData;
        } else if (!tokenData) {
          tokenData = bizData;
        }
      } catch (err: any) {
        this.logger.error(`TikTok business token exchange network error: ${err.message}`);
        if (!tokenData) {
          throw new BadRequestException(`Failed to communicate with TikTok OAuth server: ${err.message}`);
        }
      }
    }

    const payload = tokenData?.data || tokenData;
    const accessToken = payload?.access_token;
    const refreshToken = payload?.refresh_token;
    const openId = payload?.open_id || payload?.advertiser_id || payload?.business_id || '';
    const expiresIn = payload?.expires_in || 86400; // default 24h in seconds

    if (!accessToken) {
      const errMsg = tokenData?.message || tokenData?.error_description || JSON.stringify(tokenData);
      this.logger.error(`TikTok token exchange error: ${errMsg}`);
      throw new BadRequestException(`TikTok token exchange failed: ${errMsg}`);
    }

    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    // 2. Fetch business/user profile info to get display name and handle
    let accountHandle = openId ? `TikTok (${openId.slice(-6)})` : 'TikTok Business Account';
    let profileData: any = {};

    try {
      const profileRes = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,username', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Access-Token': accessToken,
        },
      });
      const resJson = await profileRes.json();
      if (resJson?.data?.user) {
        profileData = resJson.data.user;
        accountHandle = profileData.display_name
          ? `@${profileData.username || profileData.display_name}`
          : accountHandle;
      }
    } catch (e: any) {
      this.logger.warn(`Could not fetch TikTok user info for handle: ${e.message}`);
    }

    // 3. Persist into OmnichannelCredentialEntity securely
    const cred = await this.credentialsService.upsert(
      tenantId,
      {
        platform: 'tiktok',
        name: 'TikTok Business',
        accountHandle,
        credentials: {
          accessToken,
          refreshToken,
          openId,
          expiresAt,
          clientKey,
        },
        metadata: {
          ...profileData,
          openId,
          tokenExpiresAt: expiresAt,
          connectedVia: 'OAUTH',
          connectedAt: new Date().toISOString(),
        },
      },
      storeId,
    );

    // Mark status connected
    cred.status = 'connected';
    cred.isActive = true;
    cred.lastSyncedAt = new Date();
    await this.credentialsService['credentialRepo'].save(cred);

    this.logger.log(`TikTok Business account connected successfully for tenant: ${tenantId} (${accountHandle})`);

    return {
      tenantId,
      storeId,
      accountHandle,
      credential: cred,
    };
  }

  /**
   * Check and refresh access token if nearing expiration
   */
  async getValidAccessToken(tenantId: string): Promise<{ accessToken: string; openId: string }> {
    const cred = await this.credentialsService.findByPlatform(tenantId, 'tiktok', false);
    if (!cred || !cred.credentials?.accessToken) {
      throw new BadRequestException('TikTok Business account is not connected. Please connect via OAuth.');
    }

    if (!cred.isActive) {
      throw new BadRequestException('TikTok integration is currently paused. Please activate it in settings.');
    }

    const { accessToken, refreshToken, expiresAt, openId } = cred.credentials;

    // Check if token expires within 5 minutes
    const isExpired = expiresAt && new Date(expiresAt).getTime() - Date.now() < 5 * 60 * 1000;

    if (isExpired && refreshToken) {
      this.logger.log(`TikTok access token expiring for tenant ${tenantId}. Refreshing token...`);
      const { clientKey, clientSecret } = await this.getEffectiveConfig(tenantId);

      try {
        const refreshRes = await fetch('https://business-api.tiktok.com/open_api/v1.3/oauth2/token/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_key: clientKey,
            client_secret: clientSecret,
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
          }),
        });

        const refreshData = await refreshRes.json();
        const payload = refreshData?.data || refreshData;

        if (payload?.access_token) {
          const newAccessToken = payload.access_token;
          const newRefreshToken = payload.refresh_token || refreshToken;
          const newExpiresIn = payload.expires_in || 86400;
          const newExpiresAt = new Date(Date.now() + newExpiresIn * 1000).toISOString();

          cred.credentials = {
            ...cred.credentials,
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            expiresAt: newExpiresAt,
          };
          cred.lastSyncedAt = new Date();
          await this.credentialsService['credentialRepo'].save(cred);

          this.logger.log(`TikTok access token successfully refreshed for tenant: ${tenantId}`);
          return { accessToken: newAccessToken, openId: openId || '' };
        }
      } catch (err: any) {
        this.logger.warn(`Failed to refresh TikTok token: ${err.message}. Using existing token.`);
      }
    }

    return { accessToken, openId: openId || '' };
  }

  /**
   * Verify TikTok official webhook signature (HMAC-SHA256)
   */
  verifyWebhookSignature(
    signature?: string,
    rawPayload?: string | Buffer,
    clientSecretOverride?: string,
  ): boolean {
    const clientSecret =
      clientSecretOverride ||
      process.env.TIKTOK_CLIENT_SECRET?.trim() ||
      '';

    if (!signature || !rawPayload) {
      return true;
    }

    if (!clientSecret) {
      // In development or if secret is not set, permit webhook
      return true;
    }

    const cleanSig = signature.startsWith('sha256=') ? signature.slice(7) : signature;

    const payloadBuffer = Buffer.isBuffer(rawPayload) ? rawPayload : Buffer.from(rawPayload, 'utf-8');
    const expectedSig = crypto
      .createHmac('sha256', clientSecret)
      .update(payloadBuffer)
      .digest('hex');

    try {
      const sigBuf = Buffer.from(cleanSig, 'hex');
      const expBuf = Buffer.from(expectedSig, 'hex');

      if (sigBuf.length !== expBuf.length) {
        return false;
      }
      return crypto.timingSafeEqual(sigBuf, expBuf);
    } catch {
      return false;
    }
  }

  /**
   * Inbound TikTok Messaging Webhook processor (Idempotent & Multi-tenant)
   */
  async handleWebhookEvent(body: any, rawPayload?: any, signature?: string): Promise<string> {
    this.logger.log(`TikTok webhook event received: ${JSON.stringify(body)}`);

    // 1. Signature verification
    if (signature && rawPayload) {
      const isValid = this.verifyWebhookSignature(signature, rawPayload);
      if (!isValid) {
        this.logger.error('TikTok webhook signature verification failed!');
        throw new ForbiddenException('Invalid TikTok webhook signature');
      }
    }

    // 2. Handle TikTok Webhook Verification Ping / Challenge
    if (body?.challenge || body?.event === 'ping') {
      this.logger.log(`TikTok webhook ping/challenge received.`);
      return body.challenge || 'OK';
    }

    // 3. Extract event structures
    // TikTok messaging events format:
    // { event: 'im.message.receive', data: { message_id, conversation_id, sender: { open_id, username }, content, ... } }
    // Or legacy / shop format: { business_id, open_id, event_id, message: { text, id } }
    const eventType = body?.event || body?.type || 'message';
    const eventData = body?.data || body;

    const businessId = String(
      eventData?.business_id ||
      eventData?.recipient?.open_id ||
      eventData?.advertiser_id ||
      body?.business_id ||
      '',
    );

    const senderOpenId = String(
      eventData?.sender?.open_id ||
      eventData?.from_user_id ||
      eventData?.sender_id ||
      eventData?.open_id ||
      '',
    );

    if (!senderOpenId || senderOpenId === businessId) {
      // Ignore system echoes or events without sender
      return 'EVENT_PROCESSED';
    }

    // 4. Resolve Tenant from business openId / account
    let matchingCred: OmnichannelCredentialEntity | null = null;
    const allTikTokCreds = await this.credentialsService['credentialRepo'].find({
      where: { platform: 'tiktok' },
    });

    if (businessId) {
      matchingCred =
        allTikTokCreds.find(
          (c) =>
            String(c.credentials?.openId || c.metadata?.openId) === businessId ||
            String(c.accountHandle) === businessId,
        ) || null;
    }

    // Fallback: If single tenant active with TikTok, assign
    if (!matchingCred && allTikTokCreds.length === 1 && allTikTokCreds[0].isActive) {
      matchingCred = allTikTokCreds[0];
    } else if (!matchingCred) {
      // Try finding the active one
      matchingCred = allTikTokCreds.find((c) => c.isActive) || null;
    }

    if (!matchingCred) {
      this.logger.warn(`Could not resolve tenant for TikTok message (businessId: ${businessId}, senderId: ${senderOpenId})`);
      return 'TENANT_NOT_FOUND';
    }

    const tenantId = matchingCred.tenantId;
    const storeId = matchingCred.storeId;

    // 5. Message Content & External ID
    const rawMsg = eventData?.message || eventData;
    const msgText =
      rawMsg?.text ||
      (typeof rawMsg?.content === 'string' ? rawMsg.content : rawMsg?.content?.text) ||
      (rawMsg?.attachments ? '[Attachment / Media]' : '[TikTok Message]');

    const rawEventId = String(
      eventData?.message_id ||
      eventData?.msg_id ||
      body?.event_id ||
      rawMsg?.id ||
      Date.now(),
    );
    const externalMessageId = `tt-msg-${rawEventId}`;

    // 6. Idempotency Check: prevent processing duplicate webhook deliveries
    const existing = await this.messageRepo.findOne({
      where: { tenantId, platform: 'tiktok', externalMessageId },
    });

    if (existing) {
      this.logger.log(`TikTok message ${externalMessageId} already processed. Skipping (Idempotent).`);
      return 'DUPLICATE_EVENT_IGNORED';
    }

    // 7. Sender Information & Customer Record
    const senderName =
      eventData?.sender?.display_name ||
      eventData?.sender?.username ||
      `TikTok User (${senderOpenId.slice(-6)})`;

    const senderAvatar =
      eventData?.sender?.avatar_url ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(senderName)}&background=010101&color=fff&bold=true&size=128&rounded=true`;

    // Ensure customer contact exists in CRM
    await this.findOrCreateCustomerContact(tenantId, senderOpenId, senderName, storeId);

    // 8. Persist Inbound Message to Database
    const record = this.messageRepo.create({
      tenantId,
      storeId,
      platform: 'tiktok',
      conversationId: `tt-${senderOpenId}`,
      externalMessageId,
      senderId: senderOpenId,
      senderName,
      senderAvatar,
      recipientId: businessId || 'tiktok_business',
      text: msgText,
      direction: 'INBOUND',
      status: 'RECEIVED',
      type: 'text',
      rawMetadata: body,
    });

    await this.messageRepo.save(record);
    this.logger.log(`[TikTok INBOUND] From ${senderName} (${senderOpenId}): "${record.text}"`);

    // 9. Dispatch to AI Auto-Reply engine
    this.aiAutoReplyService
      .handleInboundMessage({
        tenantId,
        storeId,
        platform: 'tiktok',
        conversationId: `tt-${senderOpenId}`,
        senderId: senderOpenId,
        senderName,
        text: record.text,
        recipientId: businessId || 'tiktok_business',
      })
      .catch((err) => this.logger.error(`AI Auto-Reply error for TikTok: ${err.message}`));

    return 'EVENT_PROCESSED';
  }

  /**
   * Find or create contact representation in CustomerEntity
   */
  private async findOrCreateCustomerContact(
    tenantId: string,
    openId: string,
    displayName: string,
    storeId?: string,
  ): Promise<CustomerEntity | null> {
    try {
      const syntheticPhone = `tt_${openId.slice(-10)}`;
      let customer = await this.customerRepo.findOne({
        where: { tenantId, phone: syntheticPhone },
      });

      if (!customer) {
        const nameParts = displayName.split(' ');
        const firstName = nameParts[0] || 'TikTok';
        const lastName = nameParts.slice(1).join(' ') || 'Customer';

        customer = this.customerRepo.create({
          tenantId,
          storeId,
          firstName,
          lastName,
          phone: syntheticPhone,
          status: CustomerStatusEnum.ACTIVE,
          accountType: CustomerAccountTypeEnum.GUEST,
          source: CustomerSourceEnum.ONLINE_STORE,
        });

        await this.customerRepo.save(customer);
        this.logger.log(`Created new CRM customer for TikTok user: ${displayName}`);
      }
      return customer;
    } catch (e: any) {
      this.logger.warn(`Failed to sync customer profile for TikTok user ${openId}: ${e.message}`);
      return null;
    }
  }

  /**
   * Outbound message reply to customer via official TikTok Business Messaging API
   */
  async sendMessage(
    tenantId: string,
    recipientId: string,
    text: string,
    storeId?: string,
    options?: { skipDbSave?: boolean },
  ): Promise<any> {
    if (!recipientId || !text) {
      throw new BadRequestException('recipientId and text are required');
    }

    const { accessToken } = await this.getValidAccessToken(tenantId);

    const payload = {
      recipient: { open_id: recipientId },
      message: { text },
      messaging_type: 'RESPONSE',
    };

    this.logger.log(`Sending TikTok outbound reply to recipient: ${recipientId}...`);

    let apiResponseData: any;
    try {
      const res = await fetch('https://business-api.tiktok.com/open_api/v1.3/business/message/send/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Access-Token': accessToken,
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      apiResponseData = await res.json();

      if (!res.ok || (apiResponseData.code !== 0 && apiResponseData.error)) {
        const errDesc = apiResponseData.message || apiResponseData.error?.message || JSON.stringify(apiResponseData);
        this.logger.error(`TikTok send message API error: ${errDesc}`);
        throw new BadRequestException(`Failed to deliver message via TikTok API: ${errDesc}`);
      }
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      this.logger.error(`Network error sending TikTok message: ${err.message}`);
      throw new BadRequestException(`TikTok messaging network error: ${err.message}`);
    }

    // Save outbound message to messageRepo unless skipDbSave is requested
    if (!options?.skipDbSave) {
      const outbound = this.messageRepo.create({
        tenantId,
        storeId,
        platform: 'tiktok',
        conversationId: `tt-${recipientId}`,
        externalMessageId: `tt-out-${apiResponseData?.data?.message_id || Date.now()}`,
        senderId: 'agent',
        senderName: 'Merchant Agent',
        recipientId,
        text,
        direction: 'OUTBOUND',
        status: 'DELIVERED',
        type: 'text',
        rawMetadata: apiResponseData,
      });

      await this.messageRepo.save(outbound);
    }

    return {
      success: true,
      message: 'Message delivered to TikTok user',
      result: apiResponseData,
    };
  }

  /**
   * Disconnect TikTok account and revoke/remove tokens
   */
  async disconnect(tenantId: string): Promise<{ success: boolean; message: string }> {
    const cred = await this.credentialsService.findByPlatform(tenantId, 'tiktok', false);
    if (!cred) {
      return { success: true, message: 'TikTok is not connected.' };
    }

    await this.credentialsService.remove(tenantId, 'tiktok');
    this.logger.log(`TikTok Business account disconnected for tenant: ${tenantId}`);

    return {
      success: true,
      message: 'TikTok Business account disconnected successfully.',
    };
  }
}
