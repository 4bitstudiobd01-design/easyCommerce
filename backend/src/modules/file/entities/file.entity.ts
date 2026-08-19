import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  BaseEntity,
  Index,
} from 'typeorm';

export enum FileableType {
  PRODUCT = 'PRODUCT',
  CATEGORY = 'CATEGORY',
  STORE_LOGO = 'STORE_LOGO',
  STORE_FAVICON = 'STORE_FAVICON',
  STORE_BANNER = 'STORE_BANNER',
  BLOG_POST = 'BLOG_POST',
  USER_AVATAR = 'USER_AVATAR',
  INVOICE = 'INVOICE',
  DOCUMENT = 'DOCUMENT',
  GENERAL = 'GENERAL',
}

export enum FileType {
  IMAGE = 'IMAGE',
  AVATAR = 'AVATAR',
  THUMBNAIL = 'THUMBNAIL',
  BANNER = 'BANNER',
  DOCUMENT = 'DOCUMENT',
  INVOICE = 'INVOICE',
  OTHER = 'OTHER',
}

@Entity('files')
@Index(['tenantId', 'fileableType', 'fileableId'])
export class FileEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  fileableId: string;

  @Column({
    type: 'enum',
    enum: FileableType,
    default: FileableType.GENERAL,
  })
  fileableType: FileableType;

  @Column({ type: 'varchar', length: 255 })
  fileName: string;

  @Column({
    type: 'enum',
    enum: FileType,
    default: FileType.IMAGE,
  })
  fileType: FileType;

  @Column({ type: 'text' })
  url: string;

  @Column({ type: 'text' })
  path: string;

  @Column({ type: 'varchar', length: 100 })
  mimeType: string;

  @Column({ type: 'bigint' })
  sizeInBytes: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Index()
  tenantId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date;
}
