import { Request, Response } from 'express';
import { AppDataSource } from '../config/database.config';
import { StudentAssignment } from '../entities/StudentAssignment.entity';
import { PaymentPlan, PaymentPlanType } from '../entities/PaymentPlan.entity';
import { Installment, InstallmentStatus } from '../entities/Installment.entity';
import { Student } from '../entities/Student.entity';

export class StudentPaymentPlanController {
    private studentAssignmentRepo = AppDataSource.getRepository(StudentAssignment);
    private paymentPlanRepo = AppDataSource.getRepository(PaymentPlan);
    private installmentRepo = AppDataSource.getRepository(Installment);
    private studentRepo = AppDataSource.getRepository(Student);

    // Créer des échéances personnalisées pour une affectation
    createInstallments = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { installments, totalAmount } = req.body;

            console.log('🔄 Creating installments for assignment:', id);
            console.log('📦 Received data:', { installments: installments?.length, totalAmount });
            console.log('📋 Installments details:', JSON.stringify(installments, null, 2));

            if (!installments || !Array.isArray(installments)) {
                console.log('❌ Invalid installments data');
                return res.status(400).json({
                    success: false,
                    message: 'Le champ installments est requis et doit être un tableau'
                });
            }

            // Vérifier que l'affectation existe
            const assignment = await this.studentAssignmentRepo.findOne({
                where: { id: parseInt(id) },
                relations: ['installments']
            });

            if (!assignment) {
                console.log('❌ Assignment not found:', id);
                return res.status(404).json({
                    success: false,
                    message: 'Affectation non trouvée'
                });
            }

            console.log('✅ Found assignment:', assignment.id);

            // Supprimer les installments existants
            if (assignment.installments && assignment.installments.length > 0) {
                console.log('🗑️ Removing existing installments:', assignment.installments.length);
                await this.installmentRepo.remove(assignment.installments);
            }

            // Mettre à jour le montant total si fourni
            if (totalAmount) {
                console.log('💰 Updating total amount:', totalAmount);
                assignment.totalAmount = totalAmount;
                await this.studentAssignmentRepo.save(assignment);
            }

            // Créer les nouveaux installments
            console.log('📝 Creating new installments:', installments.length);
            const newInstallments = installments.map((inst: any, index: number) => {
                console.log('📅 Installment data:', { index, inst });
                const installmentData = {
                    studentAssignmentId: assignment.id,
                    installmentNumber: inst.installmentNumber || (index + 1),
                    dueDate: inst.dueDate,
                    amount: inst.amount,
                    status: InstallmentStatus.PENDING
                };
                console.log('📋 Final installment data:', installmentData);
                return installmentData;
            });

            console.log('💾 Saving installments...', newInstallments.length);
            const savedInstallments = await this.installmentRepo.save(newInstallments);
            console.log('✅ Successfully created installments:', savedInstallments.length);
            res.json({
                success: true,
                data: savedInstallments,
                message: `${savedInstallments.length} échéances créées avec succès`
            });
        } catch (error) {
            console.error('❌ Error creating installments:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la création des échéances'
            });
        }
    }
}
