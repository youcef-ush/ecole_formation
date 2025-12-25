import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Grid,
    Divider,
    Chip,
    IconButton,
    CircularProgress,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableRow,
} from '@mui/material';
import {
    ArrowBack,
    Print,
} from '@mui/icons-material';
import api from '../services/api';

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

export default function FinanceDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    
    const [transaction, setTransaction] = useState<Transaction | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadTransaction();
    }, [id]);

    const loadTransaction = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/transactions/${id}`);
            setTransaction(response.data.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erreur lors du chargement');
        } finally {
            setLoading(false);
        }
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
    if (error) return <Alert severity="error">{error}</Alert>;
    if (!transaction) return <Alert severity="warning">Transaction non trouvée</Alert>;

    return (
        <Box>
            {/* En-tête - caché à l'impression */}
            <Box className="no-print" sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton onClick={() => navigate('/finances')}>
                        <ArrowBack />
                    </IconButton>
                    <Typography variant="h4" fontWeight={600}>Détail de la Transaction</Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<Print />}
                    onClick={handlePrint}
                >
                    Imprimer
                </Button>
            </Box>

            {/* Contenu imprimable */}
            <Card sx={{ maxWidth: 800, mx: 'auto' }}>
                <CardContent sx={{ p: 4 }}>
                    {/* En-tête d'impression */}
                    <Box className="print-only" sx={{ display: 'none', mb: 3, textAlign: 'center' }}>
                        <Typography variant="h4" fontWeight={700}>
                            Inspired Academy by Nana
                        </Typography>
                        <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                            Reçu de Transaction
                        </Typography>
                        <Divider sx={{ my: 2 }} />
                    </Box>

                    {/* Type et statut */}
                    <Box sx={{ mb: 3, textAlign: 'center' }}>
                        <Chip
                            label={transaction.type === 'INCOME' ? 'REVENU' : 'DÉPENSE'}
                            color={transaction.type === 'INCOME' ? 'success' : 'error'}
                            size="large"
                            sx={{ fontSize: '1.1rem', px: 3, py: 2 }}
                        />
                    </Box>

                    {/* Montant principal */}
                    <Box sx={{ 
                        textAlign: 'center', 
                        py: 3, 
                        bgcolor: transaction.type === 'INCOME' ? '#e8f5e9' : '#ffebee',
                        borderRadius: 2,
                        mb: 3
                    }}>
                        <Typography variant="h3" fontWeight={700} color={transaction.type === 'INCOME' ? '#4caf50' : '#f44336'}>
                            {transaction.amount.toLocaleString()} DA
                        </Typography>
                    </Box>

                    <Divider sx={{ my: 3 }} />

                    {/* Informations détaillées */}
                    <Table>
                        <TableBody>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600, width: '40%' }}>N° Transaction</TableCell>
                                <TableCell>#{transaction.id}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                                <TableCell>
                                    {new Date(transaction.transactionDate).toLocaleDateString('fr-FR', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600 }}>Source</TableCell>
                                <TableCell>{getSourceLabel(transaction.source)}</TableCell>
                            </TableRow>
                            {transaction.description && (
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                                    <TableCell>{transaction.description}</TableCell>
                                </TableRow>
                            )}
                            {transaction.motif && (
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600 }}>Motif</TableCell>
                                    <TableCell>{transaction.motif}</TableCell>
                                </TableRow>
                            )}
                            {transaction.studentName && (
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600 }}>Étudiant</TableCell>
                                    <TableCell>{transaction.studentName}</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    <Divider sx={{ my: 3 }} />

                    {/* Pied de page d'impression */}
                    <Box className="print-only" sx={{ display: 'none', mt: 4, textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                            Document généré le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                            Inspired Academy by Nana - Gestion des Finances
                        </Typography>
                    </Box>

                    {/* Note en bas */}
                    <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                        <Typography variant="body2" color="text.secondary" textAlign="center">
                            Ce document constitue un justificatif de {transaction.type === 'INCOME' ? 'paiement reçu' : 'dépense effectuée'}
                        </Typography>
                    </Box>
                </CardContent>
            </Card>

            {/* Styles d'impression */}
            <style>{`
                @media print {
                    /* Cacher tous les éléments non nécessaires */
                    .no-print,
                    nav,
                    header,
                    aside,
                    .MuiDrawer-root,
                    .MuiAppBar-root,
                    button,
                    .MuiIconButton-root {
                        display: none !important;
                    }
                    
                    /* Afficher uniquement le contenu */
                    .print-only {
                        display: block !important;
                    }
                    
                    /* Réinitialiser le fond et les marges */
                    body {
                        background: white !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    
                    /* Centrer le contenu */
                    .MuiBox-root {
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    
                    /* Style de la carte */
                    .MuiCard-root {
                        box-shadow: none !important;
                        margin: 0 auto !important;
                    }
                    
                    /* Configuration de la page */
                    @page {
                        size: A4;
                        margin: 2cm;
                    }
                }
            `}</style>
        </Box>
    );
}
