import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { BlogPostEntity, BlogPostStatusEnum } from '../entities/blog-post.entity';

export interface PostDetail {
  post: BlogPostEntity;
  related: Array<Pick<BlogPostEntity, 'id' | 'title' | 'slug' | 'excerpt' | 'readingMinutes'>>;
}

@Injectable()
export class GetPostBySlugService {
  constructor(
    @InjectRepository(BlogPostEntity)
    private readonly blogPostRepository: Repository<BlogPostEntity>,
  ) {}

  async execute(slug: string): Promise<PostDetail> {
    const post = await this.blogPostRepository.findOne({
      // Published only: a draft is not reachable by guessing its URL.
      where: { slug, status: BlogPostStatusEnum.PUBLISHED },
    });

    if (!post) {
      throw new NotFoundException('Post not found.');
    }

    const related = await this.blogPostRepository.find({
      where: {
        category: post.category,
        status: BlogPostStatusEnum.PUBLISHED,
        slug: Not(post.slug),
      },
      select: ['id', 'title', 'slug', 'excerpt', 'readingMinutes'],
      order: { publishedAt: 'DESC' },
      take: 3,
    });

    return { post, related };
  }
}
