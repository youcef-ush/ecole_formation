import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Grid,
    InputAdornment,
} from '@mui/material';
import { Payment as PaymentIcon, Search } from '@mui/icons-material';
import api from '../services/api';

interface Course {
    id: number;
    title: string;
}

interface Installment {
    id: number;
    installmentNumber: number;
    dueDate: string;
    amount: string | number;
    paidDate?: string;
    status: 'PAID' | 'PENDING' | 'OVERDUE';
}

interface Assignment {
    id: number;
    course: Course;
    paymentPlan: any;
    installments: Installment[];
}

interface Student {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    enrollment?: any;
    course?: any;
    lastPaymentDate?: string;
    lastPaymentAmount?: number;
    totalPaid?: number;
    nextInstallment?: {
        id?: number;
        dueDate: string;
        amount: number;
    };
    assignments?: Assignment[];
}

export default function Payments() {
    const navigate = useNavigate();
    const [students, setStudents] = useState<Student[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [courseFilter, setCourseFilter] = useState<string>('all');
    const [dateFilter, setDateFilter] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [studentsRes, coursesRes] = await Promise.all([
                api.get('/students/payment-status'),
                api.get('/courses')
            ]);
            setStudents(studentsRes.data.data || []);
            setCourses(coursesRes.data.data || []);
        } catch (err: any) {
            console.error('Erreur lors du chargement des données:', err);
            setError('Erreur lors du chargement des données');
        }
    };

    const filteredStudents = useMemo(() => {
        return students.filter(student => {
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = 
                (student.firstName?.toLowerCase() || '').includes(searchLower) ||
                (student.lastName?.toLowerCase() || '').includes(searchLower) ||
                (student.phone && student.phone.includes(searchTerm));

            // Pour le statut dans Paiements, on peut filtrer par "En retard" ou "À jour"
            // Si nextInstallment est passé, c'est en retard
            const isLate = student.nextInstallment && new Date(student.nextInstallment.dueDate) < new Date();
            const matchesStatus = statusFilter === 'all' || 
                (statusFilter === 'late' && isLate) || 
                (statusFilter === 'up_to_date' && !isLate);

            // Pour la formation, on vérifie si l'étudiant a une affectation dans cette formation
            const matchesCourse = courseFilter === 'all' || 
                (student.course?.id?.toString() === courseFilter);

            const matchesDate = !dateFilter || 
                (student.lastPaymentDate && new Date(student.lastPaymentDate).toISOString().split('T')[0] === dateFilter);

            return matchesSearch && matchesStatus && matchesCourse && matchesDate;
        });
    }, [students, searchTerm, statusFilter, courseFilter, dateFilter]);

    const handleStudentSelect = (student: Student) => {
        navigate(`/payments/${student.id}`);
    };

    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <PaymentIcon /> Paiements
            </Typography>

            {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>{success}</Alert>}

            {/* Student Selection and Table */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>Liste des Étudiants</Typography>
                    
                    {/* Barre de recherche et Filtres */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={12} md={3}>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Rechercher un étudiant..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Search fontSize="small" color="action" />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                        <Grid item xs={6} md={2}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Statut Paiement</InputLabel>
                                <Select
                                    value={statusFilter}
                                    label="Statut Paiement"
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <MenuItem value="all">Tous</MenuItem>
                                    <MenuItem value="late">En retard</MenuItem>
                                    <MenuItem value="up_to_date">À jour</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6} md={4}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Formation</InputLabel>
                                <Select
                                    value={courseFilter}
                                    label="Formation"
                                    onChange={(e) => setCourseFilter(e.target.value)}
                                >
                                    <MenuItem value="all">Toutes les formations</MenuItem>
                                    {courses.map((course) => (
                                        <MenuItem key={course.id} value={course.id.toString()}>
                                            {course.title}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField
                                fullWidth
                                size="small"
                                type="date"
                                label="Dernier paiement"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                    </Grid>

                    {/* Tableau des étudiants */}
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell><strong>Nom</strong></TableCell>
                                <TableCell><strong>Dernier paiement</strong></TableCell>
                                <TableCell><strong>Prochaine échéance</strong></TableCell>
                                <TableCell><strong>Action</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredStudents.map((student) => {
                                // Récupérer tous les installments de tous les assignments
                                const allInstallments = student.assignments?.flatMap(a => a.installments || []) || [];
                                
                                // Dernier paiement (installment payé le plus récent)
                                const paidInstallments = allInstallments
                                    .filter(inst => inst.status === 'PAID' && inst.paidDate)
                                    .sort((a, b) => new Date(b.paidDate!).getTime() - new Date(a.paidDate!).getTime());
                                const lastPayment = paidInstallments[0];
                                
                                // Prochaine échéance (basé uniquement sur dueDate - la date la plus proche)
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                const futureInstallments = allInstallments
                                    .filter(inst => new Date(inst.dueDate) >= today)
                                    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
                                const nextInstallment = futureInstallments[0];
                                
                                return (
                                <TableRow 
                                    key={student.id}
                                    sx={{ 
                                        cursor: 'pointer',
                                        '&:hover': { backgroundColor: '#f5f5f5' }
                                    }}
                                    onClick={() => handleStudentSelect(student)}
                                >
                                    <TableCell>
                                        <Typography variant="body1" fontWeight="bold">
                                            {student.firstName} {student.lastName}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        {lastPayment ? (
                                            <Box>
                                                <Typography variant="body2">
                                                    {new Date(lastPayment.paidDate!).toLocaleDateString('fr-FR')}
                                                </Typography>
                                                <Typography variant="body2" color="success.main" fontWeight="bold">
                                                    {Number(lastPayment.amount).toLocaleString('fr-FR')} DA
                                                </Typography>
                                            </Box>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">
                                                Aucun
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {nextInstallment ? (
                                            <Typography variant="body2">
                                                {new Date(nextInstallment.dueDate).toLocaleDateString('fr-FR')}
                                            </Typography>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">
                                                Aucune
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleStudentSelect(student);
                                            }}
                                        >
                                            Détails
                                        </Button>
                                    </TableCell>
                                </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>

                    {filteredStudents.length === 0 && (
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 2 }}>
                            {searchTerm ? 'Aucun étudiant trouvé' : 'Aucun étudiant disponible'}
                        </Typography>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
}

