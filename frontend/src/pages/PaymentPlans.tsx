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
    TextField,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    IconButton,
    Chip,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import api from '../services/api';

interface PaymentPlan {
    id: number;
    name: string;
    installmentsCount: number;
    intervalDays: number;
    description?: string;
}

export default function PaymentPlans() {
    const [paymentPlans, setPaymentPlans] = useState<PaymentPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Dialog states
    const [openDialog, setOpenDialog] = useState(false);
    const [editingPlan, setEditingPlan] = useState<PaymentPlan | null>(null);

    // Form states
    const [name, setName] = useState('');
    const [installmentsCount, setInstallmentsCount] = useState<number>(1);
    const [intervalDays, setIntervalDays] = useState<number>(30);
    const [description, setDescription] = useState('');

    useEffect(() => {
        loadPaymentPlans();
    }, []);

    const loadPaymentPlans = async () => {
        try {
            setLoading(true);
            const response = await api.get('/payment-plans');
            setPaymentPlans(response.data.data || []);
            setError(null);
        } catch (err: any) {
            console.error('Erreur lors du chargement des plans de paiement:', err);
            setError('Erreur lors du chargement des plans de paiement: ' + (err.response?.data?.message || err.message));
            setPaymentPlans([]); // Assurer que paymentPlans est un tableau vide en cas d'erreur
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (plan?: PaymentPlan) => {
        console.log('handleOpenDialog called with plan:', plan);
        if (plan) {
            setEditingPlan(plan);
            setName(plan.name);
            setInstallmentsCount(plan.installmentsCount);
            setIntervalDays(plan.intervalDays);
            setDescription(plan.description || '');
        } else {
            setEditingPlan(null);
            setName('');
            setInstallmentsCount(1);
            setIntervalDays(30);
            setDescription('');
        }
        console.log('Setting openDialog to true');
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingPlan(null);
        setName('');
        setInstallmentsCount(1);
        setIntervalDays(30);
        setDescription('');
    };

    const handleSubmit = async () => {
        try {
            setError(null);
            setSuccess(null);

            const planData = {
                name: name.trim(),
                installmentsCount,
                intervalDays,
                description: description.trim() || null,
            };

            // Validation côté client
            if (!planData.name) {
                setError('Le nom du plan est obligatoire');
                return;
            }

            if (planData.installmentsCount < 1) {
                setError('Le nombre d\'échéances doit être au moins 1');
                return;
            }

            if (planData.intervalDays < 1) {
                setError('L\'intervalle entre échéances doit être au moins 1 jour');
                return;
            }

            if (editingPlan) {
                await api.put(`/payment-plans/${editingPlan.id}`, planData);
                setSuccess('Plan de paiement mis à jour avec succès');
            } else {
                await api.post('/payment-plans', planData);
                setSuccess('Plan de paiement créé avec succès');
            }

            handleCloseDialog();
            loadPaymentPlans();
        } catch (err: any) {
            console.error('Erreur lors de la sauvegarde:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Erreur lors de la sauvegarde du plan de paiement';
            setError(errorMessage);
        }
    };

    const handleDelete = async (plan: PaymentPlan) => {
        if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le plan "${plan.name}" ?`)) {
            return;
        }

        try {
            await api.delete(`/payment-plans/${plan.id}`);
            setSuccess('Plan de paiement supprimé avec succès');
            loadPaymentPlans();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erreur lors de la suppression');
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <Typography>Chargement...</Typography>
            </Box>
        );
    }

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" component="h1">
                    Plans de Paiement
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => handleOpenDialog()}
                >
                    Nouveau Plan
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    {success}
                </Alert>
            )}

            <Card>
                <CardContent>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Nom</TableCell>
                                <TableCell>Échéances</TableCell>
                                <TableCell>Intervalle (jours)</TableCell>
                                <TableCell>Description</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {Array.isArray(paymentPlans) && paymentPlans.map((plan) => (
                                <TableRow key={plan.id}>
                                    <TableCell>{plan.name}</TableCell>
                                    <TableCell>
                                        <Chip label={`${plan.installmentsCount} échéances`} />
                                    </TableCell>
                                    <TableCell>{plan.intervalDays} jours</TableCell>
                                    <TableCell>{plan.description || '-'}</TableCell>
                                    <TableCell>
                                        <IconButton
                                            color="primary"
                                            onClick={() => handleOpenDialog(plan)}
                                        >
                                            <Edit />
                                        </IconButton>
                                        <IconButton
                                            color="error"
                                            onClick={() => handleDelete(plan)}
                                        >
                                            <Delete />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {Array.isArray(paymentPlans) && paymentPlans.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">
                                        Aucun plan de paiement trouvé
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Dialog for creating/editing payment plans */}
            {console.log('Rendering dialog, openDialog:', openDialog)}
            {openDialog && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '20px',
                        borderRadius: '8px',
                        minWidth: '400px',
                        maxWidth: '500px'
                    }}>
                        <h2>{editingPlan ? 'Modifier le Plan de Paiement' : 'Nouveau Plan de Paiement'}</h2>
                        <div style={{ marginBottom: '10px' }}>
                            <label>Nom du plan:</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                style={{ width: '100%', padding: '8px', marginTop: '4px' }}
                            />
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                            <label>Nombre d'échéances:</label>
                            <input
                                type="number"
                                value={installmentsCount}
                                onChange={(e) => setInstallmentsCount(parseInt(e.target.value) || 1)}
                                min="1"
                                style={{ width: '100%', padding: '8px', marginTop: '4px' }}
                            />
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                            <label>Intervalle (jours):</label>
                            <input
                                type="number"
                                value={intervalDays}
                                onChange={(e) => setIntervalDays(parseInt(e.target.value) || 30)}
                                min="1"
                                style={{ width: '100%', padding: '8px', marginTop: '4px' }}
                            />
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                            <label>Description:</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                style={{ width: '100%', padding: '8px', marginTop: '4px' }}
                            />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button onClick={handleCloseDialog}>Annuler</button>
                            <button
                                onClick={handleSubmit}
                                style={{ backgroundColor: '#1976d2', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '4px' }}
                                disabled={!name || !installmentsCount || !intervalDays}
                            >
                                {editingPlan ? 'Modifier' : 'Créer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Box>
    );
}