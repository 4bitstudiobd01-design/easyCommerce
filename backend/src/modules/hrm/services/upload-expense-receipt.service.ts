import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExpenseEntity } from '../entities/expense.entity';
import { FileService } from '../../file/file.service';
import { FileableType, FileType } from '../../file/entities/file.entity';

@Injectable()
export class UploadExpenseReceiptService {
  constructor(
    @InjectRepository(ExpenseEntity)
    private readonly expenseRepository: Repository<ExpenseEntity>,
    private readonly fileService: FileService,
  ) {}

  async execute(tenantId: string, storeId: string, expenseId: string, file: Express.Multer.File): Promise<ExpenseEntity> {
    if (!file) {
      throw new BadRequestException('No file provided.');
    }

    const expense = await this.expenseRepository.findOne({ where: { id: expenseId, storeId } });
    if (!expense) {
      throw new NotFoundException('Expense not found.');
    }

    const uploaded = await this.fileService.uploadSingle(
      file,
      expense.id,
      FileableType.INVOICE,
      FileType.INVOICE,
      tenantId,
    );

    expense.receiptFileId = uploaded.id;
    return this.expenseRepository.save(expense);
  }
}
