import { Router } from 'express';
import { TransactionController } from '../controllers/transactions.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Transactions
 *   description: Gestion des transactions financières (revenus et dépenses)
 */

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     summary: Liste toutes les transactions
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [INCOME, EXPENSE]
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Liste des transactions
 */
router.get('/', authenticate, TransactionController.getTransactions);

/**
 * @swagger
 * /api/transactions/summary:
 *   get:
 *     summary: Obtenir le résumé financier
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Résumé des revenus et dépenses
 */
router.get('/summary', authenticate, TransactionController.getSummary);

/**
 * @swagger
 * /api/transactions/{id}:
 *   get:
 *     summary: Obtenir une transaction par ID
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Détails de la transaction
 *       404:
 *         description: Transaction non trouvée
 */
router.get('/:id', authenticate, TransactionController.getTransactionById);

/**
 * @swagger
 * /api/transactions:
 *   post:
 *     summary: Créer une nouvelle transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - source
 *               - amount
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [INCOME, EXPENSE]
 *               source:
 *                 type: string
 *                 enum: [PAYMENT_INSTALLMENT, REGISTRATION_FEE, MANUAL_EXPENSE, OTHER_INCOME]
 *               amount:
 *                 type: number
 *               description:
 *                 type: string
 *               motif:
 *                 type: string
 *     responses:
 *       201:
 *         description: Transaction créée avec succès
 */
router.post('/', authenticate, TransactionController.createTransaction);

/**
 * @swagger
 * /api/transactions/{id}:
 *   delete:
 *     summary: Supprimer une transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Transaction supprimée
 *       404:
 *         description: Transaction non trouvée
 */
router.delete('/:id', authenticate, TransactionController.deleteTransaction);

export default router;
