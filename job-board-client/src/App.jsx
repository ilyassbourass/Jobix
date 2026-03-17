import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import JobDetail from './pages/JobDetail'
import CompanyPublic from './pages/CompanyPublic'
import PublicUserProfile from './pages/PublicUserProfile'

const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'))
const About = lazy(() => import('./pages/About'))
const NotFound = lazy(() => import('./pages/NotFound'))
const Profile = lazy(() => import('./pages/Profile'))
const CompanyDashboard = lazy(() => import('./pages/CompanyDashboard'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const SavedJobs = lazy(() => import('./pages/SavedJobs'))
const JobSeekerDashboard = lazy(() => import('./pages/JobSeekerDashboard'))

function PageSpinner() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
    </div>
  )
}

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()

  if (loading) return <PageSpinner />
  if (!user) return <Navigate to="/login" replace />
  if (!user.email_verified_at) {
    return <Navigate to="/verify-email" replace state={{ email: user.email, userId: user.id }} />
  }
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />

  return children
}

function LegacyPublicUserProfileRedirect() {
  const { username } = useParams()

  return <Navigate to={`/public-profile/${username}`} replace />
}

export default function App() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="jobs/:id" element={<JobDetail />} />
          <Route path="companies/:companySlug" element={<CompanyPublic />} />
          <Route path="about" element={<About />} />
          <Route path="public-profile/:username" element={<PublicUserProfile />} />
          <Route path="users/:username" element={<LegacyPublicUserProfileRedirect />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password/:token" element={<ResetPassword />} />
          <Route path="verify-email" element={<VerifyEmail />} />
          <Route
            path="profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="dashboard"
            element={
              <ProtectedRoute roles={['job_seeker']}>
                <JobSeekerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="saved-jobs"
            element={
              <ProtectedRoute roles={['job_seeker']}>
                <SavedJobs />
              </ProtectedRoute>
            }
          />
          <Route
            path="company"
            element={
              <ProtectedRoute roles={['company']}>
                <CompanyDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
