import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Box, CircularProgress, Button } from '@mui/material'
import PrintIcon from '@mui/icons-material/Print'
import PaymentReceipt from '../components/PaymentReceipt'
import api from '../services/api'

export default function PrintReceipt() {
  const [searchParams] = useSearchParams()
  const type = searchParams.get('type') as 'INSCRIPTION' | 'SESSION' | 'INSTALLMENT'
  const id = searchParams.get('id')

  const { data: receiptData, isLoading } = useQuery({
    queryKey: ['receipt', type, id],
    queryFn: async () => {
      let endpoint = ''
      
      switch (type) {
        case 'INSCRIPTION':
          endpoint = `/registrations/${id}`
          break
        case 'SESSION':
          endpoint = `/enrollments/${id}/payment-details`
          break
        case 'INSTALLMENT':
          endpoint = `/installment-payments/${id}`
          break
      }
      
      const response = await api.get(endpoint)
      return response.data.data
    },
    enabled: !!type && !!id,
  })

  const receiptRef = useRef<HTMLDivElement | null>(null)

  const mmToPx = (mm: number) => (mm * 96) / 25.4
  const pageHeightMm = 297
  const marginMm = 8 // doit correspondre à la CSS @page

  const handlePrint = () => {
    const el = receiptRef.current
    if (el) {
      // log measurements to debug
      const printableHeightPx = Math.floor(mmToPx(pageHeightMm - 2 * marginMm))
      // hauteur non-scalée
      const contentHeight = el.scrollHeight
      // log pour diagnostic
      // eslint-disable-next-line no-console
      console.debug('print: contentHeight, printableHeightPx', { contentHeight, printableHeightPx })
    }

    window.print()
  }

  useEffect(() => {
    // Auto-print après 600ms si les données sont chargées (donner le temps au DOM/webpack)
    if (receiptData) {
      const timer = setTimeout(() => {
        // avant d'appeler print, on peut faire un petit ajustement si le reçu dépasse
        const el = receiptRef.current
        if (el) {
          const printableHeightPx = Math.floor(mmToPx(pageHeightMm - 2 * marginMm))
          const contentHeight = el.scrollHeight
          // Si le reçu dépasse légèrement, réduire la taille via transform légèrement
          if (contentHeight > printableHeightPx) {
            // appliquer une petite réduction en boucle jusqu'à ce que ça rentre ou qu'on atteigne 85%
            let scale = Math.min(1, printableHeightPx / contentHeight)
            scale = Math.max(0.85, scale * 0.99)
            el.style.transformOrigin = 'top left'
            el.style.transform = `scale(${scale})`
            // log
            // eslint-disable-next-line no-console
            console.debug('applied scale before print', { scale, contentHeight, printableHeightPx })
          }
        }
        window.print()
      }, 600)
      return () => clearTimeout(timer)
    }
  }, [receiptData])

  if (isLoading || !receiptData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    )
  }

  // Préparer les données selon le type
  let receiptProps: any = {}

  if (type === 'INSCRIPTION') {
    receiptProps = {
      type: 'INSCRIPTION',
      receiptNumber: `INS-${receiptData.id}-${new Date().getFullYear()}`,
      date: receiptData.registrationFeePaidAt || receiptData.createdAt,
      studentName: `${receiptData.firstName} ${receiptData.lastName}`,
      studentEmail: receiptData.email,
      courseName: receiptData.course?.title || 'Formation',
      amount: receiptData.registrationFee || 0,
      paymentMethod: 'CASH',
      description: 'Frais d\'inscription à la formation',
    }
  } else if (type === 'SESSION') {
    // Find the most recent paid session payment
    const sessionPayment = receiptData.sessionPayments?.find((sp: any) => sp.paymentDate)
    
    receiptProps = {
      type: 'SESSION',
      receiptNumber: `SES-${receiptData.id}-${new Date().getFullYear()}`,
      date: sessionPayment?.paymentDate || new Date().toISOString(),
      studentName: `${receiptData.student?.firstName} ${receiptData.student?.lastName}`,
      studentEmail: receiptData.student?.email,
      courseName: receiptData.session?.course?.title || 'Formation',
      amount: sessionPayment?.amount || receiptData.session?.price || 0,
      paymentMethod: sessionPayment?.paymentMethod || 'CASH',
      description: `Frais mensuel - ${receiptData.session?.monthLabel || ''}`,
    }
  } else if (type === 'INSTALLMENT') {
    receiptProps = {
      type: 'INSTALLMENT',
      receiptNumber: `ECH-${receiptData.id}-${new Date().getFullYear()}`,
      date: receiptData.paymentDate || new Date().toISOString(),
      studentName: `${receiptData.registration?.firstName} ${receiptData.registration?.lastName}`,
      studentEmail: receiptData.registration?.email,
      courseName: receiptData.registration?.course?.title || 'Formation',
      amount: receiptData.amount || 0,
      paymentMethod: receiptData.paymentMethod || 'CASH',
      description: 'Paiement échelonné',
      installmentNumber: receiptData.installmentNumber,
      totalInstallments: receiptData.registration?.installmentPlan?.numberOfInstallments,
    }
  }

  return (
    <>
      {/* Styles d'impression locaux pour forcer une seule page */}
      <style>{`
        @page { size: A4; margin: 8mm }
        @media print {
          html, body { 
            margin: 0 !important; 
            padding: 0 !important; 
            height: auto !important;
            overflow: visible !important;
          }
          
          /* Cacher tout le wrapper de la page sauf le receipt */
          .page-wrapper {
            display: none !important;
          }

          /* Le receipt est le seul élément visible */
          .receipt-only {
            display: block !important;
            position: relative !important;
            width: 100% !important;
            max-width: 210mm !important;
            margin: 0 auto !important;
            padding: 4mm !important;
            box-sizing: border-box !important;
            background: #fff !important;
            page-break-inside: avoid !important;
            -webkit-print-color-adjust: exact !important;
            font-size: 11px !important;
          }
        }

        @media screen {
          .receipt-only {
            max-width: 210mm;
            margin: 0 auto;
            background: white;
            padding: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
        }
      `}</style>

      {/* Wrapper pour tout sauf le receipt - caché en print */}
      <Box className="page-wrapper" sx={{ minHeight: '100vh', bgcolor: 'grey.100', py: 4 }}>
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            mb: 3,
          }}
        >
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            size="large"
          >
            Imprimer le reçu
          </Button>
        </Box>
      </Box>

      {/* Receipt - toujours visible, mais mis en forme différemment selon print/screen */}
      <div ref={receiptRef} className="receipt-only">
        <PaymentReceipt {...receiptProps} />
      </div>
    </>
  )
}
