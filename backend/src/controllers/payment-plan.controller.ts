import { Request, Response } from 'express';
import { AppDataSource } from '../config/database.config';
import { PaymentPlan } from '../entities/PaymentPlan.entity';
import { AppError } from '../middleware/error.middleware';

export class PaymentPlanController {
    private paymentPlanRepo = AppDataSource.getRepository(PaymentPlan);

    getAll = async (req: Request, res: Response) => {
        try {
            const paymentPlans = await this.paymentPlanRepo.find();
            res.json({
                success: true,
                data: paymentPlans
            });
        } catch (error) {
            console.error('Error in getAll payment plans:', error);
            throw new AppError('Erreur lors de la récupération des plans de paiement', 500);
        }
    }

    create = async (req: Request, res: Response) => {
        try {
            const { name, installmentsCount, intervalDays, description } = req.body;

            if (!name || !installmentsCount || !intervalDays) {
                throw new AppError('Nom, nombre d\'échéances et intervalle sont requis', 400);
            }

            const paymentPlan = this.paymentPlanRepo.create({
                name,
                installmentsCount,
                intervalDays,
                description
            });

            await this.paymentPlanRepo.save(paymentPlan);

            res.status(201).json({
                success: true,
                data: paymentPlan,
                message: 'Plan de paiement créé avec succès'
            });
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError('Erreur lors de la création du plan de paiement', 500);
        }
    }

    update = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { name, installmentsCount, intervalDays, description } = req.body;

            const paymentPlan = await this.paymentPlanRepo.findOne({ where: { id: parseInt(id) } });

            if (!paymentPlan) {
                throw new AppError('Plan de paiement non trouvé', 404);
            }

            paymentPlan.name = name || paymentPlan.name;
            paymentPlan.installmentsCount = installmentsCount || paymentPlan.installmentsCount;
            paymentPlan.intervalDays = intervalDays || paymentPlan.intervalDays;
            paymentPlan.description = description !== undefined ? description : paymentPlan.description;

            await this.paymentPlanRepo.save(paymentPlan);

            res.json({
                success: true,
                data: paymentPlan,
                message: 'Plan de paiement mis à jour avec succès'
            });
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError('Erreur lors de la mise à jour du plan de paiement', 500);
        }
    }

    delete = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            const paymentPlan = await this.paymentPlanRepo.findOne({ where: { id: parseInt(id) } });

            if (!paymentPlan) {
                throw new AppError('Plan de paiement non trouvé', 404);
            }

            await this.paymentPlanRepo.remove(paymentPlan);

            res.json({
                success: true,
                message: 'Plan de paiement supprimé avec succès'
            });
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError('Erreur lors de la suppression du plan de paiement', 500);
        }
    }
}