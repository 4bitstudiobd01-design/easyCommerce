import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlogPostEntity } from '../entities/blog-post.entity';

/** Admin listing: includes drafts, newest activity first. */
@Injectable()
export class ListAllPostsService {
  constructor(
    @InjectRepository(BlogPostEntity)
    private readonly blogPostRepository: Repository<BlogPostEntity>,
  ) {}

  async execute(): Promise<BlogPostEntity[]> {
    return this.blogPostRepository.find({ order: { updatedAt: 'DESC' } });
  }
}
