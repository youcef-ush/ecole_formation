import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import Layout from './components/Layout/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import StudentDetail from './pages/StudentDetail'
import Trainers from './pages/Trainers'
import Courses from './pages/Courses'
import Sessions from './pages/Sessions'
import Registrations from './pages/Registrations'
import Rooms from './pages/Rooms'
import TimeSlots from './pages/TimeSlots'
import PaymentSchedules from './pages/PaymentSchedules'
import OverduePayments from './pages/OverduePayments'
import PrintReceipt from './pages/PrintReceipt'
import QRScanner from './pages/QRScanner'
import AttendanceManagement from './pages/AttendanceManagement'

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
        <Route path="sessions" element={<Sessions />} />
        <Route path="registrations" element={<Registrations />} />
        <Route path="payment-schedules" element={<PaymentSchedules />} />
        <Route path="overdue-payments" element={<OverduePayments />} />
        <Route path="rooms" element={<Rooms />} />
        <Route path="timeslots" element={<TimeSlots />} />
        <Route path="qr-scanner" element={<QRScanner />} />
        <Route path="attendances" element={<AttendanceManagement />} />
      </Route>
    </Routes>
  )
}

export default App
