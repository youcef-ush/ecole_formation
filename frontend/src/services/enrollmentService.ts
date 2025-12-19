import api from './api';

export interface Enrollment {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate?: string;
  address?: string;
  courseId: number;
  courseTitle?: string;
  registrationFee: number;
  isRegistrationFeePaid: boolean;
  registrationFeePaidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEnrollmentData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate?: string;
  address?: string;
  courseId: number;
  registrationFee?: number;
}

export interface MarkPaidResponse {
  enrollment: Enrollment;
  student: {
    id: number;
    enrollmentId: number;
    qrCode: string;
    badgeQrCode: string;
    courseId: number;
    status: string;
    isActive: boolean;
  };
}

export const enrollmentService = {
  // Créer une nouvelle inscription (formulaire)
  async createEnrollment(data: CreateEnrollmentData): Promise<Enrollment> {
    const response = await api.post('/enrollments', data);
    return response.data.data;
  },

  // Marquer comme payé (crée automatiquement le Student avec QR)
  async markEnrollmentPaid(enrollmentId: number): Promise<MarkPaidResponse> {
    const response = await api.post(`/enrollments/${enrollmentId}/mark-paid`);
    return response.data.data;
  },

  // Lister toutes les inscriptions
  async getAllEnrollments(): Promise<Enrollment[]> {
    const response = await api.get('/enrollments');
    return response.data.data;
  },

  // Obtenir une inscription par ID
  async getEnrollmentById(id: number): Promise<Enrollment> {
    const response = await api.get(`/enrollments/${id}`);
    return response.data.data;
  },

  // Mettre à jour une inscription
  async updateEnrollment(id: number, data: Partial<CreateEnrollmentData>): Promise<Enrollment> {
    const response = await api.put(`/enrollments/${id}`, data);
    return response.data.data;
  },

  // Supprimer une inscription
  async deleteEnrollment(id: number): Promise<void> {
    await api.delete(`/enrollments/${id}`);
  },
};
