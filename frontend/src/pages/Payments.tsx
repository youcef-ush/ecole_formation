import { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
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
    Chip,
    TextField,
    Autocomplete,
    Grid,
} from '@mui/material';
import { Payment as PaymentIcon, Add } from '@mui/icons-material';
import api from '../services/api';

interface Student {
    id: number;
    firstName: string;
    lastName: string;
}

interface Enrollment {
    id: number;
    studentId: number;
    courseId: number;
    startDate: string;
    status: string;
    student?: Student;
    course?: { title: string };
    installments?: Installment[];
}

interface Installment {
    id: number;
    dueDate: string;
    amount: number;
    isPaid: boolean;
}

export default function Payments() {
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Payment dialog
    const [openDialog, setOpenDialog] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState<string>('');
    const [paymentMethod, setPaymentMethod] = useState<string>('CASH');

    useEffect(() => {
        loadStudents();
    }, []);

    const loadStudents = async () => {
        try {
            const response = await api.get('/students');
            setStudents(response.data.data || []);
        } catch (err) {
            setError('Erreur lors du chargement des étudiants');
        }
    };

    const loadEnrollments = async (studentId: number) => {
        try {
            const response = await api.get(`/enrollments/student/${studentId}`);
            setEnrollments(response.data || []);
        } catch (err) {
            setEnrollments([]);
        }
    };

    const handleStudentChange = (student: Student | null) => {
        setSelectedStudent(student);
        setSelectedEnrollment(null);
        if (student) {
            loadEnrollments(student.id);
        } else {
            setEnrollments([]);
        }
    };

    const handlePayment = async () => {
        if (!selectedEnrollment || !paymentAmount) {
            setError('Veuillez sélectionner une inscription et entrer un montant');
            return;
        }

        try {
            await api.post('/payments', {
                enrollmentId: selectedEnrollment.id,
                amount: Number(paymentAmount),
                method: paymentMethod,
            });

            setSuccess('Paiement enregistré avec succès!');
            setOpenDialog(false);
            setPaymentAmount('');

            // Reload enrollments to refresh installment status
            if (selectedStudent) {
                loadEnrollments(selectedStudent.id);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erreur lors du paiement');
        }
    };

    const calculateTotalDebt = (enrollment: Enrollment) => {
        if (!enrollment.installments) return 0;
        return enrollment.installments
            .filter(i => !i.isPaid)
            .reduce((sum, i) => sum + Number(i.amount), 0);
    };

    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <PaymentIcon /> Paiements
            </Typography>

            {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>{success}</Alert>}

            {/* Student Selection */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Autocomplete
                        options={students}
                        getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
                        value={selectedStudent}
                        onChange={(_, value) => handleStudentChange(value)}
                        renderInput={(params) => <TextField {...params} label="Rechercher un étudiant" />}
                    />
                </CardContent>
            </Card>

            {/* Enrollments & Installments */}
            {selectedStudent && (
                <Grid container spacing={3}>
                    {enrollments.length === 0 ? (
                        <Grid item xs={12}>
                            <Alert severity="info">Aucune inscription trouvée pour cet étudiant.</Alert>
                        </Grid>
                    ) : (
                        enrollments.map((enrollment) => (
                            <Grid item xs={12} md={6} key={enrollment.id}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6">{enrollment.course?.title}</Typography>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            Début: {enrollment.startDate}
                                        </Typography>

                                        <Typography variant="subtitle2" sx={{ mt: 2 }}>Échéances:</Typography>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Date</TableCell>
                                                    <TableCell>Montant</TableCell>
                                                    <TableCell>Statut</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {enrollment.installments?.map((inst, idx) => (
                                                    <TableRow key={idx}>
                                                        <TableCell>{inst.dueDate}</TableCell>
                                                        <TableCell>{inst.amount} DA</TableCell>
                                                        <TableCell>
                                                            <Chip
                                                                label={inst.isPaid ? 'Payé' : 'À payer'}
                                                                color={inst.isPaid ? 'success' : 'warning'}
                                                                size="small"
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>

                                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Typography variant="body1" fontWeight="bold">
                                                Reste à payer: {calculateTotalDebt(enrollment)} DA
                                            </Typography>
                                            <Button
                                                variant="contained"
                                                size="small"
                                                startIcon={<Add />}
                                                onClick={() => {
                                                    setSelectedEnrollment(enrollment);
                                                    setOpenDialog(true);
                                                }}
                                                disabled={calculateTotalDebt(enrollment) === 0}
                                            >
                                                Payer
                                            </Button>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))
                    )}
                </Grid>
            )}

            {/* Payment Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Enregistrer un Paiement</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <TextField
                            label="Montant (DA)"
                            type="number"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            fullWidth
                        />
                        <FormControl fullWidth>
                            <InputLabel>Méthode</InputLabel>
                            <Select
                                value={paymentMethod}
                                label="Méthode"
                                onChange={(e) => setPaymentMethod(e.target.value)}
                            >
                                <MenuItem value="CASH">Espèces</MenuItem>
                                <MenuItem value="BANK_TRANSFER">Virement</MenuItem>
                                <MenuItem value="CHECK">Chèque</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Annuler</Button>
                    <Button variant="contained" onClick={handlePayment}>Confirmer</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
