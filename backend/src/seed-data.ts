import { AppDataSource } from './config/database.config';
import { User, UserRole } from './entities/User.entity';
import { Student } from './entities/Student.entity';
import { Trainer } from './entities/Trainer.entity';
import { Course, CourseType, CourseCategory, CourseCertificate } from './entities/Course.entity';
import { Session, SessionStatus } from './entities/Session.entity';
import { Enrollment, EnrollmentStatus } from './entities/Enrollment.entity';
import { Payment, PaymentMethod } from './entities/Payment.entity';
import { Registration, RegistrationStatus } from './entities/Registration.entity';
import { Room, RoomType } from './entities/Room.entity';
import { TimeSlot, DayOfWeek } from './entities/TimeSlot.entity';
import bcrypt from 'bcrypt';

async function seedDatabase() {
  try {
    console.log('🌱 Démarrage du seeding de la base de données...');

    await AppDataSource.initialize();
    console.log('✅ Connexion à la base de données établie');

    // Repositories
    const userRepo = AppDataSource.getRepository(User);
    const studentRepo = AppDataSource.getRepository(Student);
    const trainerRepo = AppDataSource.getRepository(Trainer);
    const courseRepo = AppDataSource.getRepository(Course);
    const sessionRepo = AppDataSource.getRepository(Session);
    const enrollmentRepo = AppDataSource.getRepository(Enrollment);
    const paymentRepo = AppDataSource.getRepository(Payment);
    const registrationRepo = AppDataSource.getRepository(Registration);
    const roomRepo = AppDataSource.getRepository(Room);
    const timeSlotRepo = AppDataSource.getRepository(TimeSlot);

    // Nettoyer les tables (optionnel - commentez si vous voulez garder les données existantes)
    console.log('🧹 Nettoyage des tables...');
    await paymentRepo.createQueryBuilder().delete().execute();
    await enrollmentRepo.createQueryBuilder().delete().execute();
    await registrationRepo.createQueryBuilder().delete().execute();
    await sessionRepo.createQueryBuilder().delete().execute();
    await courseRepo.createQueryBuilder().delete().execute();
    await studentRepo.createQueryBuilder().delete().execute();
    await trainerRepo.createQueryBuilder().delete().execute();
    await timeSlotRepo.createQueryBuilder().delete().execute();
    await roomRepo.createQueryBuilder().delete().execute();
    // Supprimer tous les utilisateurs sauf l'admin principal
    await userRepo.createQueryBuilder().delete().where('email != :email', { email: 'admin@ecole.dz' }).execute();
    console.log('✅ Tables nettoyées');

    const hashedPassword = await bcrypt.hash('password123', 10);

    // ==================== SALLES ====================
    console.log('🏫 Création des salles...');
    const rooms = await roomRepo.save([
      {
        name: 'Salle A101',
        type: RoomType.THEORETICAL,
        capacity: 30,
        description: 'Salle de cours théoriques avec vidéoprojecteur',
        isActive: true,
      },
      {
        name: 'Salle A102',
        type: RoomType.THEORETICAL,
        capacity: 25,
        description: 'Salle de cours théoriques climatisée',
        isActive: true,
      },
      {
        name: 'Labo Info 1',
        type: RoomType.IT,
        capacity: 20,
        description: '20 postes informatiques avec Windows 11',
        isActive: true,
      },
      {
        name: 'Labo Info 2',
        type: RoomType.IT,
        capacity: 15,
        description: '15 postes informatiques avec Linux',
        isActive: true,
      },
      {
        name: 'Atelier Pratique 1',
        type: RoomType.PRACTICAL,
        capacity: 15,
        description: 'Atelier pour travaux pratiques',
        isActive: true,
      },
      {
        name: 'Atelier Mécanique',
        type: RoomType.WORKSHOP,
        capacity: 12,
        description: 'Atelier équipé pour mécanique',
        isActive: true,
      },
    ]);
    console.log(`✅ ${rooms.length} salles créées`);

    // ==================== CRÉNEAUX HORAIRES ====================
    console.log('⏰ Création des créneaux horaires...');
    const timeSlots = await timeSlotRepo.save([
      // Lundi
      { dayOfWeek: DayOfWeek.MONDAY, startTime: '08:00', endTime: '10:00', label: 'Matin', isActive: true },
      { dayOfWeek: DayOfWeek.MONDAY, startTime: '10:15', endTime: '12:15', label: 'Matin', isActive: true },
      { dayOfWeek: DayOfWeek.MONDAY, startTime: '14:00', endTime: '16:00', label: 'Après-midi', isActive: true },
      { dayOfWeek: DayOfWeek.MONDAY, startTime: '16:15', endTime: '18:15', label: 'Après-midi', isActive: true },
      
      // Mardi
      { dayOfWeek: DayOfWeek.TUESDAY, startTime: '08:00', endTime: '10:00', label: 'Matin', isActive: true },
      { dayOfWeek: DayOfWeek.TUESDAY, startTime: '10:15', endTime: '12:15', label: 'Matin', isActive: true },
      { dayOfWeek: DayOfWeek.TUESDAY, startTime: '14:00', endTime: '16:00', label: 'Après-midi', isActive: true },
      
      // Mercredi
      { dayOfWeek: DayOfWeek.WEDNESDAY, startTime: '08:00', endTime: '10:00', label: 'Matin', isActive: true },
      { dayOfWeek: DayOfWeek.WEDNESDAY, startTime: '10:15', endTime: '12:15', label: 'Matin', isActive: true },
      
      // Jeudi
      { dayOfWeek: DayOfWeek.THURSDAY, startTime: '08:00', endTime: '10:00', label: 'Matin', isActive: true },
      { dayOfWeek: DayOfWeek.THURSDAY, startTime: '14:00', endTime: '16:00', label: 'Après-midi', isActive: true },
      
      // Samedi
      { dayOfWeek: DayOfWeek.SATURDAY, startTime: '09:00', endTime: '12:00', label: 'Matin', isActive: true },
      { dayOfWeek: DayOfWeek.SATURDAY, startTime: '14:00', endTime: '17:00', label: 'Après-midi', isActive: true },
    ]);
    console.log(`✅ ${timeSlots.length} créneaux horaires créés`);

    // ==================== FORMATEURS ====================
    console.log('👨‍🏫 Création des formateurs...');
    
    // Créer d'abord les utilisateurs pour les formateurs
    const trainerUsersData = [
      { email: 'ahmed.benali@ecole.dz', firstName: 'Ahmed', lastName: 'Benali', phone: '0550123456', specialties: ['Développement Web', 'JavaScript', 'React'] },
      { email: 'fatima.khelifi@ecole.dz', firstName: 'Fatima', lastName: 'Khelifi', phone: '0661234567', specialties: ['Base de Données', 'SQL', 'PostgreSQL'] },
      { email: 'karim.mansouri@ecole.dz', firstName: 'Karim', lastName: 'Mansouri', phone: '0772345678', specialties: ['Réseaux Informatiques', 'Cisco', 'Sécurité'] },
      { email: 'samia.brahimi@ecole.dz', firstName: 'Samia', lastName: 'Brahimi', phone: '0550987654', specialties: ['Anglais Professionnel', 'Communication'] },
      { email: 'youcef.meziane@ecole.dz', firstName: 'Youcef', lastName: 'Meziane', phone: '0661876543', specialties: ['Mathématiques', 'Algèbre', 'Statistiques'] },
      { email: 'nadia.boudiaf@ecole.dz', firstName: 'Nadia', lastName: 'Boudiaf', phone: '0772765432', specialties: ['Gestion d\'Entreprise', 'Management', 'Finance'] },
    ];

    const trainers = [];
    for (const trainerData of trainerUsersData) {
      // Créer l'utilisateur
      const user = await userRepo.save({
        email: trainerData.email,
        password: hashedPassword,
        role: UserRole.ADMIN, // Les formateurs ont le rôle ADMIN
        isActive: true,
      });

      // Créer le formateur lié à l'utilisateur
      const trainer = await trainerRepo.save({
        firstName: trainerData.firstName,
        lastName: trainerData.lastName,
        phone: trainerData.phone,
        specialties: trainerData.specialties,
        bio: `Formateur expérimenté en ${trainerData.specialties[0]}`,
        userId: user.id,
      });

      trainers.push(trainer);
    }
    console.log(`✅ ${trainers.length} formateurs créés`);

    // ==================== FORMATIONS ====================
    console.log('📚 Création des formations...');
    const courses = await courseRepo.save([
      {
        title: 'Développement Web Full Stack',
        description: 'Formation complète en développement web : HTML, CSS, JavaScript, React, Node.js',
        type: CourseType.QUALIFYING,
        category: CourseCategory.IT,
        durationHours: 240,
        price: 45000,
        certificate: CourseCertificate.SCHOOL_CERTIFICATE,
        isActive: true,
        trainerId: trainers[0].id,
        roomId: rooms[2].id,
        timeSlotId: timeSlots[0].id,
      },
      {
        title: 'Administration Base de Données',
        description: 'Formation en administration de bases de données SQL et NoSQL',
        type: CourseType.QUALIFYING,
        category: CourseCategory.IT,
        durationHours: 180,
        price: 38000,
        certificate: CourseCertificate.SCHOOL_CERTIFICATE,
        isActive: true,
        trainerId: trainers[1].id,
        roomId: rooms[2].id,
        timeSlotId: timeSlots[4].id,
      },
      {
        title: 'Réseaux et Sécurité',
        description: 'Formation en réseaux informatiques et cybersécurité',
        type: CourseType.QUALIFYING,
        category: CourseCategory.IT,
        durationHours: 200,
        price: 42000,
        certificate: CourseCertificate.STATE_DIPLOMA,
        isActive: true,
        trainerId: trainers[2].id,
        roomId: rooms[0].id,
        timeSlotId: timeSlots[7].id,
      },
      {
        title: 'Anglais des Affaires',
        description: 'Cours d\'anglais professionnel pour le monde des affaires',
        type: CourseType.QUALIFYING,
        category: CourseCategory.LANGUAGES,
        durationHours: 120,
        price: 25000,
        certificate: CourseCertificate.SCHOOL_CERTIFICATE,
        isActive: true,
        trainerId: trainers[3].id,
        roomId: rooms[1].id,
        timeSlotId: timeSlots[1].id,
      },
      {
        title: 'Gestion de Projet',
        description: 'Méthodologies Agile, Scrum, gestion d\'équipe',
        type: CourseType.QUALIFYING,
        category: CourseCategory.PROFESSIONAL,
        durationHours: 80,
        price: 30000,
        certificate: CourseCertificate.SCHOOL_CERTIFICATE,
        isActive: true,
        trainerId: trainers[5].id,
        roomId: rooms[0].id,
        timeSlotId: timeSlots[6].id,
      },
      {
        title: 'Soutien Mathématiques Lycée',
        description: 'Soutien scolaire en mathématiques niveau lycée',
        type: CourseType.TUTORING_GROUP,
        category: CourseCategory.TUTORING,
        durationHours: 60,
        price: 15000,
        certificate: CourseCertificate.NONE,
        isActive: true,
        trainerId: trainers[4].id,
        roomId: rooms[1].id,
        timeSlotId: timeSlots[11].id,
      },
      {
        title: 'Soutien Informatique Bureautique',
        description: 'Soutien en Word, Excel, PowerPoint',
        type: CourseType.TUTORING_GROUP,
        category: CourseCategory.IT,
        durationHours: 40,
        price: 12000,
        certificate: CourseCertificate.NONE,
        isActive: true,
        trainerId: trainers[0].id,
        roomId: rooms[3].id,
        timeSlotId: timeSlots[12].id,
      },
    ]);
    console.log(`✅ ${courses.length} formations créées`);

    // ==================== SESSIONS ====================
    console.log('📅 Création des sessions...');
    const today = new Date();
    const in30Days = new Date(today);
    in30Days.setDate(in30Days.getDate() + 30);
    const in90Days = new Date(today);
    in90Days.setDate(in90Days.getDate() + 90);
    const in180Days = new Date(today);
    in180Days.setDate(in180Days.getDate() + 180);

    const sessions = await sessionRepo.save([
      {
        startDate: today,
        endDate: in90Days,
        startTime: '08:00',
        endTime: '12:00',
        capacity: 20,
        location: 'Labo Info 1',
        status: SessionStatus.IN_PROGRESS,
        courseId: courses[0].id,
        trainerId: trainers[0].id,
        roomId: rooms[2].id,
        timeSlotId: timeSlots[0].id,
      },
      {
        startDate: in30Days,
        endDate: in180Days,
        startTime: '14:00',
        endTime: '17:00',
        capacity: 15,
        location: 'Labo Info 1',
        status: SessionStatus.UPCOMING,
        courseId: courses[0].id,
        trainerId: trainers[0].id,
        roomId: rooms[2].id,
        timeSlotId: timeSlots[2].id,
      },
      {
        startDate: today,
        endDate: in90Days,
        startTime: '10:00',
        endTime: '13:00',
        capacity: 18,
        location: 'Labo Info 2',
        status: SessionStatus.IN_PROGRESS,
        courseId: courses[1].id,
        trainerId: trainers[1].id,
        roomId: rooms[3].id,
        timeSlotId: timeSlots[4].id,
      },
      {
        startDate: in30Days,
        endDate: in180Days,
        startTime: '08:00',
        endTime: '11:00',
        capacity: 25,
        location: 'Salle A101',
        status: SessionStatus.UPCOMING,
        courseId: courses[2].id,
        trainerId: trainers[2].id,
        roomId: rooms[0].id,
        timeSlotId: timeSlots[7].id,
      },
      {
        startDate: today,
        endDate: in90Days,
        startTime: '10:00',
        endTime: '12:00',
        capacity: 20,
        location: 'Salle A102',
        status: SessionStatus.IN_PROGRESS,
        courseId: courses[3].id,
        trainerId: trainers[3].id,
        roomId: rooms[1].id,
        timeSlotId: timeSlots[1].id,
      },
      {
        startDate: in30Days,
        endDate: in90Days,
        startTime: '14:00',
        endTime: '16:00',
        capacity: 22,
        location: 'Salle A101',
        status: SessionStatus.UPCOMING,
        courseId: courses[4].id,
        trainerId: trainers[5].id,
        roomId: rooms[0].id,
        timeSlotId: timeSlots[6].id,
      },
      {
        startDate: today,
        endDate: in30Days,
        startTime: '09:00',
        endTime: '12:00',
        capacity: 10,
        location: 'Salle A102',
        status: SessionStatus.IN_PROGRESS,
        courseId: courses[5].id,
        trainerId: trainers[4].id,
        roomId: rooms[1].id,
        timeSlotId: timeSlots[11].id,
      },
      {
        startDate: today,
        endDate: in30Days,
        startTime: '14:00',
        endTime: '17:00',
        capacity: 12,
        location: 'Labo Info 2',
        status: SessionStatus.IN_PROGRESS,
        courseId: courses[6].id,
        trainerId: trainers[0].id,
        roomId: rooms[3].id,
        timeSlotId: timeSlots[12].id,
      },
    ]);
    console.log(`✅ ${sessions.length} sessions créées`);

    // ==================== ÉTUDIANTS ====================
    console.log('👨‍🎓 Création des étudiants...');
    const students = [];
    const studentNames = [
      { firstName: 'Mohamed', lastName: 'Bouazza' },
      { firstName: 'Amina', lastName: 'Cherif' },
      { firstName: 'Raouf', lastName: 'Laid' },
      { firstName: 'Samira', lastName: 'Hamdi' },
      { firstName: 'Bilal', lastName: 'Taleb' },
      { firstName: 'Leila', lastName: 'Saadi' },
      { firstName: 'Hamza', lastName: 'Mokrani' },
      { firstName: 'Yasmine', lastName: 'Belkacem' },
      { firstName: 'Amine', lastName: 'Rezki' },
      { firstName: 'Meriem', lastName: 'Larbi' },
      { firstName: 'Sofiane', lastName: 'Djaballah' },
      { firstName: 'Hanane', lastName: 'Ouali' },
      { firstName: 'Nassim', lastName: 'Benyoucef' },
      { firstName: 'Sarah', lastName: 'Ziani' },
      { firstName: 'Mehdi', lastName: 'Boudj' },
    ];

    for (let i = 0; i < studentNames.length; i++) {
      const { firstName, lastName } = studentNames[i];
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@student.dz`;
      
      // Créer l'utilisateur
      const user = await userRepo.save({
        email: email,
        password: hashedPassword,
        role: UserRole.STUDENT,
      });

      // Créer l'étudiant
      const student = await studentRepo.save({
        firstName: firstName,
        lastName: lastName,
        dateOfBirth: new Date(2000 + Math.floor(Math.random() * 5), Math.floor(Math.random() * 12), 1 + Math.floor(Math.random() * 28)),
        phone: `055${Math.floor(1000000 + Math.random() * 9000000)}`,
        address: `${10 + i} Rue de l'Indépendance, Alger`,
        userId: user.id,
      });

      students.push(student);
    }
    console.log(`✅ ${students.length} étudiants créés`);

    // ==================== AFFECTATIONS (ENROLLMENTS) ====================
    console.log('🎓 Création des affectations...');
    const enrollments = [];
    
    // Session 1 (Dev Web) - 8 étudiants
    for (let i = 0; i < 8; i++) {
      const enrollment = await enrollmentRepo.save({
        studentId: students[i].id,
        sessionId: sessions[0].id,
        status: EnrollmentStatus.PAID,
      });
      enrollments.push(enrollment);
    }

    // Session 3 (BDD) - 6 étudiants
    for (let i = 0; i < 6; i++) {
      const enrollment = await enrollmentRepo.save({
        studentId: students[i + 2].id,
        sessionId: sessions[2].id,
        status: EnrollmentStatus.PAID,
      });
      enrollments.push(enrollment);
    }

    // Session 5 (Anglais) - 10 étudiants
    for (let i = 0; i < 10; i++) {
      const enrollment = await enrollmentRepo.save({
        studentId: students[i].id,
        sessionId: sessions[4].id,
        status: i < 7 ? EnrollmentStatus.PAID : EnrollmentStatus.PENDING,
      });
      enrollments.push(enrollment);
    }

    // Session 7 (Soutien Maths) - 5 étudiants
    for (let i = 0; i < 5; i++) {
      const enrollment = await enrollmentRepo.save({
        studentId: students[i + 10].id,
        sessionId: sessions[6].id,
        status: EnrollmentStatus.PAID,
      });
      enrollments.push(enrollment);
    }

    console.log(`✅ ${enrollments.length} affectations créées`);

    // ==================== PAIEMENTS ====================
    console.log('💰 Création des paiements...');
    const payments = [];
    
    for (const enrollment of enrollments) {
      if (enrollment.status === EnrollmentStatus.PAID) {
        const payment = await paymentRepo.save({
          amount: 5000 + Math.floor(Math.random() * 10000),
          paymentMethod: Math.random() > 0.5 ? PaymentMethod.CASH : PaymentMethod.BANK_TRANSFER,
          paymentDate: new Date(),
          enrollmentId: enrollment.id,
        });
        payments.push(payment);
      }
    }
    console.log(`✅ ${payments.length} paiements créés`);

    // ==================== INSCRIPTIONS EN ATTENTE ====================
    console.log('📝 Création des inscriptions en attente...');
    const registrations = [];
    const pendingNames = [
      { firstName: 'Kamel', lastName: 'Messaoudi' },
      { firstName: 'Zakia', lastName: 'Boumediene' },
      { firstName: 'Farid', lastName: 'Hammoudi' },
      { firstName: 'Naima', lastName: 'Laroussi' },
      { firstName: 'Tarek', lastName: 'Bensalah' },
    ];

    for (let i = 0; i < pendingNames.length; i++) {
      const { firstName, lastName } = pendingNames[i];
      const registration = await registrationRepo.save({
        firstName: firstName,
        lastName: lastName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@gmail.com`,
        phone: `077${Math.floor(1000000 + Math.random() * 9000000)}`,
        courseId: courses[i % courses.length].id,
        sessionId: sessions[i % sessions.length].id,
        status: i < 2 ? RegistrationStatus.PENDING_PAYMENT : RegistrationStatus.VALIDATED,
        notes: i === 0 ? 'Candidat très motivé' : undefined,
      });
      registrations.push(registration);
    }
    console.log(`✅ ${registrations.length} inscriptions créées`);

    console.log('\n🎉 Seeding terminé avec succès !');
    console.log('📊 Résumé :');
    console.log(`   - ${rooms.length} salles`);
    console.log(`   - ${timeSlots.length} créneaux horaires`);
    console.log(`   - ${trainers.length} formateurs`);
    console.log(`   - ${courses.length} formations`);
    console.log(`   - ${sessions.length} sessions`);
    console.log(`   - ${students.length} étudiants`);
    console.log(`   - ${enrollments.length} affectations`);
    console.log(`   - ${payments.length} paiements`);
    console.log(`   - ${registrations.length} inscriptions`);

    await AppDataSource.destroy();
    console.log('✅ Connexion fermée');

  } catch (error) {
    console.error('❌ Erreur lors du seeding :', error);
    process.exit(1);
  }
}

// Exécuter le seeding
seedDatabase();
