import pool from '../config/database';

const createTableSQL = `
-- Create transactions table for financial management
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
    source VARCHAR(50) NOT NULL CHECK (source IN ('PAYMENT_INSTALLMENT', 'REGISTRATION_FEE', 'MANUAL_EXPENSE', 'OTHER_INCOME')),
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    motif VARCHAR(255),
    transaction_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    student_id INTEGER REFERENCES students(id) ON DELETE SET NULL,
    payment_id INTEGER REFERENCES payments(id) ON DELETE SET NULL,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_student ON transactions(student_id);
CREATE INDEX IF NOT EXISTS idx_transactions_source ON transactions(source);
`;

async function createTransactionsTable() {
  try {
    console.log('🔄 Creating transactions table...');
    await pool.query(createTableSQL);
    console.log('✅ Transactions table created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating transactions table:', error);
    process.exit(1);
  }
}

createTransactionsTable();
