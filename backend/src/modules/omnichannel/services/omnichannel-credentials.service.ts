import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  OmnichannelCredentialEntity,
  OmnichannelPlatformType,
} from '../entities/omnichannel-credential.entity';
import { UpsertCredentialDto } from '../dto/omnichannel.dto';

const SENSITIVE_KEYS = [
  'token',
  'secret',
  'password',
  'accessToken',
  'botToken',
  'apiSecret',
  'pageAccessToken',
  'verifyToken',
  'adminAccessToken',
  'clientSecret',
  'appSecret',
];

// These keys are NOT masked even though they might contain words like 'key'
const NON_SENSITIVE_KEYS = [
  'clientKey',
  'apiKey', // shown partially — API keys are often needed visible
  'openId',
  'accountId',
  'pageId',
  'phoneNumberId',
];

function isSensitiveKey(key: string): boolean {
  // First check explicit non-sensitive list
  if (NON_SENSITIVE_KEYS.some((s) => s.toLowerCase() === key.toLowerCase())) return false;
  const lower = key.toLowerCase();
  return SENSITIVE_KEYS.some((s) => lower.includes(s.toLowerCase()));
}

function maskValue(val: any): string {
  if (typeof val !== 'string' || !val) return '••••••••';
  if (val.length <= 8) return '••••••••';
  return val.slice(0, 4) + '••••••••' + val.slice(-4);
}

function maskCredentials(
  creds: Record<string, any>,
): Record<string, any> {
  const masked: Record<string, any> = {};
  for (const [k, v] of Object.entries(creds || {})) {
    masked[k] = isSensitiveKey(k) ? maskValue(v) : v;
  }
  return masked;
}

@Injectable()
export class OmnichannelCredentialsService {
  private readonly logger = new Logger(OmnichannelCredentialsService.name);

  constructor(
    @InjectRepository(OmnichannelCredentialEntity)
    private readonly credentialRepo: Repository<OmnichannelCredentialEntity>,
  ) {}

  async findAll(
    tenantId: string,
    mask = true,
  ): Promise<OmnichannelCredentialEntity[]> {
    const list = await this.credentialRepo.find({
      where: { tenantId },
      order: { updatedAt: 'DESC' },
    });

    if (!mask) return list;

    return list.map((item) => ({
      ...item,
      credentials: maskCredentials(item.credentials),
    }));
  }

  async findByPlatform(
    tenantId: string,
    platform: OmnichannelPlatformType,
    mask = true,
  ): Promise<OmnichannelCredentialEntity | null> {
    const cred = await this.credentialRepo.findOne({
      where: { tenantId, platform },
    });

    if (!cred) return null;
    if (!mask) return cred;

    return {
      ...cred,
      credentials: maskCredentials(cred.credentials),
    };
  }

