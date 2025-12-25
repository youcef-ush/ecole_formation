import { Request, Response, NextFunction } from 'express';
import { TransactionModel } from '../models/transaction.model';
import { CreateTransactionDto, TransactionFilters } from '../types/transaction.types';

export class TransactionController {
    // Créer une nouvelle transaction (dépense manuelle)
    static async createTransaction(req: Request, res: Response, next: NextFunction) {
        try {
            const data: CreateTransactionDto = req.body;
            const userId = (req as any).user?.id;

            // Ne passer userId que s'il existe réellement
            const transaction = await TransactionModel.create(data, userId || undefined);

            res.status(201).json({
                success: true,
                message: 'Transaction créée avec succès',
                data: transaction
            });
        } catch (error) {
            next(error);
        }
    }

    // Lister toutes les transactions avec filtres
    static async getTransactions(req: Request, res: Response, next: NextFunction) {
        try {
            const filters: TransactionFilters = {
                type: req.query.type as any,
                source: req.query.source as any,
                startDate: req.query.startDate as string,
                endDate: req.query.endDate as string,
                studentId: req.query.studentId ? parseInt(req.query.studentId as string) : undefined
            };

            const transactions = await TransactionModel.findAll(filters);

            res.json({
                success: true,
                data: transactions
            });
        } catch (error) {
            next(error);
        }
    }

    // Obtenir une transaction par ID
    static async getTransactionById(req: Request, res: Response, next: NextFunction) {
        try {
            const id = parseInt(req.params.id);
            const transaction = await TransactionModel.findById(id);

            if (!transaction) {
                return res.status(404).json({
                    success: false,
                    message: 'Transaction non trouvée'
                });
            }

            res.json({
                success: true,
                data: transaction
            });
        } catch (error) {
            next(error);
        }
    }

    // Obtenir le résumé financier
    static async getSummary(req: Request, res: Response, next: NextFunction) {
        try {
            const filters: TransactionFilters = {
                startDate: req.query.startDate as string,
                endDate: req.query.endDate as string
            };

            const summary = await TransactionModel.getSummary(filters);

            res.json({
                success: true,
                data: summary
            });
        } catch (error) {
            next(error);
        }
    }

    // Supprimer une transaction
    static async deleteTransaction(req: Request, res: Response, next: NextFunction) {
        try {
            const id = parseInt(req.params.id);
            const deleted = await TransactionModel.delete(id);

            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    message: 'Transaction non trouvée'
                });
            }

            res.json({
                success: true,
                message: 'Transaction supprimée avec succès'
            });
        } catch (error) {
            next(error);
        }
    }
}
