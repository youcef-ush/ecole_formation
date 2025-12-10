import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Divider,
} from '@mui/material';
import { Print } from '@mui/icons-material';

interface ReceiptModalProps {
    open: boolean;
    onClose: () => void;
    data: {
        studentName: string;
        amount: number;
        date: string;
        courseTitle: string;
        type: string;
    } | null;
}

export default function ReceiptModal({ open, onClose, data }: ReceiptModalProps) {
    if (!data) return null;

    const handlePrint = () => {
        window.print();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Reçu de Paiement</DialogTitle>
            <DialogContent>
                <Box
                    id="receipt-print-area"
                    sx={{
                        p: 3,
                        border: '1px solid #ddd',
                        borderRadius: 2,
                        mt: 1,
                        backgroundColor: '#fff',
                    }}
                >
                    <Typography variant="h5" align="center" gutterBottom sx={{ fontWeight: 'bold' }}>
                        ÉCOLE DE FORMATION
                    </Typography>
                    <Typography variant="subtitle2" align="center" color="text.secondary" gutterBottom>
                        Reçu de paiement
                    </Typography>

                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body1" fontWeight="bold">Date:</Typography>
                        <Typography variant="body1">{data.date}</Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body1" fontWeight="bold">Étudiant:</Typography>
                        <Typography variant="body1">{data.studentName}</Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body1" fontWeight="bold">Formation:</Typography>
                        <Typography variant="body1">{data.courseTitle}</Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body1" fontWeight="bold">Type:</Typography>
                        <Typography variant="body1">{data.type}</Typography>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" fontWeight="bold">Montant Total:</Typography>
                        <Typography variant="h6" color="primary">{data.amount} DA</Typography>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="caption" display="block" align="center" sx={{ mt: 2 }}>
                        Ce document sert de preuve de paiement.
                    </Typography>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Fermer</Button>
                <Button variant="contained" startIcon={<Print />} onClick={handlePrint}>
                    Imprimer
                </Button>
            </DialogActions>
        </Dialog>
    );
}
