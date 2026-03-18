import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { KeyRound, Mail } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/axios'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useI18n } from '../context/I18nContext'

export default function VerifyEmail() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const location = useLocation()
  const resendEmailKey = 'verifyResendEmail'
  const resendUntilKey = 'verifyResendUntil'
  const pendingEmailKey = 'pendingVerificationEmail'
  const pendingUserIdKey = 'pendingVerificationUserId'
  const storedPendingEmail = localStorage.getItem(pendingEmailKey) || ''
  const storedResendEmail = localStorage.getItem(resendEmailKey) || ''
  const storedPendingUserId = localStorage.getItem(pendingUserIdKey) || ''
  const initialEmail =
    location.state?.email || storedPendingEmail || storedResendEmail || ''
  const initialUserId =
    location.state?.userId ||
    (storedPendingEmail && storedPendingEmail === initialEmail ? storedPendingUserId : '') ||
    ''

  const [email, setEmail] = useState(initialEmail)
  const [userId, setUserId] = useState(initialUserId)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const initialCooldownSeconds = Number(location.state?.initialCooldownSeconds || 0)

  const formattedCooldown = useMemo(() => {
    if (resendCooldown <= 0) return null
    const minutes = Math.floor(resendCooldown / 60)
    const seconds = resendCooldown % 60
    return `${minutes}:${String(seconds).padStart(2, '0')}`
  }, [resendCooldown])

  useEffect(() => {
    if (resendCooldown <= 0) return undefined
    const timer = window.setInterval(() => {
      setResendCooldown((value) => Math.max(0, value - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [resendCooldown])

  useEffect(() => {
    const storedEmail = localStorage.getItem(resendEmailKey)
    const storedUntil = Number(localStorage.getItem(resendUntilKey) || 0)
    if (storedEmail && storedEmail === initialEmail && storedUntil > Date.now()) {
      setResendCooldown(Math.ceil((storedUntil - Date.now()) / 1000))
    } else {
      localStorage.removeItem(resendEmailKey)
      localStorage.removeItem(resendUntilKey)
    }
  }, [initialEmail, resendEmailKey, resendUntilKey])

  useEffect(() => {
    if (!initialEmail || initialCooldownSeconds <= 0) return

    const storedEmail = localStorage.getItem(resendEmailKey)
    const storedUntil = Number(localStorage.getItem(resendUntilKey) || 0)

    if (storedEmail === initialEmail && storedUntil > Date.now()) {
      return
    }

    const until = Date.now() + initialCooldownSeconds * 1000
    localStorage.setItem(resendEmailKey, initialEmail)
    localStorage.setItem(resendUntilKey, String(until))
    setResendCooldown(initialCooldownSeconds)
  }, [initialCooldownSeconds, initialEmail, resendEmailKey, resendUntilKey])

  useEffect(() => {
    if (!email && storedResendEmail) {
      setEmail(storedResendEmail)
      localStorage.setItem(pendingEmailKey, storedResendEmail)
    }
  }, [email, storedResendEmail, pendingEmailKey])

  useEffect(() => {
    if (!userId && storedPendingUserId) {
      setUserId(storedPendingUserId)
      localStorage.setItem(pendingUserIdKey, storedPendingUserId)
    }
  }, [userId, storedPendingUserId, pendingUserIdKey])

  useEffect(() => {
    if (!email) return
    const storedEmail = localStorage.getItem(resendEmailKey)
    if (storedEmail && storedEmail !== email) {
      localStorage.removeItem(resendEmailKey)
      localStorage.removeItem(resendUntilKey)
      setResendCooldown(0)
    }
  }, [email, resendEmailKey, resendUntilKey])

  useEffect(() => {
    if (resendCooldown !== 0) return
    localStorage.removeItem(resendUntilKey)
    localStorage.removeItem(resendEmailKey)
  }, [resendCooldown, resendEmailKey, resendUntilKey])

  const handleVerify = async (e) => {
    e.preventDefault()
    setError('')
    if (code.length !== 6) {
      setError(t('auth.verifyCodeRequired'))
      return
    }
    setLoading(true)

    try {
      await api.post('/auth/verify-email', {
        email,
        code,
        user_id: userId || undefined,
      })
      localStorage.removeItem('pendingVerificationEmail')
      localStorage.removeItem(resendEmailKey)
      localStorage.removeItem(resendUntilKey)
      localStorage.removeItem(pendingUserIdKey)
      toast.success(t('auth.verifySuccess'), { duration: 5000 })
      navigate('/login', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || t('auth.verifyFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!email || resending || resendCooldown > 0) return
    setError('')
    setResending(true)

    try {
      const { data } = await api.post('/auth/email/verification-notification', {
        email,
        user_id: userId || undefined,
      })
      const resolvedEmail = data?.email || email
      const resolvedUserId = data?.user_id || userId

      if (resolvedEmail !== email) {
        setEmail(resolvedEmail)
      }
      if (resolvedUserId && String(resolvedUserId) !== String(userId || '')) {
        setUserId(String(resolvedUserId))
      }

      toast.success(data?.message || t('auth.verifyResent'), { duration: 5000 })
      setCode('')
      const retryAfterSeconds = Number(data?.retry_after_seconds || 60)
      const safeRetryAfterSeconds = Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
        ? retryAfterSeconds
        : 60
      const until = Date.now() + safeRetryAfterSeconds * 1000
      localStorage.setItem(resendEmailKey, resolvedEmail)
      localStorage.setItem(resendUntilKey, String(until))
      localStorage.setItem(pendingEmailKey, resolvedEmail)
      if (resolvedUserId) {
        localStorage.setItem(pendingUserIdKey, String(resolvedUserId))
      }
      setResendCooldown(safeRetryAfterSeconds)
    } catch (err) {
      const retryAfter = Number(err.response?.data?.retry_after_seconds || 0)
      if (retryAfter > 0) {
        const until = Date.now() + retryAfter * 1000
        localStorage.setItem(resendEmailKey, email)
        localStorage.setItem(resendUntilKey, String(until))
        localStorage.setItem(pendingEmailKey, email)
        if (userId) {
          localStorage.setItem(pendingUserIdKey, String(userId))
        }
        setResendCooldown(retryAfter)
      }
      setError(err.response?.data?.message || t('auth.verifyFailed'))
    } finally {
      setResending(false)
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
              <KeyRound className="h-6 w-6 text-white" />
            </div>
          </div>
          <h1 className="mb-2 text-center text-2xl font-semibold text-slate-900 dark:text-white">
            {t('auth.verifyTitle')}
          </h1>
          <p className="mb-6 text-center text-sm text-slate-600 dark:text-gray-400">
            {t('auth.verifySubtitle')}
          </p>
          <form onSubmit={handleVerify} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                {error}
              </div>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-gray-300">
                {t('auth.verifyEmail')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="email"
                  required
                  value={email}
                  readOnly
                  className="pl-10 text-slate-500 dark:text-gray-400"
                />
              </div>
              <div className="mt-2 text-xs text-slate-500 dark:text-gray-400">
                {t('auth.changeEmailHint')}{' '}
                <Link to="/register" className="font-medium text-primary-600 hover:underline dark:text-primary-400">
                  {t('auth.changeEmailLink')}
                </Link>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-gray-300">
                {t('auth.verifyCode')}
              </label>
              <Input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                minLength={6}
                maxLength={6}
                required
                value={code}
                onChange={(e) => {
                  const nextValue = e.target.value.replace(/\D/g, '').slice(0, 6)
                  setCode(nextValue)
                }}
                placeholder="000000"
              />
              <p className="mt-2 text-xs text-slate-500 dark:text-gray-400">{t('auth.verifyHelp')}</p>
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? t('auth.verifying') : t('auth.verifySubmit')}
            </Button>
          </form>
          <div className="mt-4 flex items-center justify-between text-sm text-slate-600 dark:text-gray-400">
            <span>{t('auth.verifyMissing')}</span>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || resendCooldown > 0 || !email}
              className="font-medium text-primary-600 hover:underline disabled:opacity-60 dark:text-primary-400"
            >
              {resending
                ? t('auth.resending')
                : resendCooldown > 0
                  ? `${t('auth.verifyResend')} (${formattedCooldown})`
                  : t('auth.verifyResend')}
            </button>
          </div>
          <p className="mt-4 text-center text-sm text-slate-600 dark:text-gray-400">
            {t('auth.alreadyVerified')}{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:underline dark:text-primary-400">
              {t('auth.logIn')}
            </Link>
          </p>
        </CardContent>
      </Card>
    </motion.div>
  )
}
