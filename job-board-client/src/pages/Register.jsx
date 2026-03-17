import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Briefcase } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import { useI18n } from '../context/I18nContext'

export default function Register() {
  const { user, register } = useAuth()
  const { t } = useI18n()
  const [role, setRole] = useState('job_seeker')
  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    password_confirmation: '',
    phone: '',
    company_name: '',
    company_description: '',
    company_website: '',
    company_location: '',
    company_industry: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/" replace />

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleUsernameChange = (e) => {
    const { value } = e.target
    setForm((prev) => ({
      ...prev,
      username: value.replace(/[^a-zA-Z0-9]/g, '').toLowerCase(),
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.username.trim()) {
      setError(t('auth.usernameRequired'))
      return
    }

    setLoading(true)

    try {
      const payload = {
        name: form.name,
        username: form.username.trim(),
        email: form.email,
        password: form.password,
        password_confirmation: form.password_confirmation,
        role,
        phone: form.phone || undefined,
      }

      if (role === 'company') {
        payload.company_name = form.company_name
        payload.company_description = form.company_description
        payload.company_website = form.company_website || undefined
        payload.company_location = form.company_location
        payload.company_industry = form.company_industry
      }

      await register(payload)
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        t('auth.registerFailed')
      const errors = err.response?.data?.errors
      setError(errors ? Object.values(errors).flat().join(' ') : msg)
    } finally {
      setLoading(false)
    }
  }

  const labelClass = 'mb-1 block text-sm font-medium text-slate-700 dark:text-gray-300'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-xl"
    >
      <Card className="border-slate-200/80 shadow-soft dark:border-gray-800">
        <CardContent className="p-8">
          <div className="mb-6 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 shadow-sm">
              <Briefcase className="h-6 w-6 text-white" />
            </div>
          </div>
          <h1 className="mb-2 text-center text-2xl font-semibold text-slate-900 dark:text-white">
            {t('auth.signupTitle')}
          </h1>
          <p className="mb-6 text-center text-sm text-slate-600 dark:text-gray-400">
            {t('auth.signupSubtitle')}
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                {error}
              </div>
            )}
            <div>
              <label className={labelClass}>{t('auth.iam')}</label>
              <Select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="job_seeker">{t('auth.jobSeeker')}</option>
                <option value="company">{t('auth.company')}</option>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>{t('auth.name')}</label>
                <Input
                  name="name"
                  required
                  autoComplete="name"
                  value={form.name}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className={labelClass}>{t('auth.username')}</label>
                <Input
                  id="username"
                  name="username"
                  autoComplete="nickname"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  required
                  value={form.username}
                  onChange={handleUsernameChange}
                  placeholder={t('auth.usernamePlaceholder')}
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">
                  {t('auth.usernameHint')}
                </p>
              </div>
              <div>
                <label className={labelClass}>{t('auth.email')}</label>
                <Input
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className={labelClass}>{t('auth.password')}</label>
                <Input
                  type="password"
                  name="password"
                  required
                  autoComplete="new-password"
                  value={form.password}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className={labelClass}>{t('auth.confirmPassword')}</label>
                <Input
                  type="password"
                  name="password_confirmation"
                  required
                  autoComplete="new-password"
                  value={form.password_confirmation}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>{t('auth.phoneOptional')}</label>
              <Input
                name="phone"
                autoComplete="tel"
                value={form.phone}
                onChange={handleChange}
              />
            </div>

            {role === 'company' && (
              <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-gray-800 dark:bg-gray-900/50">
                <div>
                  <label className={labelClass}>{t('auth.companyName')}</label>
                  <Input
                    name="company_name"
                    required
                    autoComplete="organization"
                    value={form.company_name}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className={labelClass}>{t('auth.companyDescription')}</label>
                  <Textarea
                    name="company_description"
                    value={form.company_description}
                    onChange={handleChange}
                    rows={3}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>{t('auth.website')}</label>
                    <Input
                      type="url"
                      name="company_website"
                      autoComplete="url"
                      value={form.company_website}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>{t('auth.location')}</label>
                    <Input
                      name="company_location"
                      value={form.company_location}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>{t('auth.industry')}</label>
                  <Input
                    name="company_industry"
                    value={form.company_industry}
                    onChange={handleChange}
                  />
                </div>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? t('auth.creatingAccount') : t('auth.signUp')}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-600 dark:text-gray-400">
            {t('auth.alreadyHaveAccount')}{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:underline dark:text-primary-400">
              {t('auth.logIn')}
            </Link>
          </p>
        </CardContent>
      </Card>
    </motion.div>
  )
}
