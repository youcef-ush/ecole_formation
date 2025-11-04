import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import Layout from './components/Layout/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import Trainers from './pages/Trainers'
import Courses from './pages/Courses'
import Sessions from './pages/Sessions'
import Enrollments from './pages/Enrollments'
import Registrations from './pages/Registrations'
import Rooms from './pages/Rooms'
import TimeSlots from './pages/TimeSlots'
import Finance from './pages/Finance'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore()
  return token ? <>{children}</> : <Navigate to="/login" />
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
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
        <Route path="trainers" element={<Trainers />} />
        <Route path="courses" element={<Courses />} />
        <Route path="sessions" element={<Sessions />} />
        <Route path="enrollments" element={<Enrollments />} />
        <Route path="registrations" element={<Registrations />} />
        <Route path="finance" element={<Finance />} />
        <Route path="rooms" element={<Rooms />} />
        <Route path="timeslots" element={<TimeSlots />} />
      </Route>
    </Routes>
  )
}

export default App
