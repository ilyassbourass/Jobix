import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, Briefcase } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useI18n } from '../context/I18nContext'

export default function Login() {
  const { user, login } = useAuth()
  const { t } = useI18n()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/" replace />

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('session') === 'expired') {
      setError('Your session is no longer valid. Please sign in again.')
      return
    }

    setError('')
  }, [location.search])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await login({ email, password })
      if (result?.verificationRequired) {
        return
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.errors?.email?.[0] ||
          t('auth.loginFailed')
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-md"
    >
      <Card className="border-slate-200/80 shadow-soft dark:border-gray-800">
        <CardContent className="p-8">
          <div className="mb-6 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 shadow-sm">
              <Briefcase className="h-6 w-6 text-white" />
            </div>
          </div>
          <h1 className="mb-2 text-center text-2xl font-semibold text-slate-900 dark:text-white">
            {t('auth.loginTitle')}
          </h1>
          <p className="mb-6 text-center text-sm text-slate-600 dark:text-gray-400">
            {t('auth.loginSubtitle')}
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                {error}
              </div>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-gray-300">
                {t('auth.email')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between gap-3">
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300">
                  {t('auth.password')}
                </label>
                <Link to="/forgot-password" className="text-sm font-medium text-primary-600 hover:underline dark:text-primary-400">
                  {t('auth.forgotPassword')}
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? t('auth.loggingIn') : t('auth.loginTitle')}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-600 dark:text-gray-400">
            {t('auth.dontHaveAccount')}{' '}
            <Link to="/register" className="font-medium text-primary-600 hover:underline dark:text-primary-400">
              {t('auth.signUp')}
            </Link>
          </p>
        </CardContent>
      </Card>
    </motion.div>
  )
}
