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
        } catch (err) {
            setError('Erreur lors du chargement des plans de paiement');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (plan?: PaymentPlan) => {
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
            const planData = {
                name,
                installmentsCount,
                intervalDays,
                description: description || null,
            };

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
            setError(err.response?.data?.message || 'Erreur lors de la sauvegarde');
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
                            {paymentPlans.map((plan) => (
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
                            {paymentPlans.length === 0 && (
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
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingPlan ? 'Modifier le Plan de Paiement' : 'Nouveau Plan de Paiement'}
                </DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Nom du plan"
                        fullWidth
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                    <TextField
                        margin="dense"
                        label="Nombre d'échéances"
                        type="number"
                        fullWidth
                        value={installmentsCount}
                        onChange={(e) => setInstallmentsCount(parseInt(e.target.value) || 1)}
                        inputProps={{ min: 1 }}
                        required
                    />
                    <TextField
                        margin="dense"
                        label="Intervalle (jours)"
                        type="number"
                        fullWidth
                        value={intervalDays}
                        onChange={(e) => setIntervalDays(parseInt(e.target.value) || 1)}
                        inputProps={{ min: 1 }}
                        required
                    />
                    <TextField
                        margin="dense"
                        label="Description"
                        fullWidth
                        multiline
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Annuler</Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={!name || !installmentsCount || !intervalDays}
                    >
                        {editingPlan ? 'Modifier' : 'Créer'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}