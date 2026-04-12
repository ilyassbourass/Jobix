import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001/api'
const PUBLIC_AUTH_ENDPOINTS = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
  '/auth/email/verification-notification',
]

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    Accept: 'application/json',
  },
})

const demoModeMessages = {
  en: 'Demo mode is enabled. This action is disabled while the demo is read-only.',
  fr: 'Le mode demo est actif. Cette action est desactivee tant que la demo est en lecture seule.',
  ar: '\u062a\u0645 \u062a\u0641\u0639\u064a\u0644 \u0648\u0636\u0639 \u0627\u0644\u0639\u0631\u0636. \u0647\u0630\u0627 \u0627\u0644\u0625\u062c\u0631\u0627\u0621 \u0645\u0639\u0637\u0644 \u0637\u0627\u0644\u0645\u0627 \u0623\u0646 \u0627\u0644\u0639\u0631\u0636 \u0641\u064a \u0648\u0636\u0639 \u0627\u0644\u0642\u0631\u0627\u0621\u0629 \u0641\u0642\u0637.',
}

const getDemoModeMessage = () => {
  const language = localStorage.getItem('language') || 'en'
  return demoModeMessages[language] || demoModeMessages.en
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  const requestUrl = config.url || ''
  const isPublicAuthRequest = PUBLIC_AUTH_ENDPOINTS.some((endpoint) => requestUrl.includes(endpoint))

  if (token && !isPublicAuthRequest) {
    config.headers.Authorization = `Bearer ${token}`
  } else if (config.headers?.Authorization) {
    delete config.headers.Authorization
  }

  // Let the browser set multipart boundaries for FormData.
  if (config.data instanceof FormData) {
    if (config.headers && 'Content-Type' in config.headers) {
      delete config.headers['Content-Type']
    }
  } else {
    config.headers['Content-Type'] = config.headers['Content-Type'] || 'application/json'
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')

      const requestUrl = error.config?.url || ''
      const isLoginRequest = requestUrl.includes('/auth/login')
      const onLoginPage = window.location.pathname === '/login'

      if (!isLoginRequest && !onLoginPage) {
        window.location.replace('/login?session=expired')
      }
    }

    if (error.response?.status === 403 && error.response?.data?.verification_required) {
      const storedUser = localStorage.getItem('user')
      let email = null
      let fallbackEmail = null
      let userId = error.response?.data?.user_id || null
      let fallbackUserId = null

      try {
        email = error.config?.data && typeof error.config.data === 'string'
          ? JSON.parse(error.config.data)?.email
          : null
      } catch {
        email = null
      }

      try {
        const parsedUser = storedUser ? JSON.parse(storedUser) : null
        fallbackEmail = parsedUser?.email || null
        fallbackUserId = parsedUser?.id || null
      } catch {
        fallbackEmail = null
        fallbackUserId = null
      }

      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (email || fallbackEmail || error.response?.data?.email) {
        localStorage.setItem('pendingVerificationEmail', error.response?.data?.email || email || fallbackEmail)
      }
      if (userId || fallbackUserId) {
        localStorage.setItem('pendingVerificationUserId', String(userId || fallbackUserId))
      }
      window.location.href = '/verify-email'
    }

    if (error.response?.status === 423) {
      error.response.data = {
        ...error.response.data,
        demo_mode: true,
        message: error.response?.data?.message || getDemoModeMessage(),
      }
    }

    return Promise.reject(error)
  }
)

export default api
