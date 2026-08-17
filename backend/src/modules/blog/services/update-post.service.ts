import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { BlogPostEntity, BlogPostStatusEnum } from '../entities/blog-post.entity';
import { UpdateBlogPostDto } from '../dto/update-blog-post.dto';
import { estimateReadingMinutes } from './blog-content.helper';

@Injectable()
export class UpdatePostService {
  constructor(
    @InjectRepository(BlogPostEntity)
    private readonly blogPostRepository: Repository<BlogPostEntity>,
  ) {}

  async execute(id: string, dto: UpdateBlogPostDto): Promise<BlogPostEntity> {
    const post = await this.blogPostRepository.findOne({ where: { id } });
    if (!post) {
      throw new NotFoundException('Post not found.');
    }

    if (dto.slug && dto.slug !== post.slug) {
      const clash = await this.blogPostRepository.findOne({
        where: { slug: dto.slug, id: Not(id) },
      });
      if (clash) {
        throw new ConflictException(`A post with the URL "${dto.slug}" already exists.`);
      }
    }

    // First publish stamps the date; later edits must not reset it, otherwise
    // the post would jump to the top of the index every time it is corrected.
    const isFirstPublish =
      dto.status === BlogPostStatusEnum.PUBLISHED && post.status !== BlogPostStatusEnum.PUBLISHED;

    Object.assign(post, dto);

    if (dto.content) {
      post.readingMinutes = estimateReadingMinutes(dto.content);
    }
    if (isFirstPublish && !post.publishedAt) {
      post.publishedAt = new Date();
    }

    return this.blogPostRepository.save(post);
  }
}
