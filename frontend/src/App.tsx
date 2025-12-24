import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import Layout from './components/Layout/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import StudentDetail from './pages/StudentDetail'
import Trainers from './pages/Trainers'
import Courses from './pages/Courses'
import Enrollments from './pages/Enrollments'
import PrintReceipt from './pages/PrintReceipt'
import QRScanner from './pages/QRScanner'
import Payments from './pages/Payments'
import PaymentDetail from './pages/PaymentDetail'
import PaymentPlans from './pages/PaymentPlans'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore()
  return token ? <>{children}</> : <Navigate to="/login" />
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/print-receipt" element={<PrintReceipt />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="students" element={<Students />} />
        <Route path="students/:id" element={<StudentDetail />} />
        <Route path="trainers" element={<Trainers />} />
        <Route path="courses" element={<Courses />} />
        <Route path="enrollments" element={<Enrollments />} />
        <Route path="payments" element={<Payments />} />
        <Route path="payments/:id" element={<PaymentDetail />} />
        <Route path="payment-plans" element={<PaymentPlans />} />
        <Route path="qr-scanner" element={<QRScanner />} />
      </Route>
    </Routes>
  )
}

export default App
