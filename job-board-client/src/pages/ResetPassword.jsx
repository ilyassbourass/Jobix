import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Briefcase, Lock, Mail } from 'lucide-react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useI18n } from '../context/I18nContext'

export default function ResetPassword() {
  const { user } = useAuth()
  const { token } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { t } = useI18n()
  const linkEmail = useMemo(
    () => searchParams.get('email')?.trim().toLowerCase() || '',
    [searchParams]
  )
  const emailLocked = Boolean(linkEmail)
  const [email, setEmail] = useState(linkEmail)
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/" replace />

  useEffect(() => {
    if (emailLocked) {
      setEmail(linkEmail)
    }
  }, [emailLocked, linkEmail])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!token) {
      setError(t('auth.resetPasswordInvalid'))
      return
    }

    const resetEmail = (emailLocked ? linkEmail : email).trim().toLowerCase()
    setLoading(true)

    try {
      const { data } = await api.post('/auth/reset-password', {
        token,
        email: resetEmail,
        password,
        password_confirmation: passwordConfirmation,
      })

      setPassword('')
      setPasswordConfirmation('')
      navigate('/login', {
        replace: true,
        state: {
          email: resetEmail,
          message: data?.message || t('auth.resetPasswordSuccess'),
        },
      })
    } catch (err) {
      const errors = err.response?.data?.errors
      setError(
        errors ? Object.values(errors).flat().join(' ') : (
          err.response?.data?.message || t('auth.resetPasswordFailed')
        )
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
            {t('auth.resetPasswordTitle')}
          </h1>
          <p className="mb-6 text-center text-sm text-slate-600 dark:text-gray-400">
            {t('auth.resetPasswordSubtitle')}
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
                  autoComplete="email"
                  value={email}
                  onChange={(event) => {
                    if (!emailLocked) {
                      setEmail(event.target.value)
                    }
                  }}
                  readOnly={emailLocked}
                  aria-readonly={emailLocked}
                  className={emailLocked ? 'bg-slate-50 pl-10 dark:bg-gray-900/70' : 'pl-10'}
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-gray-300">
                {t('auth.newPassword')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-gray-300">
                {t('auth.confirmPassword')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={passwordConfirmation}
                  onChange={(event) => setPasswordConfirmation(event.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? t('auth.resettingPassword') : t('auth.resetPasswordSubmit')}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-slate-600 dark:text-gray-400">
            <Link to="/login" className="font-medium text-primary-600 hover:underline dark:text-primary-400">
              {t('auth.backToLogin')}
            </Link>
          </p>
        </CardContent>
      </Card>
    </motion.div>
  )
}
