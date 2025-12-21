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
    Divider,
    Paper,
} from '@mui/material';
import { Payment as PaymentIcon, Print } from '@mui/icons-material';
import api from '../services/api';

interface Student {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    enrollment?: any;
    course?: any;
    lastPaymentDate?: string;
    totalPaid?: number;
    nextInstallment?: {
        id?: number;
        dueDate: string;
        amount: number;
    };
}

interface StudentAssignment {
    id: number;
    course: {
        title: string;
    };
    paymentPlan: {
        name: string;
        type: string;
        installmentsCount: number;
        intervalDays?: number;
        dayOfMonth?: number;
    };
    totalAmount: string | number;
    status: string;
    installments?: Installment[];  // Maintenant directement dans l'Assignment
}

interface Installment {
    id?: number; // Optionnel pour les propositions
    installmentNumber: number;
    dueDate: string;
    amount: number;
    status?: string; // Optionnel pour les propositions
    paidDate?: string; // Optionnel pour les propositions
}

export default function Payments() {
    const [students, setStudents] = useState<Student[]>([]);
    const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [assignments, setAssignments] = useState<StudentAssignment[]>([]);
    const [selectedAssignment, setSelectedAssignment] = useState<StudentAssignment | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Configuration dialog
    const [configDialogOpen, setConfigDialogOpen] = useState(false);

    // Payment dialog
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
    const [paymentAmount, setPaymentAmount] = useState<string>('');
    const [paymentMethod, setPaymentMethod] = useState<string>('CASH');

    // États pour les champs modifiables
    const [installmentDate, setInstallmentDate] = useState<string>('');
    const [installmentAmount, setInstallmentAmount] = useState<string>('');

    // Receipt dialog
    const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
    const [receiptData, setReceiptData] = useState<any>(null);

    useEffect(() => {
        loadStudents();
    }, []);

    const loadStudents = async () => {
        try {
            const response = await api.get('/students/payment-status');
            const studentsData = response.data.data || [];

            // Trier par date du dernier paiement (les plus récents en premier)
            const sortedStudents = studentsData.sort((a: Student, b: Student) => {
                if (!a.lastPaymentDate && !b.lastPaymentDate) return 0;
                if (!a.lastPaymentDate) return 1;
                if (!b.lastPaymentDate) return -1;
                return new Date(b.lastPaymentDate).getTime() - new Date(a.lastPaymentDate).getTime();
            });

            setStudents(sortedStudents);
            setFilteredStudents(sortedStudents);
        } catch (err) {
            setError('Erreur lors du chargement des étudiants');
            setStudents([]);
            setFilteredStudents([]);
        }
    };

    const loadAssignments = async (studentId: number) => {
        try {
            console.log('loadAssignments: loading assignments for student', studentId);
            const response = await api.get(`/students/${studentId}/assignments`);
            console.log('loadAssignments: received data:', response.data);
            setAssignments(response.data.data || response.data || []);
        } catch (err: any) {
            console.error('Erreur lors du chargement des affectations:', err);
            setError('Erreur lors du chargement des affectations');
            setAssignments([]);
        }
    };

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const term = event.target.value.toLowerCase();
        setSearchTerm(term);

        if (term === '') {
            setFilteredStudents(students);
        } else {
            const filtered = students.filter(student =>
                student.firstName.toLowerCase().includes(term) ||
                student.lastName.toLowerCase().includes(term)
            );
            setFilteredStudents(filtered);
        }
    };

    const handleStudentSelect = (student: Student) => {
        setSelectedStudent(student);
        setSelectedAssignment(null);
        setAssignments([]);
        loadAssignments(student.id);
    };

    const handleConfigurePayments = (assignment: StudentAssignment) => {
        setSelectedAssignment(assignment);
        // Initialiser avec des valeurs par défaut
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        setInstallmentDate(nextWeek.toISOString().split('T')[0]);
        setInstallmentAmount(String(assignment.totalAmount || 0));
        setConfigDialogOpen(true);
    };

    const handleValidateSimpleInstallment = async () => {
        if (!selectedAssignment || !installmentDate || !installmentAmount) {
            setError('Veuillez remplir tous les champs');
            return;
        }

        try {
            await api.post(`/student-payment-plans/${selectedAssignment.id}/installments`, {
                installments: [{
                    installmentNumber: 1,
                    dueDate: installmentDate,
                    amount: Number(installmentAmount)
                }],
                totalAmount: Number(installmentAmount)
            });

            setSuccess('Échéance configurée avec succès !');
            setConfigDialogOpen(false);
            setSelectedAssignment(null);
            setInstallmentDate('');
            setInstallmentAmount('');

            // Recharger les assignments pour voir l'échéance créée
            if (selectedStudent) {
                loadAssignments(selectedStudent.id);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erreur lors de la configuration');
        }
    };

    const handlePayment = async () => {
        if (!selectedInstallment || !paymentAmount) {
            setError('Veuillez sélectionner une échéance et entrer un montant');
            return;
        }

        try {
            await api.post('/payments', {
                installmentId: selectedInstallment.id,
                amount: Number(paymentAmount),
                method: paymentMethod,
            });

            setSuccess('Paiement enregistré avec succès!');
            setPaymentDialogOpen(false);
            setPaymentAmount('');
            setSelectedInstallment(null);

            // Recharger les assignments pour rafraîchir le statut
            if (selectedStudent) {
                loadAssignments(selectedStudent.id);
            }

            // Générer le reçu
            generateReceipt(selectedInstallment, Number(paymentAmount), paymentMethod);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erreur lors du paiement');
        }
    };

    const generateReceipt = (installment: Installment, amount: number, method: string) => {
        if (!selectedStudent || !selectedAssignment) {
            console.error('Cannot generate receipt: missing student or assignment data');
            return;
        }

        const now = new Date();
        const nextInstallment = getNextInstallment(selectedAssignment);

        const receiptData = {
            student: selectedStudent,
            assignment: selectedAssignment,
            installment: installment,
            amount: amount,
            method: method,
            date: now.toLocaleDateString('fr-FR'),
            time: now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            nextInstallment: nextInstallment
        };

        setReceiptData(receiptData);
        setReceiptDialogOpen(true);
    };

    const calculateTotalDebt = (assignment: StudentAssignment) => {
        if (!assignment.installments) return 0;
        return assignment.installments
            .filter(i => i.status === 'PENDING')
            .reduce((sum, i) => sum + Number(i.amount), 0);
    };

    const getNextInstallment = (assignment: StudentAssignment) => {
        if (!assignment.installments) {
            console.log('getNextInstallment: no installments array for assignment', assignment.id);
            return null;
        }
        const pending = assignment.installments
            .filter(i => i.status === 'PENDING')
            .sort((a, b) => {
                const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
                const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
                return dateA - dateB;
            });

        console.log('getNextInstallment: found', pending.length, 'pending installments for assignment', assignment.id);
        if (pending.length > 0) {
            console.log('getNextInstallment: next installment:', pending[0]);
        }

        return pending[0] || null;
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
                    
                    {/* Barre de recherche */}
                    <TextField
                        fullWidth
                        label="Rechercher un étudiant"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        sx={{ mb: 2 }}
                        placeholder="Tapez le nom ou prénom..."
                    />

                    {/* Tableau des étudiants */}
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell><strong>Nom</strong></TableCell>
                                <TableCell><strong>Dernier paiement</strong></TableCell>
                                <TableCell><strong>Total payé</strong></TableCell>
                                <TableCell><strong>Prochaine échéance</strong></TableCell>
                                <TableCell><strong>Action</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredStudents.map((student) => (
                                <TableRow 
                                    key={student.id}
                                    sx={{ 
                                        cursor: 'pointer',
                                        '&:hover': { backgroundColor: '#f5f5f5' },
                                        backgroundColor: selectedStudent?.id === student.id ? '#e3f2fd' : 'inherit'
                                    }}
                                >
                                    <TableCell>
                                        <Typography variant="body1" fontWeight="bold">
                                            {student.firstName} {student.lastName}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        {student.lastPaymentDate ? (
                                            <Typography variant="body2">
                                                {new Date(student.lastPaymentDate).toLocaleDateString('fr-FR')}
                                            </Typography>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">
                                                Jamais
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" color="success.main" fontWeight="bold">
                                            {student.totalPaid ? `${student.totalPaid.toLocaleString('fr-FR')} DA` : '0 DA'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        {student.nextInstallment ? (
                                            <Box>
                                                <Typography variant="body2">
                                                    {new Date(student.nextInstallment.dueDate).toLocaleDateString('fr-FR')}
                                                </Typography>
                                                <Typography variant="body2" color="error.main" fontWeight="bold">
                                                    {student.nextInstallment.amount} DA
                                                </Typography>
                                            </Box>
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
                                            onClick={() => handleStudentSelect(student)}
                                            color={selectedStudent?.id === student.id ? "primary" : "inherit"}
                                        >
                                            {selectedStudent?.id === student.id ? "Sélectionné" : "Sélectionner"}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    {filteredStudents.length === 0 && (
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 2 }}>
                            {searchTerm ? 'Aucun étudiant trouvé' : 'Aucun étudiant disponible'}
                        </Typography>
                    )}
                </CardContent>
            </Card>

            {/* Assignments & Installments */}
            {selectedStudent && (
                <Grid container spacing={3}>
                    {assignments.length === 0 ? (
                        <Grid item xs={12}>
                            <Alert severity="info">Aucune affectation trouvée pour cet étudiant.</Alert>
                        </Grid>
                    ) : (
                        assignments.map((assignment) => {
                            const totalDebt = calculateTotalDebt(assignment);
                            const nextInstallment = getNextInstallment(assignment);
                            const hasInstallments = assignment.installments && assignment.installments.length > 0;

                            return (
                                <Grid item xs={12} md={6} key={assignment.id}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="h6">{assignment.course?.title || 'Formation inconnue'}</Typography>
                                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                                Plan: {assignment.paymentPlan?.name || 'Plan inconnu'} ({assignment.paymentPlan?.type || 'Type inconnu'})
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                                Montant total: {Number(assignment.totalAmount) || 0} DA
                                            </Typography>

                                            {/* Debug info */}
                                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                                Debug: {assignment.installments?.length || 0} installments, hasInstallments: {hasInstallments ? 'true' : 'false'}
                                            </Typography>

                                            {nextInstallment && (
                                                <Typography variant="body2" color="primary" sx={{ fontWeight: 'bold' }}>
                                                    Prochaine échéance: {new Date(nextInstallment.dueDate).toLocaleDateString('fr-FR')} - {nextInstallment.amount} DA
                                                </Typography>
                                            )}

                                            {!hasInstallments ? (
                                                <Box sx={{ mt: 2 }}>
                                                    <Alert severity="warning" sx={{ mb: 2 }}>
                                                        Échéances non configurées
                                                    </Alert>
                                                    <Button
                                                        variant="outlined"
                                                        fullWidth
                                                        onClick={() => handleConfigurePayments(assignment)}
                                                    >
                                                        Configurer les Paiements
                                                    </Button>
                                                </Box>
                                            ) : (
                                                <>
                                                    <Typography variant="subtitle2" sx={{ mt: 2 }}>Échéances:</Typography>
                                                    <Table size="small">
                                                        <TableHead>
                                                            <TableRow>
                                                                <TableCell>N°</TableCell>
                                                                <TableCell>Date</TableCell>
                                                                <TableCell>Montant</TableCell>
                                                                <TableCell>Statut</TableCell>
                                                                <TableCell>Action</TableCell>
                                                            </TableRow>
                                                        </TableHead>
                                                        <TableBody>
                                                            {assignment.installments?.map((inst) => (
                                                                <TableRow key={inst.id || inst.installmentNumber}>
                                                                    <TableCell>{inst.installmentNumber}</TableCell>
                                                                    <TableCell>
                                                                        {inst.dueDate ? new Date(inst.dueDate).toLocaleDateString('fr-FR') : 'Date inconnue'}
                                                                    </TableCell>
                                                                    <TableCell>{inst.amount || 0} DA</TableCell>
                                                                    <TableCell>
                                                                        <Chip
                                                                            label={inst.status === 'PAID' ? 'Payé' : 'À payer'}
                                                                            color={inst.status === 'PAID' ? 'success' : 'warning'}
                                                                            size="small"
                                                                        />
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        {inst.status === 'PENDING' && (
                                                                            <Button
                                                                                size="small"
                                                                                variant="outlined"
                                                                                color="primary"
                                                                                startIcon={<PaymentIcon />}
                                                                                onClick={() => {
                                                                                    setSelectedInstallment(inst);
                                                                                    setPaymentAmount(inst.amount.toString());
                                                                                    setPaymentDialogOpen(true);
                                                                                }}
                                                                                sx={{ fontSize: '0.75rem' }}
                                                                            >
                                                                                Payer
                                                                            </Button>
                                                                        )}
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>

                                                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <Box>
                                                            <Typography variant="body2" color="text.secondary">
                                                                Reste à payer: {totalDebt} DA
                                                            </Typography>
                                                            {nextInstallment && (
                                                                <Typography variant="body2" color="primary">
                                                                    Prochaine: {new Date(nextInstallment.dueDate).toLocaleDateString('fr-FR')} - {nextInstallment.amount} DA
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                        <Button
                                                            variant="outlined"
                                                            size="small"
                                                            onClick={() => handleConfigurePayments(assignment)}
                                                        >
                                                            Modifier
                                                        </Button>
                                                    </Box>
                                                </>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Grid>
                            );
                        })
                    )}
                </Grid>
            )}

            {/* Configuration Dialog */}
            <Dialog open={configDialogOpen} onClose={() => setConfigDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold' }}>
                    ⚙️ Configuration d'Échéance
                </DialogTitle>
                <DialogContent>
                    {selectedAssignment && selectedStudent && (
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="body1" sx={{ mb: 2, textAlign: 'center', color: 'text.secondary' }}>
                                Définir la date et le montant de l'échéance pour {selectedStudent.firstName} {selectedStudent.lastName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                Formation: {selectedAssignment.course.title}
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                                <TextField
                                    label="Date d'échéance"
                                    type="date"
                                    value={installmentDate}
                                    onChange={(e) => setInstallmentDate(e.target.value)}
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                />
                                <TextField
                                    label="Montant (DA)"
                                    type="number"
                                    value={installmentAmount}
                                    onChange={(e) => setInstallmentAmount(e.target.value)}
                                    fullWidth
                                    helperText={`Montant total: ${selectedAssignment.totalAmount} DA`}
                                />
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
                    <Button
                        onClick={() => setConfigDialogOpen(false)}
                        variant="outlined"
                        color="inherit"
                    >
                        Annuler
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleValidateSimpleInstallment}
                        disabled={!installmentDate || !installmentAmount}
                        sx={{ fontWeight: 'bold' }}
                    >
                        ✅ Créer l'Échéance
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Payment Dialog */}
            <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold' }}>
                    💰 Paiement d'Échéance
                </DialogTitle>
                <DialogContent>
                    {selectedInstallment && (
                        <Box sx={{ mb: 3, p: 2, backgroundColor: '#f8f9fa', borderRadius: 1 }}>
                            <Typography variant="h6" color="primary" sx={{ mb: 2, textAlign: 'center' }}>
                                Prochaine Échéance à Régler
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Échéance N°:
                                </Typography>
                                <Typography variant="body2" fontWeight="bold">
                                    {selectedInstallment.installmentNumber}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Date d'échéance:
                                </Typography>
                                <Typography variant="body2" fontWeight="bold">
                                    {new Date(selectedInstallment.dueDate).toLocaleDateString('fr-FR')}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Montant dû:
                                </Typography>
                                <Typography variant="body2" fontWeight="bold" color="error">
                                    {selectedInstallment.amount} DA
                                </Typography>
                            </Box>
                        </Box>
                    )}
                    <Typography variant="body1" sx={{ mb: 2, textAlign: 'center', color: 'text.secondary' }}>
                        Confirmer le paiement de cette échéance
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="Montant à payer (DA)"
                            type="number"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            fullWidth
                            helperText={`Montant suggéré: ${selectedInstallment?.amount || 0} DA`}
                        />
                        <FormControl fullWidth>
                            <InputLabel>Méthode de paiement</InputLabel>
                            <Select
                                value={paymentMethod}
                                label="Méthode de paiement"
                                onChange={(e) => setPaymentMethod(e.target.value)}
                            >
                                <MenuItem value="CASH">💵 Espèces</MenuItem>
                                <MenuItem value="BANK_TRANSFER">🏦 Virement bancaire</MenuItem>
                                <MenuItem value="CHECK">📝 Chèque</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
                    <Button
                        onClick={() => setPaymentDialogOpen(false)}
                        variant="outlined"
                        color="inherit"
                    >
                        Annuler
                    </Button>
                    <Button
                        variant="contained"
                        color="success"
                        onClick={handlePayment}
                        disabled={!paymentAmount || Number(paymentAmount) <= 0}
                        sx={{ fontWeight: 'bold' }}
                    >
                        ✅ Confirmer le Paiement
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Receipt Dialog */}
            <Dialog open={receiptDialogOpen} onClose={() => setReceiptDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ textAlign: 'center' }}>Reçu de Paiement</DialogTitle>
                <DialogContent>
                    {receiptData && (
                        <Paper sx={{ p: 3, backgroundColor: '#f5f5f5' }}>
                            <Typography variant="h6" align="center" sx={{ mb: 2 }}>
                                ÉCOLE DE FORMATION
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            
                            <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Étudiant:</strong> {receiptData.student.enrollment.firstName} {receiptData.student.enrollment.lastName}
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Formation:</strong> {receiptData.assignment.course.title}
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Échéance payée:</strong> N°{receiptData.installment.installmentNumber}
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Montant payé:</strong> {receiptData.amount} DA
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Méthode:</strong> {receiptData.method === 'CASH' ? 'Espèces' : receiptData.method === 'BANK_TRANSFER' ? 'Virement' : 'Chèque'}
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                                <strong>Date:</strong> {receiptData.date} à {receiptData.time}
                            </Typography>
                            {receiptData.nextInstallment && (
                                <Typography variant="body2" sx={{ mb: 2, color: 'primary.main', fontWeight: 'bold' }}>
                                    <strong>Prochaine échéance:</strong> {new Date(receiptData.nextInstallment.dueDate).toLocaleDateString('fr-FR')} - {receiptData.nextInstallment.amount} DA
                                </Typography>
                            )}
                            
                            <Divider sx={{ mb: 2 }} />
                            <Typography variant="body2" align="center">
                                Merci pour votre paiement
                            </Typography>
                        </Paper>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setReceiptDialogOpen(false)}>Fermer</Button>
                    <Button 
                        variant="contained" 
                        startIcon={<Print />} 
                        onClick={() => {
                            // Créer une fenêtre d'impression avec seulement le reçu
                            const printWindow = window.open('', '_blank');
                            if (printWindow && receiptData) {
                                // Préparer les données pour l'impression
                                const studentName = `${receiptData.student.enrollment.firstName} ${receiptData.student.enrollment.lastName}`;
                                const courseTitle = receiptData.assignment.course.title;
                                const installmentNumber = receiptData.installment.installmentNumber;
                                const amount = receiptData.amount;
                                const method = receiptData.method === 'CASH' ? 'Espèces' : receiptData.method === 'BANK_TRANSFER' ? 'Virement' : 'Chèque';
                                const date = receiptData.date;
                                const time = receiptData.time;
                                const nextInstallmentText = receiptData.nextInstallment 
                                    ? `<p><strong>Prochaine échéance:</strong> ${new Date(receiptData.nextInstallment.dueDate).toLocaleDateString('fr-FR')} - ${receiptData.nextInstallment.amount} DA</p>`
                                    : '';

                                printWindow.document.write(`
                                    <html>
                                        <head>
                                            <title>Reçu de Paiement</title>
                                            <style>
                                                body { font-family: Arial, sans-serif; margin: 20px; }
                                                .receipt { max-width: 400px; margin: 0 auto; padding: 20px; border: 1px solid #ccc; }
                                                .header { text-align: center; margin-bottom: 20px; }
                                                .divider { border-top: 1px solid #ccc; margin: 10px 0; }
                                                .center { text-align: center; }
                                                @media print {
                                                    body { margin: 0; }
                                                    .receipt { border: none; }
                                                }
                                            </style>
                                        </head>
                                        <body>
                                            <div class="receipt">
                                                <div class="header">
                                                    <h2>ÉCOLE DE FORMATION</h2>
                                                    <h3>Reçu de Paiement</h3>
                                                </div>
                                                <div class="divider"></div>
                                                <p><strong>Étudiant:</strong> ${studentName}</p>
                                                <p><strong>Formation:</strong> ${courseTitle}</p>
                                                <p><strong>Échéance payée:</strong> N°${installmentNumber}</p>
                                                <p><strong>Montant payé:</strong> ${amount} DA</p>
                                                <p><strong>Méthode:</strong> ${method}</p>
                                                <p><strong>Date:</strong> ${date} à ${time}</p>
                                                ${nextInstallmentText}
                                                <div class="divider"></div>
                                                <p class="center">Merci pour votre paiement</p>
                                            </div>
                                            <script>
                                                window.onload = function() {
                                                    window.print();
                                                    setTimeout(function() {
                                                        window.close();
                                                    }, 1000);
                                                }
                                            </script>
                                        </body>
                                    </html>
                                `);
                                printWindow.document.close();
                            }
                        }}
                    >
                        Imprimer
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
