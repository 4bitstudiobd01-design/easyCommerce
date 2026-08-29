import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { OmnichannelAiDocumentEntity } from './omnichannel-ai-document.entity';

@Entity('omnichannel_ai_document_chunks')
@Index(['tenantId', 'storeId'])
@Index(['tenantId', 'storeId', 'documentId'])
export class OmnichannelAiDocumentChunkEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId: string;

  @Column({ type: 'uuid' })
  @Index()
  storeId: string;

  @Column({ type: 'uuid' })
  @Index()
  documentId: string;

  @ManyToOne(() => OmnichannelAiDocumentEntity, (doc) => doc.chunks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'documentId' })
  document: OmnichannelAiDocumentEntity;

  @Column({ type: 'int' })
  chunkIndex: number;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'int', default: 0 })
  tokenCount: number;

  @Column({ type: 'jsonb', nullable: true })
  embedding?: number[];

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;
}
