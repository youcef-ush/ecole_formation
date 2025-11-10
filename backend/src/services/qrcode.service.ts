import QRCode from 'qrcode';
import { AppDataSource } from '../config/database.config';
import { Student } from '../entities/Student.entity';
import { Session } from '../entities/Session.entity';
import { AppError } from '../middleware/error.middleware';

/**
 * Service de génération et validation de QR codes
 * 
 * Gère 2 types de QR codes :
 * - Badge étudiant : identifie un étudiant avec date d'expiration
 * - QR session : identifie une session pour scan de présence
 */
export class QrCodeService {
  private studentRepository = AppDataSource.getRepository(Student);
  private sessionRepository = AppDataSource.getRepository(Session);

  /**
   * Génère un badge QR code pour un étudiant
   * Format : STUDENT-{id}-{timestamp}
   * Validité : 1 an par défaut
   * 
   * @param studentId - ID de l'étudiant
   * @param validityMonths - Durée de validité en mois (défaut: 12)
   * @returns URL du QR code généré (Data URL base64)
   */
  async generateStudentBadge(
    studentId: number,
    validityMonths: number = 12
  ): Promise<string> {
    const student = await this.studentRepository.findOne({
      where: { id: studentId },
    });

    if (!student) {
      throw new AppError(`Étudiant avec ID ${studentId} introuvable`, 404);
    }

    // Créer un code unique pour l'étudiant
    const timestamp = Date.now();
    const qrData = `STUDENT-${studentId}-${timestamp}`;

    // Calculer la date d'expiration
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + validityMonths);

    // Générer le QR code en Data URL (base64)
    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'H', // Haute correction d'erreurs
      type: 'image/png',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    // Mettre à jour l'étudiant avec le nouveau badge
    student.badgeQrCode = qrData;
    student.badgeExpiry = expiryDate;
    student.isActive = true;
    await this.studentRepository.save(student);

    console.log(`✅ Badge QR généré pour l'étudiant ${student.firstName} ${student.lastName}`);
    console.log(`   Code: ${qrData}`);
    console.log(`   Expire le: ${expiryDate.toLocaleDateString('fr-FR')}`);