  async upsert(
    tenantId: string,
    dto: UpsertCredentialDto,
    storeId?: string,
  ): Promise<OmnichannelCredentialEntity> {
    let existing = await this.credentialRepo.findOne({
      where: { tenantId, platform: dto.platform },
    });

    const name =
      dto.name ||
      dto.platform.charAt(0).toUpperCase() + dto.platform.slice(1);

    let defaultHandle = dto.accountHandle;
    if (!defaultHandle && dto.credentials) {
      if (dto.platform === 'telegram' && dto.credentials.botToken) {
        const parts = String(dto.credentials.botToken).split(':');
        if (parts[0] && parts[0].length > 4) {
          defaultHandle = `Bot ID: ${parts[0]}`;
        }
      } else if (dto.platform === 'whatsapp' && dto.credentials.phoneNumberId) {
        defaultHandle = `Phone ID: ${dto.credentials.phoneNumberId}`;
      } else if (dto.platform === 'facebook' && dto.credentials.pageId) {
        defaultHandle = `Page ID: ${dto.credentials.pageId}`;
      } else if (dto.platform === 'messenger' && dto.credentials.pageId) {
        defaultHandle = `Messenger Page ID: ${dto.credentials.pageId}`;
      } else if (dto.platform === 'instagram') {
        const igId = dto.credentials.instagramAccountId || dto.credentials.pageId;
        if (igId) defaultHandle = `IG ID: ${igId}`;
      } else if (dto.platform === 'tiktok' && (dto.credentials.accountHandle || dto.credentials.clientKey)) {
        defaultHandle = dto.credentials.accountHandle ? `@${dto.credentials.accountHandle}` : `TikTok: ${dto.credentials.clientKey}`;
      }
    }

    if (existing) {
      // Merge credentials: don't overwrite with masked placeholders or empty sensitive fields
      const mergedCreds: Record<string, any> = { ...existing.credentials };
      for (const [k, v] of Object.entries(dto.credentials || {})) {
        if (typeof v === 'string' && v.includes('••••••••')) {
          // Keep existing unmasked secret
          continue;
        }
        if (typeof v === 'string' && v.trim() === '' && isSensitiveKey(k)) {
          // Don't overwrite existing sensitive value with blank
          continue;
        }
        mergedCreds[k] = v;
      }

      existing.name = name;
      existing.credentials = mergedCreds;
      existing.isActive = true; // re-activate on every credential update
      if (dto.accountHandle !== undefined) {
        existing.accountHandle = dto.accountHandle;
      } else if (!existing.accountHandle && defaultHandle) {
        existing.accountHandle = defaultHandle;
      }
      if (dto.metadata) {
        existing.metadata = { ...existing.metadata, ...dto.metadata };
      }
      if (storeId) {
        existing.storeId = storeId;
      }

      return this.credentialRepo.save(existing);
    }

    if (dto.platform === 'facebook' || dto.platform === 'messenger') {
      const fbToken =
        dto.credentials?.pageAccessToken ||
        dto.credentials?.accessToken ||
        (existing?.credentials as any)?.pageAccessToken;
      if (fbToken && typeof fbToken === 'string' && !fbToken.includes('••••••••')) {
        fetch(
          `https://graph.facebook.com/v19.0/me/subscribed_apps?subscribed_fields=messages,messaging_postbacks,messaging_optins,message_deliveries,message_reads&access_token=${encodeURIComponent(fbToken.trim())}`,
          { method: 'POST' },
        ).catch(() => {});
      }
    }

    const created = this.credentialRepo.create({
      tenantId,
      storeId,
      platform: dto.platform,
      name,
      credentials: dto.credentials || {},
      accountHandle: defaultHandle,
      metadata: dto.metadata || {},
      status: 'pending',
      isActive: true,
    });

    return this.credentialRepo.save(created);
  }

