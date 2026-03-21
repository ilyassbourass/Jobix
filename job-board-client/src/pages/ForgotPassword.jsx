import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Briefcase, Mail } from 'lucide-react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useI18n } from '../context/I18nContext'

export default function ForgotPassword() {
  const { user } = useAuth()
  const { t } = useI18n()
  const cooldownEmailKey = 'forgotPasswordEmail'
  const cooldownUntilKey = 'forgotPasswordUntil'
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  const normalizedEmail = email.trim().toLowerCase()
  const formattedCooldown = useMemo(() => {
    if (cooldown <= 0) return null
    const minutes = Math.floor(cooldown / 60)
    const seconds = cooldown % 60
    return `${minutes}:${String(seconds).padStart(2, '0')}`
  }, [cooldown])

  useEffect(() => {
    if (cooldown <= 0) return undefined
    const timer = window.setInterval(() => {
      setCooldown((value) => Math.max(0, value - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [cooldown])

  useEffect(() => {
    if (!normalizedEmail) {
      setCooldown(0)
      return
    }

    const storedEmail = localStorage.getItem(cooldownEmailKey)
    const storedUntil = Number(localStorage.getItem(cooldownUntilKey) || 0)

    if (storedEmail === normalizedEmail && storedUntil > Date.now()) {
      setCooldown(Math.ceil((storedUntil - Date.now()) / 1000))
      return
    }

    setCooldown(0)
  }, [normalizedEmail])

  useEffect(() => {
    if (cooldown !== 0) return

    const storedEmail = localStorage.getItem(cooldownEmailKey)
    const storedUntil = Number(localStorage.getItem(cooldownUntilKey) || 0)
    if (storedEmail === normalizedEmail && storedUntil <= Date.now()) {
      localStorage.removeItem(cooldownEmailKey)
      localStorage.removeItem(cooldownUntilKey)
    }
  }, [cooldown, normalizedEmail])

  if (user) return <Navigate to="/" replace />

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (loading || cooldown > 0) return

    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const { data } = await api.post('/auth/forgot-password', { email: normalizedEmail })
      setSuccess(data?.message || t('auth.forgotPasswordSuccess'))
      const until = Date.now() + 60 * 1000
      localStorage.setItem(cooldownEmailKey, normalizedEmail)
      localStorage.setItem(cooldownUntilKey, String(until))
      setCooldown(60)
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.errors?.email?.[0] ||
        t('auth.forgotPasswordFailed')
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
            {t('auth.forgotPasswordTitle')}
          </h1>
          <p className="mb-6 text-center text-sm text-slate-600 dark:text-gray-400">
            {t('auth.forgotPasswordSubtitle')}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                {success}
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
                  onChange={(event) => setEmail(event.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Button type="submit" disabled={loading || cooldown > 0} className="w-full">
              {loading
                ? t('auth.sendingResetLink')
                : cooldown > 0
                  ? `${t('auth.sendResetLink')} (${formattedCooldown})`
                  : t('auth.sendResetLink')}
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
