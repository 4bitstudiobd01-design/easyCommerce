import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlogPostEntity } from '../entities/blog-post.entity';

@Injectable()
export class DeletePostService {
  constructor(
    @InjectRepository(BlogPostEntity)
    private readonly blogPostRepository: Repository<BlogPostEntity>,
  ) {}

  async execute(id: string): Promise<{ id: string }> {
    const post = await this.blogPostRepository.findOne({ where: { id } });
    if (!post) {
      throw new NotFoundException('Post not found.');
    }

    await this.blogPostRepository.remove(post);
    return { id };
  }
}
