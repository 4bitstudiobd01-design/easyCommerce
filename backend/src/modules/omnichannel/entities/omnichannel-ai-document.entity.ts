import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { OmnichannelAiDocumentChunkEntity } from './omnichannel-ai-document-chunk.entity';

export type AiDocumentStatus = 'PROCESSING' | 'INDEXED' | 'FAILED';

@Entity('omnichannel_ai_documents')
@Index(['tenantId', 'storeId'])
export class OmnichannelAiDocumentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId: string;

  @Column({ type: 'uuid' })
  @Index()
  storeId: string;

  @Column({ type: 'varchar', length: 255 })
  fileName: string;

  @Column({ type: 'varchar', length: 50, default: 'pdf' })
  fileType: string;

  @Column({ type: 'int', default: 0 })
  fileSize: number;

  @Column({ type: 'text', nullable: true })
  fileUrl?: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'PROCESSING',
  })
  status: AiDocumentStatus;

  @Column({ type: 'int', default: 0 })
  chunkCount: number;

  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @OneToMany(() => OmnichannelAiDocumentChunkEntity, (chunk) => chunk.document, {
    cascade: true,
  })
  chunks: OmnichannelAiDocumentChunkEntity[];

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
