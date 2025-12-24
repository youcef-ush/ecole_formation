import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
    TableContainer,
    Chip,
    TextField,
    Grid,
    Divider,
    Paper,
    IconButton,
    CircularProgress,
} from '@mui/material';
import { 
    ArrowBack, 
    Print, 
    History, 
    AccountBalanceWallet,
    EventNote,
} from '@mui/icons-material';
import api from '../services/api';

interface Student {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    lastPaymentDate?: string;
    totalPaid?: number;
}

interface Installment {
    id: number;
    installmentNumber: number;
    dueDate: string;
    amount: number;
    status: string;
    paidDate?: string;
}

interface StudentAssignment {
    id: number;
    course: {
        id: number;
        title: string;
    };
    paymentPlan: {
        name: string;
        type: string;
    };
    totalAmount: number;
    status: string;
    installments: Installment[];
}

export default function PaymentDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    
    const [student, setStudent] = useState<Student | null>(null);
    const [assignments, setAssignments] = useState<StudentAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Form states for inline operations
    const [activeAssignmentId, setActiveAssignmentId] = useState<number | null>(null);
    const [operationMode, setOperationMode] = useState<'NONE' | 'PAY' | 'CONFIG'>('NONE');
    const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
    
    // Payment form
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('CASH');
    
    // Config form (ajouter échéance)
    const [configDate, setConfigDate] = useState('');
    const [configAmount, setConfigAmount] = useState('');
    const [nextDueDate, setNextDueDate] = useState('');

    // Calculer la date suggérée pour la prochaine échéance
    const getSuggestedNextDate = (assignment: StudentAssignment): string => {
        const installments = assignment.installments;
        if (installments.length === 0) {
            // Première échéance : aujourd'hui
            return new Date().toISOString().split('T')[0];
        }
        
        // Dernière échéance
        const lastInstallment = installments[installments.length - 1];
        const lastDate = new Date(lastInstallment.dueDate);
        
        // Calculer selon le type de plan
        const planType = assignment.paymentPlan.type;
        let nextDate = new Date(lastDate);
        
        switch(planType) {
            case 'MENSUEL':
                nextDate.setMonth(nextDate.getMonth() + 1);
                break;
            case 'TRIMESTRIEL':
                nextDate.setMonth(nextDate.getMonth() + 3);
                break;
            case 'ANNUEL':
                nextDate.setFullYear(nextDate.getFullYear() + 1);
                break;
            default:
                // Par défaut : 1 mois
                nextDate.setMonth(nextDate.getMonth() + 1);
        }
        
        return nextDate.toISOString().split('T')[0];
    };

    // Calculer le montant suggéré pour la prochaine échéance
    const getSuggestedAmount = (assignment: StudentAssignment): string => {
        const remainingDebt = calculateTotalDebt(assignment);
        if (remainingDebt > 0) {
            return remainingDebt.toString();
        }
        // Si aucune dette, suggérer le montant de la dernière échéance
        const lastInstallment = assignment.installments[assignment.installments.length - 1];
        return lastInstallment?.amount.toString() || '0';
    };

    const loadData = useCallback(async () => {
        if (!id) return;
        try {
            setLoading(true);
            const [studentRes, assignmentsRes] = await Promise.all([
                api.get(`/students/${id}`),
                api.get(`/students/${id}/assignments`)
            ]);
            
            // The student data might be nested in enrollment
            const sData = studentRes.data.data || studentRes.data;
            setStudent({
                id: sData.id,
                firstName: sData.enrollment?.firstName || sData.firstName,
                lastName: sData.enrollment?.lastName || sData.lastName,
                email: sData.enrollment?.email || sData.email,
                phone: sData.enrollment?.phone || sData.phone,
            });
            
            setAssignments(assignmentsRes.data.data || assignmentsRes.data || []);
        } catch (err: any) {
            setError("Erreur lors du chargement des données");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handlePayment = async () => {
        if (!selectedInstallment || !paymentAmount) return;
        try {
            await api.post('/payments', {
                installmentId: selectedInstallment.id,
                amount: Number(paymentAmount),
                method: paymentMethod,
            });
            setSuccess('Paiement enregistré avec succès');
            setOperationMode('NONE');
            loadData();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erreur lors du paiement');
        }
    };

    const handleConfig = async (assignmentId: number) => {
        if (!configDate || !configAmount) {
            setError('Veuillez remplir la date et le montant');
            return;
        }
        try {
            const nextInstallmentNumber = assignments
                .find(a => a.id === assignmentId)
                ?.installments.length || 0;
            
            await api.post(`/student-payment-plans/${assignmentId}/installments`, {
                installments: [{
                    installmentNumber: nextInstallmentNumber + 1,
                    dueDate: configDate,
                    amount: Number(configAmount)
                }],
                totalAmount: Number(configAmount)
            });
            setSuccess('Échéance ajoutée avec succès');
            setOperationMode('NONE');
            setConfigDate('');
            setConfigAmount('');
            setNextDueDate('');
            loadData();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erreur lors de l\'ajout de l\'échéance');
        }
    };

    const calculateTotalDebt = (assignment: StudentAssignment) => {
        return assignment.installments
            .filter(i => i.status === 'PENDING')
            .reduce((sum, i) => sum + Number(i.amount), 0);
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;

    return (
        <Box>
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconButton onClick={() => navigate('/payments')}>
                    <ArrowBack />
                </IconButton>
                <Typography variant="h4" fontWeight={600}>Détails des Paiements</Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

            {student && (
                <Paper sx={{ p: 3, mb: 4, borderRadius: 2, bgcolor: '#f8f9fa' }}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={4}>
                            <Typography variant="overline" color="text.secondary">Étudiant</Typography>
                            <Typography variant="h5" fontWeight={700}>{student.firstName} {student.lastName}</Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography variant="overline" color="text.secondary">Contact</Typography>
                            <Typography variant="body1">{student.phone}</Typography>
                            <Typography variant="body2" color="text.secondary">{student.email}</Typography>
                        </Grid>
                        <Grid item xs={12} md={4} sx={{ textAlign: { md: 'right' } }}>
                            <Button 
                                variant="outlined" 
                                startIcon={<History />}
                                onClick={() => navigate(`/students/${student.id}`)}
                            >
                                Voir Profil Complet
                            </Button>
                        </Grid>
                    </Grid>
                </Paper>
            )}

            <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>Formations & Échéanciers</Typography>

            <Grid container spacing={3}>
                {assignments.map((assignment) => (
                    <Grid item xs={12} key={assignment.id}>
                        <Card sx={{ borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                    <Box>
                                        <Typography variant="h6" color="primary" fontWeight={700}>
                                            {assignment.course.title}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Plan: {assignment.paymentPlan.name} ({assignment.paymentPlan.type})
                                        </Typography>
                                    </Box>
                                    <Box sx={{ textAlign: 'right' }}>
                                        <Typography variant="h6" fontWeight={700}>{assignment.totalAmount} DA</Typography>
                                        <Typography variant="caption" color="text.secondary">Montant Total</Typography>
                                    </Box>
                                </Box>

                                <Divider sx={{ my: 2 }} />

                                <Grid container spacing={4}>
                                    {/* Liste des échéances */}
                                    <Grid item xs={12} md={8}>
                                        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <EventNote fontSize="small" /> Échéances
                                        </Typography>
                                        
                                        {assignment.installments.length === 0 ? (
                                            <Alert severity="info" action={
                                                <Button color="inherit" size="small" onClick={() => {
                                                    setActiveAssignmentId(assignment.id);
                                                    setOperationMode('CONFIG');
                                                    setConfigDate(getSuggestedNextDate(assignment));
                                                    setConfigAmount(getSuggestedAmount(assignment));
                                                }}>
                                                    Ajouter une échéance
                                                </Button>
                                            }>
                                                Aucune échéance configurée pour cette formation.
                                            </Alert>
                                        ) : (
                                            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                                                <Table size="small">
                                                    <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                                                        <TableRow>
                                                            <TableCell>N°</TableCell>
                                                            <TableCell>Date</TableCell>
                                                            <TableCell>Montant</TableCell>
                                                            <TableCell>Statut</TableCell>
                                                            <TableCell align="right">Action</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {assignment.installments.map((inst) => (
                                                            <TableRow key={inst.id}>
                                                                <TableCell>{inst.installmentNumber}</TableCell>
                                                                <TableCell>{new Date(inst.dueDate).toLocaleDateString('fr-FR')}</TableCell>
                                                                <TableCell sx={{ fontWeight: 600 }}>{inst.amount} DA</TableCell>
                                                                <TableCell>
                                                                    <Chip 
                                                                        label={inst.status === 'PAID' ? 'Payé' : 'En attente'} 
                                                                        color={inst.status === 'PAID' ? 'success' : 'warning'}
                                                                        size="small"
                                                                        variant="outlined"
                                                                    />
                                                                </TableCell>
                                                                <TableCell align="right">
                                                                    {inst.status === 'PENDING' && (
                                                                        <Button 
                                                                            size="small" 
                                                                            variant="contained" 
                                                                            onClick={() => {
                                                                                setActiveAssignmentId(assignment.id);
                                                                                setSelectedInstallment(inst);
                                                                                setPaymentAmount(inst.amount.toString());
                                                                                setOperationMode('PAY');
                                                                            }}
                                                                        >
                                                                            Payer
                                                                        </Button>
                                                                    )}
                                                                    {inst.status === 'PAID' && (
                                                                        <IconButton size="small" color="primary">
                                                                            <Print fontSize="small" />
                                                                        </IconButton>
                                                                    )}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        )}
                                    </Grid>

                                    {/* Zone d'opération (Paiement ou Config) */}
                                    <Grid item xs={12} md={4}>
                                        <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2, bgcolor: '#fff', height: '100%' }}>
                                            {operationMode === 'PAY' && activeAssignmentId === assignment.id ? (
                                                <Box>
                                                    <Typography variant="subtitle1" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <AccountBalanceWallet color="primary" /> Enregistrer un paiement
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                        Échéance N°{selectedInstallment?.installmentNumber} du {selectedInstallment && new Date(selectedInstallment.dueDate).toLocaleDateString('fr-FR')}
                                                    </Typography>
                                                    
                                                    <TextField
                                                        fullWidth
                                                        label="Montant à payer"
                                                        type="number"
                                                        size="small"
                                                        value={paymentAmount}
                                                        onChange={(e) => setPaymentAmount(e.target.value)}
                                                        sx={{ mb: 2 }}
                                                    />
                                                    
                                                    <FormControl fullWidth size="small" sx={{ mb: 3 }}>
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
                                                    
                                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                                        <Button fullWidth variant="contained" onClick={handlePayment}>Valider</Button>
                                                        <Button variant="outlined" onClick={() => setOperationMode('NONE')}>Annuler</Button>
                                                    </Box>
                                                </Box>
                                            ) : operationMode === 'CONFIG' && activeAssignmentId === assignment.id ? (
                                                <Box>
                                                    <Typography variant="subtitle1" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <EventNote color="primary" /> Ajouter une échéance
                                                    </Typography>
                                                    
                                                    <Typography variant="caption" color="primary" sx={{ mb: 2, display: 'block' }}>
                                                        Plan: {assignment.paymentPlan.name} ({assignment.paymentPlan.type})
                                                    </Typography>
                                                    
                                                    <TextField
                                                        fullWidth
                                                        label="Date de prochaine paiement"
                                                        type="date"
                                                        size="small"
                                                        value={configDate}
                                                        onChange={(e) => setConfigDate(e.target.value)}
                                                        InputLabelProps={{ shrink: true }}
                                                        sx={{ mb: 2 }}
                                                        helperText="Proposée automatiquement, vous pouvez la modifier"
                                                    />
                                                    
                                                    <TextField
                                                        fullWidth
                                                        label="Montant du paiement (DA)"
                                                        type="number"
                                                        size="small"
                                                        value={configAmount}
                                                        onChange={(e) => setConfigAmount(e.target.value)}
                                                        sx={{ mb: 2 }}
                                                        helperText="Montant restant suggéré, modifiable"
                                                    />
                                                    
                                                    <Box sx={{ p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1, mb: 2 }}>
                                                        <Typography variant="caption" color="text.secondary" display="block">
                                                            Reste à payer: {calculateTotalDebt(assignment)} DA
                                                        </Typography>
                                                    </Box>
                                                    
                                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                                        <Button fullWidth variant="contained" onClick={() => handleConfig(assignment.id)}>Valider</Button>
                                                        <Button variant="outlined" onClick={() => setOperationMode('NONE')}>Annuler</Button>
                                                    </Box>
                                                </Box>
                                            ) : (
                                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', py: 4, textAlign: 'center' }}>
                                                    <AccountBalanceWallet sx={{ fontSize: 48, color: '#e0e0e0', mb: 1 }} />
                                                    <Typography variant="body2" color="text.secondary">
                                                        Sélectionnez une action pour commencer
                                                    </Typography>
                                                    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}>
                                                        <Typography variant="h6" fontWeight={700} color={calculateTotalDebt(assignment) > 0 ? 'error.main' : 'success.main'}>
                                                            Reste: {calculateTotalDebt(assignment)} DA
                                                        </Typography>
                                                        <Button 
                                                            variant="outlined" 
                                                            size="small"
                                                            onClick={() => {
                                                                setActiveAssignmentId(assignment.id);
                                                                setOperationMode('CONFIG');
                                                                setConfigDate(getSuggestedNextDate(assignment));
                                                                setConfigAmount(getSuggestedAmount(assignment));
                                                            }}
                                                        >
                                                            Ajouter une échéance
                                                        </Button>
                                                    </Box>
                                                </Box>
                                            )}
                                        </Box>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}
