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
  'key',
  'accessToken',
  'botToken',
  'apiSecret',
  'pageAccessToken',
  'verifyToken',
  'adminAccessToken',
];

function isSensitiveKey(key: string): boolean {
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
      } else if (dto.platform === 'slack' && dto.credentials.defaultChannel) {
        defaultHandle = `#${dto.credentials.defaultChannel}`;
      }
    }

    if (existing) {
      // Merge credentials: don't overwrite with masked placeholders
      const mergedCreds: Record<string, any> = { ...existing.credentials };
      for (const [k, v] of Object.entries(dto.credentials || {})) {
        if (typeof v === 'string' && v.includes('••••••••')) {
          // Keep existing unmasked secret
          continue;
        }
        mergedCreds[k] = v;
      }

      existing.name = name;
      existing.credentials = mergedCreds;
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
        if (typeof v === 'string' && !v.includes('••••••••')) {
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
            `https://graph.facebook.com/v19.0/${phoneNumberId.trim()}?access_token=${accessToken.trim()}`,
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
        case 'instagram': {
          const token = credsToTest.pageAccessToken || credsToTest.accessToken;
          const pageId = credsToTest.pageId || credsToTest.instagramAccountId;
          if (!token) {
            return {
              success: false,
              message: 'Page Access Token is required.',
            };
          }

          let response = await fetch(
            `https://graph.facebook.com/v19.0/me?fields=id,name&access_token=${token.trim()}`,
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
                message: `Facebook Messenger Page Token verified for ${displayName}`,
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

        case 'slack': {
          const { botToken } = credsToTest;
          if (!botToken) {
            return {
              success: false,
              message: 'Slack Bot Token (xoxb-...) is required.',
            };
          }

          const response = await fetch('https://slack.com/api/auth.test', {
            headers: { Authorization: `Bearer ${botToken.trim()}` },
          });
          const data = await response.json();

          if (!data.ok) {
            if (existing) {
              existing.status = 'error';
              await this.credentialRepo.save(existing);
            }
            return { success: false, message: data.error || 'Invalid Slack token' };
          }

          if (existing) {
            existing.status = 'connected';
            existing.accountHandle = `@${data.user} in team ${data.team}`;
            existing.lastSyncedAt = new Date();
            existing.metadata = { ...existing.metadata, ...data };
            await this.credentialRepo.save(existing);
          }

          return {
            success: true,
            message: `Slack connected successfully as @${data.user} in workspace ${data.team}`,
            data,
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
            message: `${platform.toUpperCase()} credentials validated successfully!`,
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
