import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import { ExpenseEntity } from '../entities/expense.entity';
import { FileService } from '../../file/file.service';

export interface ExpenseReceiptStream {
  stream: fs.ReadStream;
  fileName: string;
  mimeType: string;
}

@Injectable()
export class GetExpenseReceiptService {
  constructor(
    @InjectRepository(ExpenseEntity)
    private readonly expenseRepository: Repository<ExpenseEntity>,
    private readonly fileService: FileService,
  ) {}

  /** Streams the receipt from disk rather than handing back the file module's public
   *  URL, matching the leave-document security design — see GetLeaveDocumentService. */
  async execute(storeId: string, expenseId: string): Promise<ExpenseReceiptStream> {
    const expense = await this.expenseRepository.findOne({ where: { id: expenseId, storeId } });
    if (!expense || !expense.receiptFileId) {
      throw new NotFoundException('No receipt attached to this expense.');
    }

    const file = await this.fileService.findOne(expense.receiptFileId);

    if (process.env.STORAGE_DRIVER?.toLowerCase() === 's3') {
      throw new BadRequestException(
        'Secure receipt retrieval is not yet implemented for S3 storage. Switch STORAGE_DRIVER to local, or implement signed-URL retrieval before relying on this in an S3 deployment.',
      );
    }

    if (!fs.existsSync(file.path)) {
      throw new NotFoundException('The stored file could not be found on disk.');
    }

    return {
      stream: fs.createReadStream(file.path),
      fileName: file.fileName,
      mimeType: file.mimeType,
    };
  }
}