    return qrCodeDataUrl;
  }

  /**
   * Génère un QR code pour une session
   * Format : SESSION-{id}-{date}-{timestamp}
   * Validité : 24 heures (renouveler chaque jour)
   * 
   * @param sessionId - ID de la session
   * @param validityHours - Durée de validité en heures (défaut: 24)
   * @returns URL du QR code généré (Data URL base64)
   */
  async generateSessionQr(
    sessionId: number,
    validityHours: number = 24
  ): Promise<string> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['course'],
    });

    if (!session) {
      throw new AppError(`Session avec ID ${sessionId} introuvable`, 404);
    }

    // Créer un code unique pour la session
    const timestamp = Date.now();
    const dateStr = session.startDate.toISOString().split('T')[0]; // Format YYYY-MM-DD
    const qrData = `SESSION-${sessionId}-${dateStr}-${timestamp}`;

    // Calculer la date d'expiration
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + validityHours);

    // Générer le QR code en Data URL (base64)
    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'M', // Correction moyenne (suffisant pour sessions)
      type: 'image/png',
      width: 400,
      margin: 3,
      color: {
        dark: '#1976d2', // Bleu pour les sessions
        light: '#FFFFFF',
      },
    });

    // Mettre à jour la session avec le nouveau QR
    session.sessionQrCode = qrData;
    session.qrExpiresAt = expiresAt;
    session.isActive = true;
    await this.sessionRepository.save(session);

    console.log(`✅ QR code généré pour la session ${session.monthLabel || 'Session #' + sessionId}`);
    console.log(`   Code: ${qrData}`);
    console.log(`   Expire le: ${expiresAt.toLocaleString('fr-FR')}`);

    return qrCodeDataUrl;
  }

  /**
   * Valide un QR code étudiant scanné
   * Vérifie : existence, expiration, statut actif
   * 
   * @param qrCode - Code QR scanné (format: STUDENT-{id}-{timestamp})
   * @returns Objet Student si valide
   * @throws AppError si invalide ou expiré
   */
  async validateStudentQr(qrCode: string): Promise<Student> {
    // Vérifier le format du QR code
    if (!qrCode.startsWith('STUDENT-')) {
      throw new AppError('QR code étudiant invalide (format incorrect)', 400);
    }

    // Extraire l'ID étudiant
    const parts = qrCode.split('-');
    if (parts.length < 2) {
      throw new AppError('QR code étudiant malformé', 400);
    }

    const studentId = parseInt(parts[1]);
    if (isNaN(studentId)) {
      throw new AppError('ID étudiant invalide dans le QR code', 400);
    }

    // Récupérer l'étudiant
    const student = await this.studentRepository.findOne({
      where: { id: studentId },
      relations: ['enrollments', 'enrollments.course'],
    });

    if (!student) {
      throw new AppError(`Étudiant introuvable`, 404);
    }

    // Vérifier que le QR code correspond
    if (student.badgeQrCode !== qrCode) {
      throw new AppError('QR code invalide ou révoqué', 403);
    }

    // Vérifier si l'étudiant est actif
    if (!student.isActive) {
      throw new AppError('Badge étudiant désactivé. Contactez l\'administration.', 403);
    }

    // Vérifier l'expiration du badge
    if (student.badgeExpiry && new Date() > student.badgeExpiry) {
      throw new AppError(
        `Badge expiré le ${student.badgeExpiry.toLocaleDateString('fr-FR')}. Veuillez renouveler votre badge.`,
        403
      );
    }

    console.log(`✅ Badge validé pour ${student.firstName} ${student.lastName}`);
    return student;
  }

  /**
   * Valide un QR code de session scanné
   * Vérifie : existence, expiration, statut actif
   * 
   * @param qrCode - Code QR scanné (format: SESSION-{id}-{date}-{timestamp})
   * @returns Objet Session si valide
   * @throws AppError si invalide ou expiré
   */
  async validateSessionQr(qrCode: string): Promise<Session> {
    // Vérifier le format du QR code
    if (!qrCode.startsWith('SESSION-')) {
      throw new AppError('QR code session invalide (format incorrect)', 400);
    }

    // Extraire l'ID session
    const parts = qrCode.split('-');
    if (parts.length < 2) {
      throw new AppError('QR code session malformé', 400);
    }

    const sessionId = parseInt(parts[1]);
    if (isNaN(sessionId)) {
      throw new AppError('ID session invalide dans le QR code', 400);
    }

    // Récupérer la session
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['course', 'trainer', 'roomEntity'],
    });

    if (!session) {
      throw new AppError(`Session introuvable`, 404);
    }

    // Vérifier que le QR code correspond
    if (session.sessionQrCode !== qrCode) {
      throw new AppError('QR code session invalide ou expiré', 403);
    }

    // Vérifier si la session est active
    if (!session.isActive) {
      throw new AppError('Session désactivée ou annulée', 403);
    }

    // Vérifier l'expiration du QR code
    if (session.qrExpiresAt && new Date() > session.qrExpiresAt) {
      throw new AppError(
        `QR code expiré le ${session.qrExpiresAt.toLocaleString('fr-FR')}. Veuillez régénérer le QR code.`,
        403
      );
    }

    console.log(`✅ QR code validé pour la session ${session.monthLabel || 'Session #' + sessionId}`);
    return session;
  }

  /**
   * Révoquer le badge d'un étudiant
   * Utile en cas de perte, vol, ou désinscription
   * 
   * @param studentId - ID de l'étudiant
   */
  async revokeStudentBadge(studentId: number): Promise<void> {
    const student = await this.studentRepository.findOne({
      where: { id: studentId },
    });

    if (!student) {
      throw new AppError(`Étudiant avec ID ${studentId} introuvable`, 404);
    }

    student.badgeQrCode = null;
    student.badgeExpiry = null;
    student.isActive = false;
    await this.studentRepository.save(student);

    console.log(`🔒 Badge révoqué pour l'étudiant ${student.firstName} ${student.lastName}`);
  }

  /**
   * Renouveler le badge d'un étudiant
   * Génère un nouveau QR code et prolonge l'expiration
   * 
   * @param studentId - ID de l'étudiant
   * @param validityMonths - Durée de validité en mois (défaut: 12)
   * @returns URL du nouveau QR code
   */
  async renewStudentBadge(
    studentId: number,
    validityMonths: number = 12
  ): Promise<string> {
    console.log(`🔄 Renouvellement du badge pour l'étudiant ID ${studentId}...`);
    return await this.generateStudentBadge(studentId, validityMonths);
  }

  /**
   * Vérifier si un badge étudiant est valide (sans lever d'erreur)
   * Utile pour les vérifications préventives
   * 
   * @param qrCode - Code QR à vérifier
   * @returns true si valide, false sinon
   */
  async isStudentBadgeValid(qrCode: string): Promise<boolean> {
    try {
      await this.validateStudentQr(qrCode);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Vérifier si un QR code de session est valide (sans lever d'erreur)
   * Utile pour les vérifications préventives
   * 
   * @param qrCode - Code QR à vérifier
   * @returns true si valide, false sinon
   */
  async isSessionQrValid(qrCode: string): Promise<boolean> {
    try {
      await this.validateSessionQr(qrCode);
      return true;
    } catch (error) {
      return false;
    }
  }
}