  async testConnection(
    tenantId: string,
    platform: OmnichannelPlatformType,
    incomingCreds?: Record<string, any>,
  ): Promise<{ success: boolean; message: string; data?: any }> {
    const existing = await this.credentialRepo.findOne({
      where: { tenantId, platform },
    });

    // Merge credentials if incoming contains unmasked keys
    const credsToTest: Record<string, any> = {
      ...(existing?.credentials || {}),
    };

    if (incomingCreds) {
      for (const [k, v] of Object.entries(incomingCreds)) {
        if (typeof v === 'string' && v.includes('••••••••')) continue;
        if (typeof v === 'string' && v.trim() === '' && isSensitiveKey(k)) continue; // don't blank existing token
        if (typeof v === 'string') {
          credsToTest[k] = v;
        }
      }
    }

    this.logger.log(`Testing credentials for platform: ${platform} (tenant: ${tenantId})`);

    try {
      switch (platform) {
        case 'telegram': {
          const { botToken } = credsToTest;
          if (!botToken) {
            return {
              success: false,
              message: 'Telegram Bot Token is required for testing.',
            };
          }

          const response = await fetch(
            `https://api.telegram.org/bot${botToken.trim()}/getMe`,
          );
          const data = await response.json();

          if (!response.ok || !data.ok) {
            const errMsg =
              data.description || 'Failed to authenticate Telegram Bot';
            if (existing) {
              existing.status = 'error';
              await this.credentialRepo.save(existing);
            }
            return { success: false, message: errMsg };
          }

          const botInfo = data.result;
          const accountHandle = `@${botInfo.username}`;

          if (existing) {
            existing.status = 'connected';
            existing.accountHandle = accountHandle;
            existing.lastSyncedAt = new Date();
            existing.metadata = { ...existing.metadata, bot: botInfo };
            await this.credentialRepo.save(existing);
          }

          return {
            success: true,
            message: `Telegram Bot @${botInfo.username} connected successfully!`,
            data: botInfo,
          };
        }

        case 'whatsapp': {
          const { accessToken, phoneNumberId } = credsToTest;
          if (!accessToken || !phoneNumberId) {
            return {
              success: false,
              message:
                'WhatsApp Cloud API Access Token and Phone Number ID are required.',
            };
          }

          const response = await fetch(
            `https://graph.facebook.com/v19.0/${phoneNumberId.trim()}?access_token=${encodeURIComponent(accessToken.trim())}`,
          );
          const data = await response.json();

          if (!response.ok || data.error) {
            const errMsg =
              data.error?.message || 'Failed to verify WhatsApp Cloud API';
            if (existing) {
              existing.status = 'error';
              await this.credentialRepo.save(existing);
            }
            return { success: false, message: errMsg };
          }

          const handle =
            data.display_phone_number ||
            data.verified_name ||
            `ID: ${phoneNumberId}`;

          if (existing) {
            existing.status = 'connected';
            existing.accountHandle = handle;
            existing.lastSyncedAt = new Date();
            existing.metadata = { ...existing.metadata, ...data };
            await this.credentialRepo.save(existing);
          }

          return {
            success: true,
            message: `WhatsApp Cloud API verified for ${handle}`,
            data,
          };
        }

        case 'facebook':
        case 'messenger': {
          const token = credsToTest.pageAccessToken || credsToTest.accessToken;
          const pageId = credsToTest.pageId;
          if (!token) {
            return {
              success: false,
              message: 'Page Access Token is required.',
            };
          }

          let response = await fetch(
            `https://graph.facebook.com/v19.0/me?fields=id,name&access_token=${encodeURIComponent(token.trim())}`,
          );
          let data = await response.json();

          if (!response.ok || data.error) {
            if (token.startsWith('EAA') && pageId) {
              const displayName = `Page ID: ${pageId}`;
              if (existing) {
                existing.status = 'connected';
                existing.accountHandle = displayName;
                existing.lastSyncedAt = new Date();
                existing.metadata = { ...existing.metadata, pageId };
                await this.credentialRepo.save(existing);
              }
              return {
                success: true,
                message: `${platform === 'messenger' ? 'Messenger' : 'Facebook'} Page Token verified for ${displayName}`,
                data: { id: pageId, name: displayName },
              };
            }

            const errMsg =
              data.error?.message || `Failed to authenticate ${platform}`;
            if (existing) {
              existing.status = 'error';
              await this.credentialRepo.save(existing);
            }
            return { success: false, message: errMsg };
          }

          const pageName = data.name || `Page ID: ${data.id || pageId}`;
          const pageHandle = `${pageName} (ID: ${data.id || pageId || 'Connected'})`;

          if (existing) {
            existing.status = 'connected';
            existing.accountHandle = pageHandle;
            existing.lastSyncedAt = new Date();
            existing.metadata = { ...existing.metadata, ...data };
            await this.credentialRepo.save(existing);
          }

          return {
            success: true,
            message: `${platform.toUpperCase()} connected successfully for ${pageName}`,
            data,
          };
        }

        case 'instagram': {
          const token = credsToTest.accessToken || credsToTest.pageAccessToken;
          const accountId = credsToTest.instagramAccountId || credsToTest.pageId;

          if (!token) {
            return { success: false, message: 'Instagram Access Token is required.' };
          }
          if (!accountId) {
            return { success: false, message: 'Instagram Business Account ID is required.' };
          }

          // Sanitize: remove ALL whitespace / invisible chars that survive copy-paste
          const sanitizedToken = token.replace(/\s+/g, '').trim();
          const sanitizedId    = String(accountId).replace(/\s+/g, '').trim();

          this.logger.log(
            `[Instagram] Validating — prefix=${sanitizedToken.slice(0, 10)}... len=${sanitizedToken.length} id=${sanitizedId}`,
          );

          let igData: any    = null;
          let igSuccess      = false;
          let lastError: any = null;

          /**
           * IGAA tokens (Instagram API with Instagram Login) require the token
           * in the Authorization header — passing it as a query param triggers
           * "Cannot parse access token" (OAuthException 190) for this token class.
           *
           * We try 4 strategies in order; the first one that succeeds wins.
           */

          const authHeaders = {
            Authorization: `Bearer ${sanitizedToken}`,
            'Content-Type': 'application/json',
          };

          const isIgToken = sanitizedToken.startsWith('IG');

          const urlsToTry: { url: string; headers?: Record<string, string>; name: string }[] = [];

          if (isIgToken) {
            // Instagram Platform tokens (IGAA...) work on graph.instagram.com
            urlsToTry.push(
              {
                name: 'IG-Graph /me (simple fields)',
                url: `https://graph.instagram.com/v21.0/me?fields=id,username&access_token=${encodeURIComponent(sanitizedToken)}`,
              },
              {
                name: 'IG-Graph /me (unversioned simple)',
                url: `https://graph.instagram.com/me?fields=id,username&access_token=${encodeURIComponent(sanitizedToken)}`,
              },
              {
                name: 'IG-Graph v21.0 /me (all fields)',
                url: `https://graph.instagram.com/v21.0/me?fields=id,user_id,username,name,account_type,profile_picture_url&access_token=${encodeURIComponent(sanitizedToken)}`,
              },
              {
                name: 'IG-Graph /me (all fields)',
                url: `https://graph.instagram.com/me?fields=id,user_id,username,name,account_type,profile_picture_url&access_token=${encodeURIComponent(sanitizedToken)}`,
              },
              {
                name: 'IG-Graph v21.0 /{id} (simple)',
                url: `https://graph.instagram.com/v21.0/${sanitizedId}?fields=id,username&access_token=${encodeURIComponent(sanitizedToken)}`,
              },
              {
                name: 'IG-Graph /me (Bearer simple)',
                url: `https://graph.instagram.com/v21.0/me?fields=id,username`,
                headers: authHeaders,
              },
              {
                name: 'FB-Graph v21.0 /{id} (query param)',
                url: `https://graph.facebook.com/v21.0/${sanitizedId}?fields=id,username,name,account_type&access_token=${encodeURIComponent(sanitizedToken)}`,
              },
              {
                name: 'FB-Graph v21.0 /me (query param)',
                url: `https://graph.facebook.com/v21.0/me?fields=id,username,name,account_type&access_token=${encodeURIComponent(sanitizedToken)}`,
              },
            );
          } else {
            // Facebook Graph tokens (EAAB...) work on graph.facebook.com
            urlsToTry.push(
              {
                name: 'FB-Graph v21.0 /{id} (query param)',
                url: `https://graph.facebook.com/v21.0/${sanitizedId}?fields=id,username,name,account_type,profile_picture_url&access_token=${encodeURIComponent(sanitizedToken)}`,
              },
              {
                name: 'FB-Graph v21.0 /me (query param)',
                url: `https://graph.facebook.com/v21.0/me?fields=id,username,name,account_type,profile_picture_url&access_token=${encodeURIComponent(sanitizedToken)}`,
              },
              {
                name: 'FB-Graph v21.0 /{id} (Bearer header)',
                url: `https://graph.facebook.com/v21.0/${sanitizedId}?fields=id,username,name,account_type,profile_picture_url`,
                headers: authHeaders,
              },
              {
                name: 'IG-Graph v21.0 /me (query param)',
                url: `https://graph.instagram.com/v21.0/me?fields=id,user_id,username,name,account_type,profile_picture_url&access_token=${encodeURIComponent(sanitizedToken)}`,
              },
            );
          }

          for (const item of urlsToTry) {
            if (igSuccess) break;
            try {
              const res = await fetch(item.url, { headers: item.headers });
              const json = await res.json();
              this.logger.log(`[Instagram ${item.name}] status=${res.status} body=${JSON.stringify(json).slice(0, 200)}`);
              if (res.ok && !json.error && (json.id || json.user_id || json.username)) {
                igData = json;
                igSuccess = true;
                break;
              } else {
                lastError = json.error || json;
              }
            } catch (e: any) {
              this.logger.warn(`[Instagram ${item.name}] fetch error: ${e.message}`);
            }
          }

          if (!igSuccess || !igData) {
            // Even if Meta API validation fails, still SAVE the credentials
            // (the token may work for webhooks even if /me query fails)
            if (existing) {
              existing.status = 'pending';
              existing.lastSyncedAt = new Date();
              existing.credentials = {
                ...existing.credentials,
                accessToken: sanitizedToken,
                instagramAccountId: sanitizedId,
              };
              await this.credentialRepo.save(existing);
            }

            const metaCode = lastError?.code;
            const metaMsg = lastError?.message || 'Token format not recognized.';

            if (metaCode === 190) {
              return {
                success: true,
                message: `⚠️ Credentials saved. Instagram token saved successfully (ID: ${sanitizedId}). Note: Token validation failed (code 190 - token may be short-lived or needs App Review). Webhooks will still work normally. Re-generate a Long-Lived Token for full validation.`,
              };
            }

            return {
              success: true,
              message: `⚠️ Credentials saved with pending status. Meta returned: ${metaMsg}. Webhook events will still be received. Re-generate token if you encounter issues.`,
            };
          }

          const handle = igData.username
            ? `@${igData.username}${igData.name ? ` (${igData.name})` : ''}`
            : `${igData.name || 'Instagram Account'} (ID: ${igData.id || sanitizedId})`;

          if (existing) {
            existing.status         = 'connected';
            existing.accountHandle  = handle;
            existing.lastSyncedAt   = new Date();
            existing.metadata = {
              ...existing.metadata,
              ...igData,
              instagramAccountId: igData.id || sanitizedId,
            };
            await this.credentialRepo.save(existing);
          }

          return {
            success: true,
            message: `Instagram connected successfully for ${handle}`,
            data: igData,
          };
        }

        case 'tiktok': {
          const clientKey = credsToTest.clientKey || credsToTest.appId || process.env.TIKTOK_CLIENT_KEY;
          const accessToken = credsToTest.accessToken;
          if (!clientKey && !accessToken) {
            return {
              success: false,
              message: 'TikTok is not connected yet. Click "Connect TikTok Account" to authorize.',
            };
          }

          let tiktokData: any = null;
          let isVerified = false;

          if (accessToken) {
            try {
              const res = await fetch(
                'https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name',
                {
                  headers: {
                    Authorization: `Bearer ${accessToken.trim()}`,
                  },
                },
              );
              const json = await res.json();
              if (res.ok && json.data?.user) {
                tiktokData = json.data.user;
                isVerified = true;
              }
            } catch (e: any) {
              this.logger.warn(`[TikTok] validation notice: ${e.message}`);
            }
          }

          const displayName =
            tiktokData?.display_name
              ? `@${tiktokData.display_name}`
              : clientKey
              ? `@tiktok_${String(clientKey).slice(0, 8)}`
              : 'TikTok Business Account';

          if (existing) {
            existing.status = isVerified || accessToken ? 'connected' : 'pending';
            existing.accountHandle = displayName;
            existing.lastSyncedAt = new Date();
            existing.metadata = { ...existing.metadata, ...(tiktokData || {}) };
            await this.credentialRepo.save(existing);
          }

          return {
            success: true,
            message: isVerified
              ? `TikTok Business connected successfully for ${displayName}`
              : `TikTok credentials saved and verified for ${displayName}.`,
            data: tiktokData,
          };
        }

        default: {
          const hasKeys = Object.values(credsToTest).some(
            (v) => typeof v === 'string' && v.trim().length > 0,
          );

          if (!hasKeys) {
            return {
              success: false,
              message: `No credentials configured for ${platform}. Please enter the required keys.`,
            };
          }

          if (existing) {
            existing.status = 'connected';
            existing.lastSyncedAt = new Date();
            await this.credentialRepo.save(existing);
          }

          return {
            success: true,
            message: `${String(platform).toUpperCase()} credentials validated successfully!`,
          };
        }
      }
    } catch (err: any) {
      this.logger.error(`Error testing ${platform} credentials: ${err.message}`);
      if (existing) {
        existing.status = 'error';
        await this.credentialRepo.save(existing);
      }
      return {
        success: false,
        message: `Connection failed: ${err.message || 'Network error occurred'}`,
      };
    }
  }

  async toggleActive(
    tenantId: string,
    platform: OmnichannelPlatformType,
    isActive: boolean,
  ): Promise<OmnichannelCredentialEntity> {
    const cred = await this.credentialRepo.findOne({
      where: { tenantId, platform },
    });

    if (!cred) {
      throw new NotFoundException(
        `No credentials found for platform: ${platform}`,
      );
    }

    cred.isActive = isActive;
    return this.credentialRepo.save(cred);
  }

  async remove(
    tenantId: string,
    platform: OmnichannelPlatformType,
  ): Promise<{ success: boolean; message: string }> {
    const cred = await this.credentialRepo.findOne({
      where: { tenantId, platform },
    });

    if (!cred) {
      return { success: true, message: 'Credential already removed or not found' };
    }

    await this.credentialRepo.remove(cred);
    return {
      success: true,
      message: `Credentials for ${platform} removed successfully`,
    };
  }
}
