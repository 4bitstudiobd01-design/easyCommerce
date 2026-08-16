import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { ApiKeyEntity } from '../entities/api-key.entity';

export interface CreatedApiKey {
  id: string;
  name: string;
  /** Plaintext key — returned exactly once, never stored or recoverable. */
  key: string;
  keyPrefix: string;
  createdAt: Date;
}

/** Client-safe view of a key: everything except the stored hash. */
export interface ApiKeySummary {
  id: string;
  name: string;
  keyPrefix: string;
  isActive: boolean;
  lastUsedAt?: Date;
  createdAt: Date;
}

@Injectable()
export class ManageApiKeysService {
  constructor(
    @InjectRepository(ApiKeyEntity)
    private readonly apiKeyRepository: Repository<ApiKeyEntity>,
  ) {}

  private hashKey(plaintext: string): string {
    return crypto.createHash('sha256').update(plaintext).digest('hex');
  }

  /** Never returns `keyHash` — the hash is a credential-equivalent secret. */
  async list(tenantId: string, storeId: string): Promise<ApiKeySummary[]> {
    const keys = await this.apiKeyRepository.find({
      where: { tenantId, storeId },
      order: { createdAt: 'DESC' },
      select: ['id', 'name', 'keyPrefix', 'isActive', 'lastUsedAt', 'createdAt'],
    });

    return keys.map((k) => ({
      id: k.id,
      name: k.name,
      keyPrefix: k.keyPrefix,
      isActive: k.isActive,
      lastUsedAt: k.lastUsedAt,
      createdAt: k.createdAt,
    }));
  }

  async create(tenantId: string, storeId: string, name: string): Promise<CreatedApiKey> {
    // 32 random bytes -> 64 hex chars, prefixed so keys are recognisable in logs.
    const plaintext = `ec_live_${crypto.randomBytes(32).toString('hex')}`;
    const keyPrefix = plaintext.slice(0, 16);

    const entity = this.apiKeyRepository.create({
      tenantId,
      storeId,
      name,
      keyPrefix,
      keyHash: this.hashKey(plaintext),
      isActive: true,
    });

    const saved = await this.apiKeyRepository.save(entity);

    return {
      id: saved.id,
      name: saved.name,
      key: plaintext,
      keyPrefix: saved.keyPrefix,
      createdAt: saved.createdAt,
    };
  }

  async revoke(tenantId: string, keyId: string): Promise<{ success: boolean }> {
    const result = await this.apiKeyRepository.delete({ id: keyId, tenantId });
    if (!result.affected) {
      throw new NotFoundException('API key not found.');
    }
    return { success: true };
  }
}
