export enum FinanceAccountTypeEnum {
  CASH = 'CASH',
  BANK = 'BANK',
  PAYMENT_GATEWAY = 'PAYMENT_GATEWAY',
  DIGITAL_WALLET = 'DIGITAL_WALLET',
}

export enum FinanceTransactionTypeEnum {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  PAYMENT = 'PAYMENT',
  REFUND = 'REFUND',
  TRANSFER = 'TRANSFER',
  ADJUSTMENT = 'ADJUSTMENT',
}

export enum FinanceTransactionStatusEnum {
  COMPLETED = 'COMPLETED',
  PENDING = 'PENDING',
  CANCELLED = 'CANCELLED',
}

export enum FinanceCategoryTypeEnum {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export enum FinanceInvoiceStatusEnum {
  DRAFT = 'DRAFT',
  UNPAID = 'UNPAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  VOID = 'VOID',
}

export enum FinanceBillStatusEnum {
  DRAFT = 'DRAFT',
  UNPAID = 'UNPAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  VOID = 'VOID',
}

export enum FinanceTransferStatusEnum {
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum FinanceSourceTypeEnum {
  MANUAL = 'MANUAL',
  ORDER = 'ORDER',
  INVOICE = 'INVOICE',
  BILL = 'BILL',
  HR_EXPENSE = 'HR_EXPENSE',
  PAYROLL = 'PAYROLL',
  TRANSFER = 'TRANSFER',
  ADJUSTMENT = 'ADJUSTMENT',
}
