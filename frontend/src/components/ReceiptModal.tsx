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
import { useRef } from 'react';
import { PDFExport } from '@progress/kendo-react-pdf';
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

    // Auto-print when data is available
    // useEffect(() => {
    //     const timer = setTimeout(() => {
    //         window.print();
    //     }, 500);
    //     return () => clearTimeout(timer);
    // }, []);

    // User asked to "imprimer le recu" which implies the ACTION. 
    // I will add the CSS first. Auto-print might be aggressive if they just want to see it first.
    // Let's stick to the button but make the Print PERFECT.

    const ref = useRef<HTMLDivElement | null>(null);
    const pdfExportComponent = useRef<PDFExport | null>(null);

    const exportPdf = () => {
        const el = ref.current;
        if (!el || !pdfExportComponent.current) {
            pdfExportComponent.current?.save();
            return;
        }

        // compute printable area in px
        const mmToPx = (mm: number) => (mm * 96) / 25.4;
        const pageWidthMm = 210;
        const pageHeightMm = 297;
        const marginMm = 10;

        const printableWidthPx = Math.floor(mmToPx(pageWidthMm - 2 * marginMm));
        const printableHeightPx = Math.floor(mmToPx(pageHeightMm - 2 * marginMm));

        const prevWidth = el.style.width || '';
        const prevTransform = el.style.transform || '';
        const prevTransformOrigin = el.style.transformOrigin || '';

        // constrain width to printable width to avoid wrapping
        el.style.width = `${printableWidthPx}px`;
        el.style.boxSizing = 'border-box';

        const contentWidth = el.scrollWidth;
        const contentHeight = el.scrollHeight;

        const scaleW = printableWidthPx / contentWidth;
        const scaleH = printableHeightPx / contentHeight;
        const scale = Math.min(1, scaleW, scaleH);

        if (scale < 1) {
            el.style.transformOrigin = 'top left';
            el.style.transform = `scale(${scale})`;
        }

        // give kendo a moment to snapshot the styled node
        setTimeout(() => {
            // eslint-disable-next-line no-console
            console.debug('Exporting PDF with scale', { printableWidthPx, printableHeightPx, contentWidth, contentHeight, scale });
            pdfExportComponent.current?.save();

            // restore styles after a short delay
            setTimeout(() => {
                el.style.transform = prevTransform;
                el.style.transformOrigin = prevTransformOrigin;
                el.style.width = prevWidth;
            }, 500);
        }, 150);
    };

    const prepareAndPrint = (direct = true) => {
        const el = ref.current;
        if (!el) {
            if (direct) window.print();
            return;
        }

        // Compute printable A4 area in pixels using 96dpi conversion (1mm = 96/25.4 px)
        const mmToPx = (mm: number) => (mm * 96) / 25.4;
        const pageWidthMm = 210;
        const pageHeightMm = 297;
        const marginMm = 10; // matches @page margin

        const printableWidthPx = Math.floor(mmToPx(pageWidthMm - 2 * marginMm));
        const printableHeightPx = Math.floor(mmToPx(pageHeightMm - 2 * marginMm));

        // Remember original inline styles so we can restore them
        const prevWidth = el.style.width || '';
        const prevTransform = el.style.transform || '';
        const prevTransformOrigin = el.style.transformOrigin || '';

        // Force the receipt to render at the printable width to avoid extra wrapping
        el.style.width = `${printableWidthPx}px`;
        el.style.boxSizing = 'border-box';

        // Measure after constraining width
        const contentWidth = el.scrollWidth;
        const contentHeight = el.scrollHeight;

        // Fit both width and height into printable area
        const scaleW = printableWidthPx / contentWidth;
        const scaleH = printableHeightPx / contentHeight;
        const scale = Math.min(1, scaleW, scaleH);

        if (scale < 1) {
            el.style.transformOrigin = 'top left';
            el.style.transform = `scale(${scale})`;
        }

        // Small delay to allow layout/transform to apply, then print
        setTimeout(() => {
            // Helpful debug info when printing fails
            // eslint-disable-next-line no-console
            console.debug('Printing receipt:', { printableWidthPx, printableHeightPx, contentWidth, contentHeight, scale });
            window.print();

            // cleanup after printing (allow print dialog to start)
            setTimeout(() => {
                el.style.transform = prevTransform;
                el.style.transformOrigin = prevTransformOrigin;
                el.style.width = prevWidth;
            }, 1000);
        }, 250);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <style>
                {`
                    @media print {
                        html, body { margin: 0; padding: 0; }
                        body * {
                            visibility: hidden;
                        }
                        .receipt-print-content, .receipt-print-content * {
                            visibility: visible;
                        }
                        @page { size: A4; margin: 10mm; }
                        html, body { height: auto !important; }
                        .receipt-print-content {
                            /* Use normal flow instead of absolute positioning to avoid overflow/extra page */
                            position: static !important;
                            width: auto !important;
                            max-width: 190mm;
                            display: block;
                            margin: 0 auto;
                            padding: 10mm;
                            visibility: visible !important;
                            box-sizing: border-box;
                            page-break-after: avoid;
                            page-break-inside: avoid;
                            break-inside: avoid;
                            /* Make sure content doesn't overflow to force another page */
                            max-height: calc(297mm - 20mm);
                            overflow: hidden;
                            /* slightly reduce font-size to avoid small overflows */
                            font-size: 13px;
                        }
                        /* reset margins for print to be conservative */
                        .receipt-print-content * {
                            margin: 0 !important;
                            padding: 0 !important;
                        }
                        /* Hide the dialog overlay/background logic */
                        .MuiDialog-root {
                            position: static !important;
                        }
                        .MuiDialog-container {
                            display: block !important;
                        }
                        .MuiPaper-root {
                            box-shadow: none !important;
                            position: static !important;
                            max-width: none !important;
                            width: 100% !important;
                        }
                        /* Hide buttons in print */
                        .no-print {
                            display: none !important;
                        }
                    }
                `}
            </style>
            <DialogTitle>Reçu de Paiement</DialogTitle>
            <DialogContent>
                <PDFExport
                    ref={pdfExportComponent}
                    paperSize="A4"
                    margin="2cm"
                    scale={0.8}
                >
                    <Box
                        id="receipt-print-area"
                        ref={ref}
                        className="receipt-print-content"
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
                </PDFExport>
            </DialogContent>
            <DialogActions className="no-print">
                <Button onClick={onClose}>Fermer</Button>
                <Button variant="outlined" onClick={() => exportPdf()}>
                    Exporter PDF
                </Button>
                <Button variant="outlined" onClick={() => prepareAndPrint(true)}>
                    Prévisualiser & Imprimer
                </Button>
                <Button variant="contained" startIcon={<Print />} onClick={() => prepareAndPrint(false)}>
                    Imprimer
                </Button>
            </DialogActions>
        </Dialog>
    );
}
