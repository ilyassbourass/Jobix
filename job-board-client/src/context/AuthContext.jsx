import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { useI18n } from './I18nContext'

const AuthContext = createContext(null)

const getDefaultRouteForRole = (role) => {
  if (role === 'admin') return '/admin'
  if (role === 'company') return '/company'
  if (role === 'job_seeker') return '/dashboard'
  return '/'
}

const pendingVerificationEmailKey = 'pendingVerificationEmail'
const pendingVerificationUserIdKey = 'pendingVerificationUserId'

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useI18n()

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  })
  const [token, setToken] = useState(() => localStorage.getItem('token') || null)
  const [loading, setLoading] = useState(true)

  const persistUser = useCallback((nextUser) => {
    setUser(nextUser)
    if (nextUser) {
      localStorage.setItem('user', JSON.stringify(nextUser))
      if (nextUser.email_verified_at) {
        localStorage.removeItem(pendingVerificationEmailKey)
        localStorage.removeItem(pendingVerificationUserIdKey)
      } else if (nextUser.email) {
        localStorage.setItem(pendingVerificationEmailKey, nextUser.email)
        if (nextUser.id) {
          localStorage.setItem(pendingVerificationUserIdKey, String(nextUser.id))
        }
      }
      return
    }

    localStorage.removeItem('user')
  }, [])

  const clearSession = useCallback(() => {
    setToken(null)
    persistUser(null)
    localStorage.removeItem('token')
  }, [persistUser])

  const refreshUser = useCallback(async (newUserObj = null) => {
    try {
      if (newUserObj?.id) {
        persistUser(newUserObj)
      }

      const { data } = await api.get('/auth/me')
      persistUser(data)
    } catch (err) {
      console.error('Session expired', err)
      clearSession()
    }
  }, [clearSession, persistUser])

  useEffect(() => {
    if (token) {
      refreshUser().finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const login = async (credentials) => {
    try {
      const { data } = await api.post('/auth/login', credentials)
      const authToken = data.access_token || data.token
      setToken(authToken)
      persistUser(data.user)
      localStorage.setItem('token', authToken)

      const from = location.state?.from?.pathname
      const fallback = getDefaultRouteForRole(data.user?.role)
      navigate(from || fallback, { replace: true })
      toast.success(t('auth.loginSuccess'))

      return { success: true }
    } catch (error) {
      if (error.response?.status === 403 && error.response?.data?.verification_required) {
        localStorage.setItem(pendingVerificationEmailKey, credentials.email)
        localStorage.removeItem(pendingVerificationUserIdKey)
        navigate('/verify-email', { replace: true, state: { email: credentials.email } })
        toast.error(error.response?.data?.message || t('auth.verifyRequired'))
        return { verificationRequired: true }
      }

      throw error
    }
  }

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload)
    const email = data?.user?.email || payload.email
    const pendingUserId = data?.user?.id
    localStorage.setItem(pendingVerificationEmailKey, email)
    if (pendingUserId) {
      localStorage.setItem(pendingVerificationUserIdKey, String(pendingUserId))
    } else {
      localStorage.removeItem(pendingVerificationUserIdKey)
    }
    navigate('/verify-email', {
      replace: true,
      state: {
        email,
        userId: pendingUserId ?? null,
      },
    })
    toast.success(data?.message || t('auth.verifyPrompt'))
  }

  const logout = async (callApi = true) => {
    try {
      if (callApi && token) {
        await api.post('/auth/logout').catch(() => {})
      }
    } finally {
      clearSession()
      navigate('/login')
    }
  }

  const isAdmin = user?.role === 'admin'
  const isCompany = user?.role === 'company'
  const isJobSeeker = user?.role === 'job_seeker'
  const isVerified = Boolean(user?.email_verified_at)

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        refreshUser,
        isAdmin,
        isCompany,
        isJobSeeker,
        isVerified,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
