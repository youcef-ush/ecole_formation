import pool from '../config/database';
import { 
    Transaction, 
    CreateTransactionDto, 
    TransactionFilters, 
    TransactionSummary 
} from '../types/transaction.types';

export class TransactionModel {
    // Créer une transaction
    static async create(data: CreateTransactionDto, userId?: number): Promise<Transaction> {
        // Pour éviter les problèmes de clé étrangère, on n'enregistre pas created_by pour le moment
        const query = `
            INSERT INTO transactions (
                type, source, amount, description, motif, 
                transaction_date, student_id, payment_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `;
        
        const values = [
            data.type,
            data.source,
            data.amount,
            data.description || null,
            data.motif || null,
            data.transactionDate || new Date(),
            data.studentId || null,
            data.paymentId || null
        ];

        const result = await pool.query(query, values);
        return this.mapRow(result.rows[0]);
    }

    // Lister les transactions avec filtres
    static async findAll(filters: TransactionFilters = {}): Promise<Transaction[]> {
        let query = `
            SELECT t.*, 
                   e.first_name, e.last_name,
                   u.username as created_by_name
            FROM transactions t
            LEFT JOIN students s ON t.student_id = s.id
            LEFT JOIN enrollments e ON s.enrollment_id = e.id
            LEFT JOIN users u ON t.created_by = u.id
            WHERE 1=1
        `;
        const values: any[] = [];
        let paramIndex = 1;

        if (filters.type) {
            query += ` AND t.type = $${paramIndex}`;
            values.push(filters.type);
            paramIndex++;
        }

        if (filters.source) {
            query += ` AND t.source = $${paramIndex}`;
            values.push(filters.source);
            paramIndex++;
        }

        if (filters.startDate) {
            query += ` AND t.transaction_date >= $${paramIndex}`;
            values.push(filters.startDate);
            paramIndex++;
        }

        if (filters.endDate) {
            query += ` AND t.transaction_date <= $${paramIndex}`;
            values.push(filters.endDate);
            paramIndex++;
        }

        if (filters.studentId) {
            query += ` AND t.student_id = $${paramIndex}`;
            values.push(filters.studentId);
            paramIndex++;
        }

        query += ` ORDER BY t.transaction_date DESC, t.id DESC`;

        const result = await pool.query(query, values);
        return result.rows.map(row => this.mapRow(row));
    }

    // Obtenir une transaction par ID
    static async findById(id: number): Promise<Transaction | null> {
        const query = `
            SELECT t.*, 
                   e.first_name, e.last_name,
                   u.username as created_by_name
            FROM transactions t
            LEFT JOIN students s ON t.student_id = s.id
            LEFT JOIN enrollments e ON s.enrollment_id = e.id
            LEFT JOIN users u ON t.created_by = u.id
            WHERE t.id = $1
        `;
        const result = await pool.query(query, [id]);
        return result.rows.length > 0 ? this.mapRow(result.rows[0]) : null;
    }

    // Obtenir le résumé des transactions
    static async getSummary(filters: TransactionFilters = {}): Promise<TransactionSummary> {
        let query = `
            SELECT 
                COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END), 0) as total_income,
                COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END), 0) as total_expense,
                COUNT(*) as count
            FROM transactions
            WHERE 1=1
        `;
        const values: any[] = [];
        let paramIndex = 1;

        if (filters.startDate) {
            query += ` AND transaction_date >= $${paramIndex}`;
            values.push(filters.startDate);
            paramIndex++;
        }

        if (filters.endDate) {
            query += ` AND transaction_date <= $${paramIndex}`;
            values.push(filters.endDate);
            paramIndex++;
        }

        const result = await pool.query(query, values);
        const row = result.rows[0];

        return {
            totalIncome: parseFloat(row.total_income) || 0,
            totalExpense: parseFloat(row.total_expense) || 0,
            balance: (parseFloat(row.total_income) || 0) - (parseFloat(row.total_expense) || 0),
            count: parseInt(row.count) || 0
        };
    }

    // Supprimer une transaction
    static async delete(id: number): Promise<boolean> {
        const query = 'DELETE FROM transactions WHERE id = $1 RETURNING id';
        const result = await pool.query(query, [id]);
        return result.rows.length > 0;
    }

    // Mapper les données de la base vers l'objet Transaction
    private static mapRow(row: any): Transaction {
        return {
            id: row.id,
            type: row.type,
            source: row.source,
            amount: parseFloat(row.amount),
            description: row.description,
            motif: row.motif,
            transactionDate: row.transaction_date,
            studentId: row.student_id,
            paymentId: row.payment_id,
            createdBy: row.created_by,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            // Additional fields from joins
            ...(row.first_name && { studentName: `${row.first_name} ${row.last_name}` }),
            ...(row.created_by_name && { createdByName: row.created_by_name })
        };
    }
}
