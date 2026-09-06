export enum FinanceAccountTypeEnum {
  CASH = 'CASH',
  BANK = 'BANK',
  CARD = 'CARD',
  PAYMENT_GATEWAY = 'PAYMENT_GATEWAY',
  DIGITAL_WALLET = 'DIGITAL_WALLET',
}

export enum FinanceAccountClassEnum {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  EQUITY = 'EQUITY',
  REVENUE = 'REVENUE',
  EXPENSE = 'EXPENSE',
}

export enum FinanceNormalBalanceEnum {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
}

export enum FinanceLineTypeEnum {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
}

export enum FinanceJournalStatusEnum {
  DRAFT = 'DRAFT',
  POSTED = 'POSTED',
  VOID = 'VOID',
}

export enum FinanceJournalEntryTypeEnum {
  MANUAL = 'MANUAL',
  ORDER = 'ORDER',
  REFUND = 'REFUND',
  INVOICE = 'INVOICE',
  BILL = 'BILL',
  PAYROLL = 'PAYROLL',
  HR_EXPENSE = 'HR_EXPENSE',
  TRANSFER = 'TRANSFER',
  INVENTORY_ADJUSTMENT = 'INVENTORY_ADJUSTMENT',
  PERIOD_CLOSING = 'PERIOD_CLOSING',
}

export enum FinancePartyTypeEnum {
  CUSTOMER = 'CUSTOMER',
  SUPPLIER = 'SUPPLIER',
  EMPLOYEE = 'EMPLOYEE',
  COURIER = 'COURIER',
  NONE = 'NONE',
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
