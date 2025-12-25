import { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TableContainer,
    Paper,
    Chip,
    Grid,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    IconButton,
    Tabs,
    Tab,
    CircularProgress,
} from '@mui/material';
import {
    Add,
    TrendingUp,
    TrendingDown,
    AccountBalance,
    Print,
    FilterList,
    Delete,
    Visibility,
} from '@mui/icons-material';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

interface Transaction {
    id: number;
    type: 'INCOME' | 'EXPENSE';
    source: string;
    amount: number;
    description?: string;
    motif?: string;
    transactionDate: string;
    studentName?: string;
    createdByName?: string;
}

interface Summary {
    totalIncome: number;
    totalExpense: number;
    balance: number;
    count: number;
}

export default function Finances() {
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [summary, setSummary] = useState<Summary>({ totalIncome: 0, totalExpense: 0, balance: 0, count: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Dialog states
    const [openDialog, setOpenDialog] = useState(false);
    const [filterTab, setFilterTab] = useState(0);

    // Form states
    const [formData, setFormData] = useState({
        type: 'EXPENSE' as 'INCOME' | 'EXPENSE',
        source: 'MANUAL_EXPENSE',
        amount: '',
        description: '',
        motif: '',
        transactionDate: new Date().toISOString().split('T')[0],
    });

    // Filter states
    const [filters, setFilters] = useState({
        type: '',
        startDate: '',
        endDate: '',
    });

    useEffect(() => {
        loadData();
    }, [filters]);

    const loadData = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filters.type) params.append('type', filters.type);
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);

            const [transactionsRes, summaryRes] = await Promise.all([
                api.get(`/transactions?${params.toString()}`),
                api.get(`/transactions/summary?${params.toString()}`)
            ]);

            setTransactions(transactionsRes.data.data || []);
            setSummary(summaryRes.data.data || { totalIncome: 0, totalExpense: 0, balance: 0, count: 0 });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erreur lors du chargement des données');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        try {
            if (!formData.amount || !formData.description) {
                setError('Veuillez remplir tous les champs obligatoires');
                return;
            }

            await api.post('/transactions', {
                ...formData,
                amount: Number(formData.amount),
            });

            setSuccess('Transaction ajoutée avec succès');
            setOpenDialog(false);
            resetForm();
            loadData();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erreur lors de l\'ajout');
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette transaction ?')) return;
        try {
            await api.delete(`/transactions/${id}`);
            setSuccess('Transaction supprimée');
            loadData();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erreur lors de la suppression');
        }
    };

    const resetForm = () => {
        setFormData({
            type: 'EXPENSE',
            source: 'MANUAL_EXPENSE',
            amount: '',
            description: '',
            motif: '',
            transactionDate: new Date().toISOString().split('T')[0],
        });
    };

    const handlePrint = () => {
        window.print();
    };

    const getSourceLabel = (source: string) => {
        const labels: Record<string, string> = {
            PAYMENT_INSTALLMENT: 'Paiement échéance',
            REGISTRATION_FEE: 'Frais d\'inscription',
            MANUAL_EXPENSE: 'Dépense manuelle',
            OTHER_INCOME: 'Autre revenu',
        };
        return labels[source] || source;
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;

    return (
        <Box className="no-print">
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" fontWeight={600}>Gestion Financière</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<FilterList />}
                        onClick={() => setFilterTab(filterTab === 0 ? 1 : 0)}
                    >
                        Filtres
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<Print />}
                        onClick={handlePrint}
                    >
                        Imprimer
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => setOpenDialog(true)}
                    >
                        Ajouter une dépense
                    </Button>
                </Box>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

            {/* Filtres */}
            {filterTab === 1 && (
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={4}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Type</InputLabel>
                                    <Select
                                        value={filters.type}
                                        label="Type"
                                        onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                                    >
                                        <MenuItem value="">Tous</MenuItem>
                                        <MenuItem value="INCOME">Revenus</MenuItem>
                                        <MenuItem value="EXPENSE">Dépenses</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    label="Date début"
                                    type="date"
                                    size="small"
                                    value={filters.startDate}
                                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    label="Date fin"
                                    type="date"
                                    size="small"
                                    value={filters.endDate}
                                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            )}

            {/* Résumé */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={4}>
                    <Card sx={{ bgcolor: '#e8f5e9', borderLeft: '4px solid #4caf50' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <TrendingUp sx={{ fontSize: 40, color: '#4caf50' }} />
                                <Box>
                                    <Typography variant="h5" fontWeight={700} color="#4caf50">
                                        {summary.totalIncome.toLocaleString()} DA
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">Total Revenus</Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card sx={{ bgcolor: '#ffebee', borderLeft: '4px solid #f44336' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <TrendingDown sx={{ fontSize: 40, color: '#f44336' }} />
                                <Box>
                                    <Typography variant="h5" fontWeight={700} color="#f44336">
                                        {summary.totalExpense.toLocaleString()} DA
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">Total Dépenses</Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card sx={{ bgcolor: '#e3f2fd', borderLeft: '4px solid #2196f3' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <AccountBalance sx={{ fontSize: 40, color: '#2196f3' }} />
                                <Box>
                                    <Typography variant="h5" fontWeight={700} color="#2196f3">
                                        {summary.balance.toLocaleString()} DA
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">Solde Net</Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Table des transactions */}
            <Card>
                <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>Historique des Transactions</Typography>
                    <TableContainer component={Paper} variant="outlined">
                        <Table>
                            <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                                <TableRow>
                                    <TableCell>Date</TableCell>
                                    <TableCell>Type</TableCell>
                                    <TableCell>Source</TableCell>
                                    <TableCell>Description</TableCell>
                                    <TableCell>Motif</TableCell>
                                    <TableCell>Étudiant</TableCell>
                                    <TableCell align="right">Montant</TableCell>
                                    <TableCell align="center">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {transactions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} align="center">
                                            <Typography variant="body2" color="text.secondary">
                                                Aucune transaction trouvée
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    transactions.map((trans) => (
                                        <TableRow key={trans.id}>
                                            <TableCell>{new Date(trans.transactionDate).toLocaleDateString('fr-FR')}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={trans.type === 'INCOME' ? 'Revenu' : 'Dépense'}
                                                    color={trans.type === 'INCOME' ? 'success' : 'error'}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell>{getSourceLabel(trans.source)}</TableCell>
                                            <TableCell>{trans.description || '-'}</TableCell>
                                            <TableCell>{trans.motif || '-'}</TableCell>
                                            <TableCell>{trans.studentName || '-'}</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600 }}>
                                                <span style={{ color: trans.type === 'INCOME' ? '#4caf50' : '#f44336' }}>
                                                    {trans.type === 'INCOME' ? '+' : '-'} {trans.amount.toLocaleString()} DA
                                                </span>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                                    <IconButton
                                                        size="small"
                                                        color="primary"
                                                        onClick={() => navigate(`/finances/${trans.id}`)}
                                                        title="Voir détails"
                                                    >
                                                        <Visibility fontSize="small" />
                                                    </IconButton>
                                                    {trans.source === 'MANUAL_EXPENSE' && (
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() => handleDelete(trans.id)}
                                                            title="Supprimer"
                                                        >
                                                            <Delete fontSize="small" />
                                                        </IconButton>
                                                    )}
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>

            {/* Dialog d'ajout de dépense */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Ajouter une dépense</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <FormControl fullWidth>
                            <InputLabel>Type</InputLabel>
                            <Select
                                value={formData.type}
                                label="Type"
                                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                            >
                                <MenuItem value="EXPENSE">Dépense</MenuItem>
                                <MenuItem value="INCOME">Revenu</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            fullWidth
                            label="Montant (DA)"
                            type="number"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            required
                        />

                        <TextField
                            fullWidth
                            label="Description"
                            multiline
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            required
                        />

                        <TextField
                            fullWidth
                            label="Motif"
                            value={formData.motif}
                            onChange={(e) => setFormData({ ...formData, motif: e.target.value })}
                        />

                        <TextField
                            fullWidth
                            label="Date"
                            type="date"
                            value={formData.transactionDate}
                            onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Annuler</Button>
                    <Button variant="contained" onClick={handleSubmit}>Ajouter</Button>
                </DialogActions>
            </Dialog>

            {/* Styles pour l'impression */}
            <style>{`
                @media print {
                    .no-print {
                        display: block !important;
                    }
                    .no-print > *:not(.MuiCard-root) {
                        display: none !important;
                    }
                    button, .MuiIconButton-root {
                        display: none !important;
                    }
                }
            `}</style>
        </Box>
    );
}
