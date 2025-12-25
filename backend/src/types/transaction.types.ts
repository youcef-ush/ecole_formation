export enum TransactionType {
    INCOME = 'INCOME',
    EXPENSE = 'EXPENSE'
}

export enum TransactionSource {
    PAYMENT_INSTALLMENT = 'PAYMENT_INSTALLMENT',
    REGISTRATION_FEE = 'REGISTRATION_FEE',
    MANUAL_EXPENSE = 'MANUAL_EXPENSE',
    OTHER_INCOME = 'OTHER_INCOME'
}

export interface Transaction {
    id: number;
    type: TransactionType;
    source: TransactionSource;
    amount: number;
    description?: string;
    motif?: string;
    transactionDate: Date;
    studentId?: number;
    paymentId?: number;
    createdBy?: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateTransactionDto {
    type: TransactionType;
    source: TransactionSource;
    amount: number;
    description?: string;
    motif?: string;
    transactionDate?: Date;
    studentId?: number;
    paymentId?: number;
}

export interface TransactionFilters {
    type?: TransactionType;
    source?: TransactionSource;
    startDate?: string;
    endDate?: string;
    studentId?: number;
}

export interface TransactionSummary {
    totalIncome: number;
    totalExpense: number;
    balance: number;
    count: number;
}
