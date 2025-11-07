import { useEffect } from 'react'
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

  const handlePrint = () => {
    window.print()
  }

  useEffect(() => {
    // Auto-print après 1 seconde si les données sont chargées
    if (receiptData) {
      const timer = setTimeout(() => {
        window.print()
      }, 1000)
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
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.100', py: 4 }}>
      {/* Bouton d'impression (caché à l'impression) */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          mb: 3,
          '@media print': {
            display: 'none',
          }
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

      <PaymentReceipt {...receiptProps} />
    </Box>
  )
}
