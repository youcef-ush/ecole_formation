import QRCode from 'qrcode';
import { AppDataSource } from '../config/database.config';
import { Student } from '../entities/Student.entity';
import { Enrollment } from '../entities/Enrollment.entity';

/**
 * Service de génération et validation de QR codes
 * 
 * Version Simplifiée pour "Scan & Pay":
 * - Gère uniquement le Badge étudiant
 */
export class QrCodeService {
  private studentRepository = AppDataSource.getRepository(Student);
  private enrollmentRepository = AppDataSource.getRepository(Enrollment);

  /**
   * Génère un badge QR code pour un étudiant
   * Format : STUDENT-{id}-{timestamp}
   * 
   * @param studentId - ID de l'étudiant
   * @returns Objet avec qrCode et badgeQrCode
   */
  async generateStudentBadge(
    studentId: number
  ): Promise<{ qrCode: string; badgeQrCode: string }> {
    // Créer un code unique pour l'étudiant
    const timestamp = Date.now();
    const qrData = `STUDENT-${studentId}-${timestamp}`;

    // Générer le QR code en Data URL (base64)
    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    console.log(`✅ Badge QR généré pour l'étudiant #${studentId}`);
    console.log(`   Code: ${qrData}`);

    return {
      qrCode: qrData,
      badgeQrCode: qrCodeDataUrl
    };
  }

  /**
   * Valide un QR code étudiant scanné
   * 
   * @param qrCode - Code QR scanné (format: STUDENT-{id}-{timestamp})
   * @returns Objet Student si valide
   */
  async validateStudentQr(qrCode: string): Promise<Student> {
    // Vérifier le format du QR code
    if (!qrCode.startsWith('STUDENT-')) {
      throw new Error('QR code étudiant invalide (format incorrect)');
    }

    // Extraire l'ID étudiant
    const parts = qrCode.split('-');
    if (parts.length < 2) {
      throw new Error('QR code étudiant malformé');
    }

    const studentId = parseInt(parts[1]);
    if (isNaN(studentId)) {
      throw new Error('ID étudiant invalide dans le QR code');
    }

    // Récupérer l'étudiant avec enrollment
    const student = await this.studentRepository.findOne({
      where: { id: studentId },
      relations: ['enrollment']
    });

    if (!student) {
      throw new Error(`Étudiant introuvable`);
    }

    // Vérifier que le QR code correspond
    if (student.qrCode !== qrCode) {
      throw new Error('QR code invalide ou révoqué');
    }

    const studentName = student.enrollment 
      ? `${student.enrollment.firstName} ${student.enrollment.lastName}`
      : `Student #${studentId}`;

    console.log(`✅ Badge validé pour ${studentName}`);
    return student;
  }
}
