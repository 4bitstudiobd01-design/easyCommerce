import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExpenseEntity } from '../entities/expense.entity';
import { EmployeeEntity } from '../entities/employee.entity';
import { CreateExpenseDto } from '../dto/expense.dto';

@Injectable()
export class CreateExpenseService {
  constructor(
    @InjectRepository(ExpenseEntity)
    private readonly expenseRepository: Repository<ExpenseEntity>,
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepository: Repository<EmployeeEntity>,
  ) {}

  async execute(tenantId: string, storeId: string, createdByUserId: string, dto: CreateExpenseDto): Promise<ExpenseEntity> {
    const employee = await this.employeeRepository.findOne({ where: { id: dto.employeeId, storeId } });
    if (!employee) {
      throw new NotFoundException('Employee not found.');
    }

    return this.expenseRepository.save(
      this.expenseRepository.create({
        tenantId,
        storeId,
        employeeId: dto.employeeId,
        category: dto.category,
        amount: dto.amount,
        currency: dto.currency ?? 'BDT',
        expenseDate: dto.expenseDate,
        description: dto.description,
        createdByUserId,
      }),
    );
  }
}
