import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductEntity } from '../entities/product.entity';

@Injectable()
export class ProductSlugService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
  ) {}

  /**
   * Generates a tenant-scoped URL-friendly slug from input text or normalizes a custom slug.
   * Supports Bangla, English, numbers, and Unicode characters safely.
   */
  async generateSlug(name: string, tenantId: string, currentProductId?: string): Promise<string> {
    const baseSlug = this.slugify(name);
    let candidateSlug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await this.productRepository.findOne({
        where: { tenantId, slug: candidateSlug },
        select: ['id', 'tenantId', 'slug'],
      });

      // If no product uses this slug, or if the existing product is the current one being updated
      if (!existing || (currentProductId && existing.id === currentProductId)) {
        return candidateSlug;
      }

      candidateSlug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  /**
   * Transforms arbitrary string into a clean, URL-safe slug format.
   * Keeps Bangla/Unicode letters, marks, and digits, converts spaces to hyphens, removes special symbols.
   */
  slugify(text: string): string {
    if (!text || !text.trim()) {
      return `product-${Date.now().toString().slice(-6)}`;
    }

    let slug = text
      .trim()
      .toLowerCase()
      // Preserve letters, marks/matras (\p{M}), numbers, spaces, and hyphens across all scripts
      .replace(/[^\p{L}\p{M}\p{N}\s-]/gu, '')
      // Replace whitespace and underscores with a single hyphen
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      // Remove leading and trailing hyphens
      .replace(/^-|-$/g, '');

    if (!slug) {
      slug = `product-${Date.now().toString().slice(-6)}`;
    }

    return slug;
  }
}
