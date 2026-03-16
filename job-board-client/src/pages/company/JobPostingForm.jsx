import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { JOB_TYPES } from '../../constants'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import toast from 'react-hot-toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useI18n } from '../../context/I18nContext'

export default function JobPostingForm({ initialForm, editingId, onClose }) {
  const queryClient = useQueryClient()
  const { t, tOption } = useI18n()
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/categories').then(({ data }) => setCategories(data)).catch(() => {})
  }, [])

  useEffect(() => {
    setForm(initialForm)
    setError('')
  }, [initialForm, editingId])

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  const mutation = useMutation({
    mutationFn: async (payload) => {
      if (editingId) {
        const { data } = await api.put(`/jobs/${editingId}`, payload)
        return data
      }
      const { data } = await api.post('/jobs', payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyJobs'] })
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      toast.success(editingId ? t('jobForm.jobUpdated') : t('jobForm.jobPosted'))
      onClose()
    },
    onError: (err) => {
      const validationErrors = err.response?.data?.errors
      const firstValidationMessage = validationErrors
        ? Object.values(validationErrors).flat().find(Boolean)
        : null
      setError(
        firstValidationMessage ||
          err.response?.data?.message ||
          t('jobForm.saveFailed')
      )
      toast.error(t('jobForm.saveFailed'))
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    
    // Client-side validation
    const min = Number(form.salary_min) || 0
    const max = Number(form.salary_max) || 0
    if (form.salary_min && form.salary_max && max < min) {
      setError(t('jobForm.maxSalaryError'))
      return
    }

    const payload = { ...form }
    if (payload.salary_min) payload.salary_min = Number(payload.salary_min)
    if (payload.salary_max) payload.salary_max = Number(payload.salary_max)
    if (!payload.expires_at) delete payload.expires_at

    mutation.mutate(payload)
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{editingId ? t('jobForm.editJob') : t('jobForm.newJob')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700 dark:border dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
              {error}
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-gray-300">
              {t('jobForm.title')} *
            </label>
            <Input name="title" required value={form.title} onChange={handleChange} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-gray-300">
              {t('jobForm.category')} *
            </label>
            <Select
              name="category_id"
              required
              value={form.category_id}
              onChange={handleChange}
            >
              <option value="">{t('jobForm.select')}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-gray-300">
              {t('jobForm.description')} *
            </label>
            <Textarea
              name="description"
              required
              value={form.description}
              onChange={handleChange}
              rows={4}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-gray-300">
              {t('jobForm.requirements')}
            </label>
            <Textarea
              name="requirements"
              value={form.requirements}
              onChange={handleChange}
              rows={3}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-gray-300">
                {t('jobForm.location')} *
              </label>
              <Input name="location" required value={form.location} onChange={handleChange} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-gray-300">
                {t('jobForm.jobType')} *
              </label>
              <Select
                name="job_type"
                value={form.job_type}
                onChange={handleChange}
              >
                {Object.entries(JOB_TYPES).map(([k, v]) => (
                  <option key={k} value={k}>{tOption('jobTypes', k, v)}</option>
                ))}
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-gray-300">
                {t('jobForm.workMode')}
              </label>
              <Select
                name="work_mode"
                value={form.work_mode}
                onChange={handleChange}
              >
                <option value="">{t('jobForm.notSpecified')}</option>
                <option value="remote">{tOption('workModes', 'remote', 'Remote')}</option>
                <option value="on_site">{tOption('workModes', 'on_site', 'On-site')}</option>
                <option value="hybrid">{tOption('workModes', 'hybrid', 'Hybrid')}</option>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-gray-300">
                {t('jobForm.experienceLevel')}
              </label>
              <Select
                name="experience_level"
                value={form.experience_level}
                onChange={handleChange}
              >
                <option value="">{t('jobForm.notSpecified')}</option>
                <option value="entry">{tOption('experience', 'entry', 'Entry')}</option>
                <option value="mid">{tOption('experience', 'mid', 'Mid')}</option>
                <option value="senior">{tOption('experience', 'senior', 'Senior')}</option>
                <option value="lead">{tOption('experience', 'lead', 'Lead')}</option>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-gray-300">
                {t('jobForm.salaryMin')}
              </label>
              <Input
                type="number"
                name="salary_min"
                value={form.salary_min}
                onChange={handleChange}
                min="0"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-gray-300">
                {t('jobForm.salaryMax')}
              </label>
              <Input
                type="number"
                name="salary_max"
                value={form.salary_max}
                onChange={handleChange}
                min="0"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-gray-300">
              {t('jobForm.expiresAt')}
            </label>
            <Input type="date" name="expires_at" value={form.expires_at} onChange={handleChange} />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? t('jobForm.saving') : t('jobForm.save')}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose}>
              {t('jobForm.cancel')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
