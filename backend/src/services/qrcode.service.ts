
import QRCode from 'qrcode';
import { AppDataSource } from '../config/database.config';
import { Student } from '../entities/Student.entity';

/**
 * Service de génération et validation de QR codes
 * 
 * Version Simplifiée pour "Scan & Pay":
 * - Gère uniquement le Badge étudiant
 */
export class QrCodeService {
  private studentRepository = AppDataSource.getRepository(Student);

  /**
   * Génère un badge QR code pour un étudiant
   * Format : STUDENT-{id}-{timestamp}
   * 
   * @param studentId - ID de l'étudiant
   * @returns URL du QR code généré (Data URL base64)
   */
  async generateStudentBadge(
    studentId: number
  ): Promise<string> {
    const student = await this.studentRepository.findOne({
      where: { id: studentId },
    });

    if (!student) {
      throw new Error(`Étudiant avec ID ${studentId} introuvable`);
    }

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

    // Mettre à jour l'étudiant avec le nouveau badge
    student.qrCode = qrData;
    await this.studentRepository.save(student);

    console.log(`✅ Badge QR généré pour l'étudiant ${student.firstName} ${student.lastName}`);
    console.log(`   Code: ${qrData}`);

    return qrCodeDataUrl;
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

    // Récupérer l'étudiant
    const student = await this.studentRepository.findOne({
      where: { id: studentId },
    });

    if (!student) {
      throw new Error(`Étudiant introuvable`);
    }

    // Vérifier que le QR code correspond
    if (student.qrCode !== qrCode) {
      throw new Error('QR code invalide ou révoqué');
    }

    console.log(`✅ Badge validé pour ${student.firstName} ${student.lastName}`);
    return student;
  }
}
