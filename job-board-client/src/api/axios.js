import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Accept': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  // Let the browser set multipart boundaries for FormData
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

      try {
        email = error.config?.data && typeof error.config.data === 'string'
          ? JSON.parse(error.config.data)?.email
          : null
      } catch {
        email = null
      }

      try {
        fallbackEmail = storedUser ? JSON.parse(storedUser)?.email : null
      } catch {
        fallbackEmail = null
      }

      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (email || fallbackEmail) {
        localStorage.setItem('pendingVerificationEmail', email || fallbackEmail)
      }
      window.location.href = '/verify-email'
    }

    return Promise.reject(error)
  }
)

export default api
