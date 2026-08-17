import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlogPostEntity, BlogPostStatusEnum } from '../entities/blog-post.entity';

export interface PublishedPostSummary {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  authorName: string;
  category: string;
  coverImageUrl: string | null;
  publishedAt: Date | null;
  readingMinutes: number;
}

/**
 * Public blog index. Returns published posts only — drafts must never reach an
 * unauthenticated reader — and omits the body so the listing stays light.
 */
@Injectable()
export class ListPublishedPostsService {
  constructor(
    @InjectRepository(BlogPostEntity)
    private readonly blogPostRepository: Repository<BlogPostEntity>,
  ) {}

  async execute(category?: string): Promise<PublishedPostSummary[]> {
    const query = this.blogPostRepository
      .createQueryBuilder('post')
      .select([
        'post.id',
        'post.title',
        'post.slug',
        'post.excerpt',
        'post.authorName',
        'post.category',
        'post.coverImageUrl',
        'post.publishedAt',
        'post.readingMinutes',
      ])
      .where('post.status = :status', { status: BlogPostStatusEnum.PUBLISHED })
      .orderBy('post.publishedAt', 'DESC');

    if (category) {
      query.andWhere('post.category = :category', { category });
    }

    return query.getMany();
  }
}
