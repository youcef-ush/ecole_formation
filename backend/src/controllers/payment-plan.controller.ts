import { Request, Response } from 'express';
import { AppDataSource } from '../config/database.config';
import { PaymentPlan, PaymentPlanType } from '../entities/PaymentPlan.entity';

export class PaymentPlanController {
    private paymentPlanRepo = AppDataSource.getRepository(PaymentPlan);

    // Liste tous les templates de plans
    getAll = async (req: Request, res: Response) => {
        try {
            const plans = await this.paymentPlanRepo.find({
                order: { createdAt: 'DESC' }
            });

            res.json({
                success: true,
                data: plans
            });
        } catch (error) {
            console.error('Error fetching payment plans:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des plans de paiement'
            });
        }
    }

    // Créer un nouveau template de plan
    create = async (req: Request, res: Response) => {
        try {
            const { name, type, installmentsCount, intervalDays, dayOfMonth, description } = req.body;

            if (!name) {
                return res.status(400).json({
                    success: false,
                    message: 'Le nom est requis'
                });
            }

            // Créer le template avec valeurs par défaut
            const paymentPlan = this.paymentPlanRepo.create({
                name,
                type: type || PaymentPlanType.UNIQUE,
                installmentsCount: installmentsCount || 1,
                intervalDays: intervalDays || null,
                dayOfMonth: dayOfMonth || 5,
                description: description || null
            });

            await this.paymentPlanRepo.save(paymentPlan);

            res.status(201).json({
                success: true,
                data: paymentPlan,
                message: 'Plan de paiement créé avec succès'
            });
        } catch (error) {
            console.error('Error creating payment plan:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la création du plan de paiement'
            });
        }
    }

    // Mettre à jour un template
    update = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { name, type, installmentsCount, intervalDays, dayOfMonth, description } = req.body;

            const plan = await this.paymentPlanRepo.findOne({ where: { id: parseInt(id) } });

            if (!plan) {
                return res.status(404).json({
                    success: false,
                    message: 'Plan de paiement non trouvé'
                });
            }

            // Mise à jour
            if (name !== undefined) plan.name = name;
            if (type !== undefined) plan.type = type;
            if (installmentsCount !== undefined) plan.installmentsCount = installmentsCount;
            if (intervalDays !== undefined) plan.intervalDays = intervalDays;
            if (dayOfMonth !== undefined) plan.dayOfMonth = dayOfMonth;
            if (description !== undefined) plan.description = description;

            await this.paymentPlanRepo.save(plan);

            res.json({
                success: true,
                data: plan,
                message: 'Plan de paiement mis à jour avec succès'
            });
        } catch (error) {
            console.error('Error updating payment plan:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la mise à jour du plan de paiement'
            });
        }
    }

    // Supprimer un template
    delete = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            const plan = await this.paymentPlanRepo.findOne({ where: { id: parseInt(id) } });

            if (!plan) {
                return res.status(404).json({
                    success: false,
                    message: 'Plan de paiement non trouvé'
                });
            }

            await this.paymentPlanRepo.remove(plan);

            res.json({
                success: true,
                message: 'Plan de paiement supprimé avec succès'
            });
        } catch (error) {
            console.error('Error deleting payment plan:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la suppression du plan de paiement'
            });
        }
    }
}
