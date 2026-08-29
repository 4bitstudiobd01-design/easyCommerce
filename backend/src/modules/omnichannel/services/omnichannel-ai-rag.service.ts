import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { OmnichannelAiDocumentEntity } from '../entities/omnichannel-ai-document.entity';
import { OmnichannelAiDocumentChunkEntity } from '../entities/omnichannel-ai-document-chunk.entity';
import { OmnichannelAiCryptoService } from './omnichannel-ai-crypto.service';

export interface SearchChunkResult {
  chunkId: string;
  documentId: string;
  documentName: string;
  content: string;
  score: number;
}

@Injectable()
export class OmnichannelAiRagService {
  private readonly logger = new Logger(OmnichannelAiRagService.name);

  constructor(
    @InjectRepository(OmnichannelAiDocumentEntity)
    private readonly docRepo: Repository<OmnichannelAiDocumentEntity>,
    @InjectRepository(OmnichannelAiDocumentChunkEntity)
    private readonly chunkRepo: Repository<OmnichannelAiDocumentChunkEntity>,
    private readonly cryptoService: OmnichannelAiCryptoService,
  ) {}

  /**
   * List all knowledge base documents for a specific store.
   */
  async listDocuments(tenantId: string, storeId?: string): Promise<OmnichannelAiDocumentEntity[]> {
    const where: any = { tenantId };
    if (storeId) where.storeId = storeId;
    return this.docRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Ingest, parse, chunk, and index an uploaded document (PDF, TXT, MD, etc.) for a store.
   */
  async uploadAndIndexDocument(
    tenantId: string,
    storeId: string,
    file: { originalname: string; mimetype: string; size: number; buffer: Buffer },
    apiKey?: string,
    provider: 'gemini' | 'openai' | string = 'gemini',
  ): Promise<OmnichannelAiDocumentEntity> {
    if (!file || !file.buffer) {
      throw new BadRequestException('No file provided for indexing.');
    }

    const ext = file.originalname.split('.').pop()?.toLowerCase() || 'txt';
    const isPdf = ext === 'pdf' || file.mimetype === 'application/pdf';

    this.logger.log(
      `Indexing document "${file.originalname}" (${file.size} bytes) for Tenant: ${tenantId}, Store: ${storeId}`,
    );

    // 1. Create Document record in PROCESSING state
    const doc = this.docRepo.create({
      tenantId,
      storeId,
      fileName: file.originalname,
      fileType: ext,
      fileSize: file.size,
      status: 'PROCESSING',
      chunkCount: 0,
    });
    const savedDoc = await this.docRepo.save(doc);

    try {
      // 2. Extract raw text from file
      let rawText = '';
      if (isPdf) {
        rawText = await this.extractTextFromPdf(file.buffer);
      } else {
        rawText = file.buffer.toString('utf8');
      }

      const cleanedText = this.cleanText(rawText);
      if (!cleanedText || cleanedText.length < 5) {
        throw new Error(
          'No readable text could be extracted from this file. If this is a scanned image PDF, please upload a PDF with selectable text, or a .txt / .doc file.',
        );
      }

      // 3. Chunk the text
      const chunks = this.createChunks(cleanedText, 600, 100);
      this.logger.log(`Created ${chunks.length} chunks for document: ${savedDoc.fileName}`);

      // 4. Generate embeddings (if API key available) with graceful circuit-breaker
      let canEmbed = Boolean(apiKey && apiKey.trim());
      const selectedProvider = provider === 'openai' ? 'openai' : 'gemini';
      const chunkEntities: OmnichannelAiDocumentChunkEntity[] = [];

      for (let i = 0; i < chunks.length; i++) {
        const chunkText = chunks[i];
        let embedding: number[] | undefined = undefined;

        if (canEmbed && apiKey && apiKey.trim()) {
          try {
            embedding = await this.generateEmbedding(chunkText, selectedProvider, apiKey.trim());
          } catch (e: any) {
            this.logger.warn(
              `Vector embedding failed on chunk ${i} (${e.message}). Falling back to BM25/TF-IDF text search for remaining chunks.`,
            );
            // Disable remote embedding calls for remaining chunks in this batch to prevent latency/timeout
            canEmbed = false;
          }
        }

        const chunkEntity = this.chunkRepo.create({
          tenantId,
          storeId,
          documentId: savedDoc.id,
          chunkIndex: i,
          content: chunkText,
          tokenCount: Math.ceil(chunkText.length / 4),
          embedding: embedding || (null as any),
          metadata: {
            fileName: savedDoc.fileName,
            chunkIndex: i,
            totalChunks: chunks.length,
          },
        });

        chunkEntities.push(chunkEntity);
      }

      // 5. Save all chunks in batch
      await this.chunkRepo.save(chunkEntities);

      // 6. Update Document status to INDEXED
      savedDoc.status = 'INDEXED';
      savedDoc.chunkCount = chunkEntities.length;
      savedDoc.errorMessage = null as any;
      await this.docRepo.save(savedDoc);

      this.logger.log(`Successfully indexed "${savedDoc.fileName}" with ${savedDoc.chunkCount} chunks.`);
      return savedDoc;
    } catch (err: any) {
      this.logger.error(`Document indexing failed for ${savedDoc.fileName}: ${err.message}`);
      savedDoc.status = 'FAILED';
      savedDoc.errorMessage = err.message || 'Indexing failed';
      await this.docRepo.save(savedDoc);
      throw new BadRequestException(`Failed to index document: ${err.message}`);
    }
  }

  /**
   * Delete a document and its associated chunks for a store.
   */
  async deleteDocument(tenantId: string, storeId: string, documentId: string): Promise<void> {
    const doc = await this.docRepo.findOne({
      where: { id: documentId, tenantId, storeId },
    });

    if (!doc) {
      throw new NotFoundException('Document not found in this store.');
    }

    await this.chunkRepo.delete({ documentId, tenantId, storeId });
    await this.docRepo.remove(doc);
    this.logger.log(`Deleted document ${documentId} and all chunks for store ${storeId}.`);
  }

  /**
   * Search relevant chunks from the store's knowledge base using semantic cosine similarity & keyword scoring.
   */
  async searchRelevantChunks(
    tenantId: string,
    storeId: string,
    query: string,
    limit = 3,
    apiKey?: string,
    provider: 'gemini' | 'openai' | string = 'gemini',
  ): Promise<SearchChunkResult[]> {
    if (!query || !query.trim()) return [];

    const chunks = await this.chunkRepo.find({
      where: { tenantId, storeId },
      relations: ['document'],
    });

    if (chunks.length === 0) return [];

    let queryEmbedding: number[] | null = null;
    if (apiKey && apiKey.trim()) {
      try {
        const selectedProvider = provider === 'openai' ? 'openai' : 'gemini';
        queryEmbedding = await this.generateEmbedding(query, selectedProvider, apiKey.trim());
      } catch (e: any) {
        this.logger.warn(`Query embedding failed, falling back to hybrid BM25 search: ${e.message}`);
      }
    }

    const scoredResults: SearchChunkResult[] = [];
    const queryTokens = query.toLowerCase().split(/\s+/).filter((t) => t.length > 1);

    for (const chunk of chunks) {
      let score = 0;

      // 1. Vector Cosine Similarity (if embeddings exist)
      if (
        queryEmbedding &&
        chunk.embedding &&
        Array.isArray(chunk.embedding) &&
        chunk.embedding.length === queryEmbedding.length
      ) {
        score = this.cosineSimilarity(queryEmbedding, chunk.embedding);
      } else {
        // 2. Hybrid Keyword & TF-IDF Score
        const contentLower = chunk.content.toLowerCase();
        let matches = 0;
        for (const token of queryTokens) {
          if (contentLower.includes(token)) {
            matches++;
          }
        }
        score = matches / (queryTokens.length || 1);
      }

      if (score > 0.1 || (!queryEmbedding && score > 0)) {
        scoredResults.push({
          chunkId: chunk.id,
          documentId: chunk.documentId,
          documentName: chunk.document?.fileName || (chunk.metadata?.fileName as string) || 'Document',
          content: chunk.content,
          score,
        });
      }
    }

    // Sort by score descending and return top K
    scoredResults.sort((a, b) => b.score - a.score);
    return scoredResults.slice(0, limit);
  }

  /**
   * Generate text embedding via Google Gemini or OpenAI.
   */
  private async generateEmbedding(text: string, provider: 'gemini' | 'openai', apiKey: string): Promise<number[]> {
    if (provider === 'openai') {
      const res = await axios.post(
        'https://api.openai.com/v1/embeddings',
        {
          model: 'text-embedding-3-small',
          input: text.substring(0, 2000),
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 6000,
        },
      );
      return res.data.data[0].embedding;
    } else {
      // Google Gemini Embeddings
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${apiKey}`;
      const res = await axios.post(
        endpoint,
        {
          model: 'models/gemini-embedding-001',
          content: {
            parts: [{ text: text.substring(0, 2000) }],
          },
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 6000,
        },
      );
      return res.data.embedding?.values || [];
    }
  }

  private cleanText(raw: string): string {
    return raw
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]+/g, ' ')
      .trim();
  }

  private createChunks(text: string, chunkSize = 600, overlap = 100): string[] {
    const chunks: string[] = [];
    if (!text || !text.trim()) return chunks;

    const clean = text.trim();
    if (clean.length <= chunkSize) {
      return [clean];
    }

    let start = 0;
    while (start < clean.length) {
      let end = Math.min(start + chunkSize, clean.length);

      if (end < clean.length) {
        const sub = clean.substring(start, end);
        const lastPeriod = sub.lastIndexOf('. ');
        const lastNewline = sub.lastIndexOf('\n');
        const breakPoint = Math.max(lastPeriod >= 0 ? lastPeriod + 1 : -1, lastNewline);
        if (breakPoint > chunkSize / 2) {
          end = start + breakPoint + 1;
        }
      }

      const chunk = clean.slice(start, end).trim();
      if (chunk.length > 0) {
        chunks.push(chunk);
      }

      if (end >= clean.length) {
        break;
      }

      const nextStart = Math.max(start + 1, end - overlap);
      if (nextStart <= start) {
        break;
      }
      start = nextStart;
    }

    return chunks;
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private async extractTextFromPdf(buffer: Buffer): Promise<string> {
    // 1. Primary extractor: pdf-parse
    try {
      const pdfModule = require('pdf-parse');
      let text = '';
      if (typeof pdfModule === 'function') {
        const data = await pdfModule(buffer);
        text = data.text || '';
      } else if (pdfModule.default && typeof pdfModule.default === 'function') {
        const data = await pdfModule.default(buffer);
        text = data.text || '';
      } else if (pdfModule.PDFParse) {
        const parser = new pdfModule.PDFParse({ data: new Uint8Array(buffer) });
        await parser.load();
        const res = await parser.getText();
        if (typeof res === 'string') text = res;
        else if (res && typeof res.text === 'string') text = res.text;
      }

      if (text && text.trim().length > 0) {
        return text;
      }
    } catch (err: any) {
      this.logger.warn(`pdf-parse primary extraction failed (${err.message}). Attempting fallback stream decoder...`);
    }

    // 2. Fallback stream decoder: parse literal strings and text blocks from uncompressed PDF streams
    try {
      const raw = buffer.toString('binary');
      const textMatches: string[] = [];

      // Extract text in parentheses (e.g. (Hello World) Tj)
      const tjRegex = /\(([^)]+)\)\s*Tj/g;
      let match;
      while ((match = tjRegex.exec(raw)) !== null) {
        if (match[1] && match[1].trim()) {
          textMatches.push(match[1]);
        }
      }

      // Extract text in brackets [(...)] TJ
      const arrayTjRegex = /\[([^\]]+)\]\s*TJ/g;
      while ((match = arrayTjRegex.exec(raw)) !== null) {
        const inner = match[1];
        const innerMatches = inner.match(/\(([^)]+)\)/g);
        if (innerMatches) {
          const combined = innerMatches.map((m) => m.slice(1, -1)).join('');
          if (combined.trim()) textMatches.push(combined);
        }
      }

      if (textMatches.length > 0) {
        return textMatches.join(' ');
      }
    } catch (e: any) {
      this.logger.warn(`PDF fallback stream decoder failed: ${e.message}`);
    }

    return '';
  }
}
