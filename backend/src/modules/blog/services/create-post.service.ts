import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlogPostEntity, BlogPostStatusEnum } from '../entities/blog-post.entity';
import { CreateBlogPostDto } from '../dto/create-blog-post.dto';
import { slugifyTitle, estimateReadingMinutes } from './blog-content.helper';

@Injectable()
export class CreatePostService {
  constructor(
    @InjectRepository(BlogPostEntity)
    private readonly blogPostRepository: Repository<BlogPostEntity>,
  ) {}

  async execute(dto: CreateBlogPostDto): Promise<BlogPostEntity> {
    const slug = dto.slug?.trim() || slugifyTitle(dto.title);

    const existing = await this.blogPostRepository.findOne({ where: { slug } });
    if (existing) {
      throw new ConflictException(`A post with the URL "${slug}" already exists.`);
    }

    const status = dto.status ?? BlogPostStatusEnum.DRAFT;

    const post = this.blogPostRepository.create({
      ...dto,
      slug,
      status,
      readingMinutes: estimateReadingMinutes(dto.content),
      // Only stamp a publish date when the post actually goes live.
      publishedAt: status === BlogPostStatusEnum.PUBLISHED ? new Date() : null,
    });

    return this.blogPostRepository.save(post);
  }
}
