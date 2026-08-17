import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum BlogPostStatusEnum {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
}

/**
 * A post on the BitCommerce marketing blog.
 *
 * This is platform-owned content written by the BitCommerce team, not merchant
 * content — so unlike catalog entities it carries no tenantId and is never
 * filtered by tenant.
 */
@Entity('blog_posts')
@Index(['slug'], { unique: true })
@Index(['status', 'publishedAt'])
export class BlogPostEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 255 })
  slug: string;

  // Short summary shown on the blog index and in social previews.
  @Column({ type: 'varchar', length: 500, default: '' })
  excerpt: string;

  // Post body as markdown-ish plain text; rendered as paragraphs on the client.
  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', length: 120, default: 'BitCommerce Team' })
  authorName: string;

  @Column({ type: 'varchar', length: 100, default: 'Product' })
  category: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  coverImageUrl: string | null;

  @Column({
    type: 'enum',
    enum: BlogPostStatusEnum,
    default: BlogPostStatusEnum.DRAFT,
  })
  status: BlogPostStatusEnum;

  // Null until the post is first published.
  @Column({ type: 'timestamptz', nullable: true })
  publishedAt: Date | null;

  // Rough minutes-to-read, derived from word count when the post is saved.
  @Column({ type: 'int', default: 1 })
  readingMinutes: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
