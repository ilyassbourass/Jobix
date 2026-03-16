import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { MapPin, Building2, DollarSign, Bookmark } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { JOB_TYPES } from '../constants'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import CompanyLogo from '../components/CompanyLogo'
import JobCard from '../components/JobCard'
import PostedTime from '../components/PostedTime'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Textarea } from '../components/ui/Textarea'
import { useI18n } from '../context/I18nContext'

export default function JobDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const { t, tOption } = useI18n()
  const applicationsQueryKey = ['myApplications', user?.id ?? 'guest']
  const savedJobsQueryKey = ['savedJobs', user?.id ?? 'guest']
  const [coverLetter, setCoverLetter] = useState('')
  const [resumeFile, setResumeFile] = useState(null)
  const savedResumeName = user?.resume_filename || null
  const hasSavedResume = Boolean(user?.has_resume && savedResumeName)

  const { data: job, isLoading: loading } = useQuery({
    queryKey: ['job', id],
    queryFn: async () => {
      const { data } = await api.get(`/jobs/${id}`)
      return data
    },
    retry: 1,
  })

  const { data: appliedJobsData } = useQuery({
    queryKey: applicationsQueryKey,
    queryFn: async () => {
      const { data } = await api.get('/my/applications?per_page=500')
      return data
    },
    enabled: user?.role === 'job_seeker',
  })

  const appliedJobIds = new Set((appliedJobsData?.data || []).map((application) => application.job_id))
  const applied = job ? appliedJobIds.has(job.id) : false

  const { data: savedJobsData } = useQuery({
    queryKey: savedJobsQueryKey,
    queryFn: async () => {
      const { data } = await api.get('/saved-jobs?per_page=100')
      return data
    },
    enabled: user?.role === 'job_seeker',
  })

  const savedJobIds = new Set((savedJobsData?.data || []).map((savedJob) => savedJob.id))
  const saved = job ? savedJobIds.has(job.id) : false

  const { data: relatedJobsData } = useQuery({
    queryKey: ['relatedJobs', job?.category_id],
    queryFn: async () => {
      if (!job) return { data: [] }
      const params = new URLSearchParams()
      params.set('per_page', 10)
      if (job.category_id) params.set('category_id', job.category_id)
      const { data } = await api.get(`/jobs?${params}`)
      return data
    },
    enabled: !!job,
  })

  const relatedJobs = (relatedJobsData?.data || []).filter((item) => item.id !== job?.id).slice(0, 3)
  const queryClient = useQueryClient()

  const applyMutation = useMutation({
    mutationFn: async (formData) => api.post('/applications', formData),
    onSuccess: () => {
      toast.success(t('job.applicationSubmitted'))
      setCoverLetter('')
      setResumeFile(null)
      queryClient.invalidateQueries({ queryKey: ['myApplications'] })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || t('job.applyFailed'))
    },
  })

  const saveMutation = useMutation({
    mutationFn: async ({ jobId, nextSaved }) => {
      if (nextSaved) await api.post(`/jobs/${jobId}/save`)
      else await api.delete(`/jobs/${jobId}/save`)
    },
    onMutate: async ({ jobId, nextSaved }) => {
      await queryClient.cancelQueries({ queryKey: savedJobsQueryKey })
      const previousSaved = queryClient.getQueryData(savedJobsQueryKey)

      queryClient.setQueryData(savedJobsQueryKey, (old) => {
        if (!old) return old
        const newData = [...(old.data || [])]
        if (nextSaved) {
          newData.push({ id: jobId })
        } else {
          const idx = newData.findIndex((savedJob) => savedJob.id === jobId)
          if (idx >= 0) newData.splice(idx, 1)
        }
        return { ...old, data: newData }
      })

      return { previousSaved }
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(savedJobsQueryKey, context?.previousSaved)
      toast.error(t('job.saveFailed'))
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: savedJobsQueryKey })
    },
  })

  const handleApply = (e) => {
    e.preventDefault()
    if (!user || !job) return

    const formData = new FormData()
    formData.append('job_id', String(job.id))
    if (coverLetter) formData.append('cover_letter', coverLetter)
    if (resumeFile) formData.append('resume', resumeFile)
    applyMutation.mutate(formData)
  }

  const handleToggleSaved = () => {
    if (!job || user?.role !== 'job_seeker') return
    saveMutation.mutate({ jobId: job.id, nextSaved: !saved })
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="py-12 text-center text-slate-500 dark:text-gray-400">{t('job.jobNotFound')}</div>
    )
  }

  const salaryText =
    (job.salary_min || job.salary_max) &&
    `$${Number(job.salary_min || 0).toLocaleString()} - $${Number(job.salary_max || 0).toLocaleString()}`
  const companyPublicPath = job.company?.slug || job.company?.id

  const isAdmin = user?.role === 'admin'
  const showApplySection = user?.role === 'job_seeker' && !isAdmin

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-4xl">
      <Card className="overflow-hidden dark:border-gray-700 dark:bg-gray-800">
        <div className="border-b border-slate-200 bg-slate-50/50 p-6 dark:border-gray-700 dark:bg-gray-800/50">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <CompanyLogo company={job.company} size="lg" rounded="xl" className="shrink-0" />
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-gray-100">{job.title}</h1>
              {companyPublicPath ? (
                <Link
                  to={`/companies/${companyPublicPath}`}
                  className="mt-1 inline-flex items-center gap-2 font-medium text-primary-600 transition hover:underline dark:text-primary-400"
                >
                  <Building2 className="h-4 w-4" />
                  {job.company?.name}
                </Link>
              ) : (
                <p className="mt-1 flex items-center gap-2 font-medium text-primary-600 dark:text-primary-400">
                  <Building2 className="h-4 w-4" />
                  {job.company?.name}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-gray-400">
                  <MapPin className="h-4 w-4" />
                  {job.location}
                </span>
                <PostedTime publishedAt={job.published_at} />
                <Badge variant="secondary">
                  {tOption('jobTypes', job.job_type, JOB_TYPES[job.job_type] || job.job_type)}
                </Badge>
                {(job.work_mode || job.job_type === 'remote') && (
                  <Badge variant="outline">
                    {tOption(
                      'workModes',
                      job.work_mode || (job.job_type === 'remote' ? 'remote' : null),
                      job.job_type === 'remote' ? 'Remote' : job.work_mode
                    )}
                  </Badge>
                )}
                {job.experience_level && (
                  <Badge variant="outline">
                    {tOption('experience', job.experience_level, job.experience_level)}
                  </Badge>
                )}
                {job.category?.name && <Badge variant="outline">{job.category.name}</Badge>}
              </div>
              {salaryText && (
                <div className="mt-2 flex items-center gap-2 text-slate-700 dark:text-gray-300">
                  <DollarSign className="h-4 w-4" />
                  <span className="font-medium">{salaryText}</span>
                </div>
              )}
              {showApplySection && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {applied && (
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                      {t('job.alreadyApplied')}
                    </span>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant={saved ? 'secondary' : 'outline'}
                    onClick={handleToggleSaved}
                    disabled={saveMutation.isPending}
                    className="gap-2"
                  >
                    <Bookmark className={`h-4 w-4 ${saved ? 'fill-current' : ''}`} />
                    {saved ? t('job.saved') : t('job.save')}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
        <CardContent className="p-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-gray-100">{t('job.description')}</h2>
              <div className="prose prose-slate max-w-none whitespace-pre-wrap text-slate-700 dark:text-gray-300">
                {job.description}
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card dark:border-gray-700 dark:bg-gray-800">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-gray-100">{t('job.jobDetails')}</h3>
                <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-gray-400">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-500 dark:text-gray-500">{t('labels.type')}</span>
                    <span className="font-medium">
                      {tOption('jobTypes', job.job_type, JOB_TYPES[job.job_type] || job.job_type)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-500 dark:text-gray-500">{t('labels.location')}</span>
                    <span className="font-medium">{job.location}</span>
                  </div>
                  {(job.work_mode || job.job_type === 'remote') && (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-500 dark:text-gray-500">{t('labels.workMode')}</span>
                      <span className="font-medium">
                        {tOption(
                          'workModes',
                          job.work_mode || (job.job_type === 'remote' ? 'remote' : null),
                          job.job_type === 'remote' ? 'Remote' : job.work_mode
                        )}
                      </span>
                    </div>
                  )}
                  {job.experience_level && (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-500 dark:text-gray-500">{t('labels.experience')}</span>
                      <span className="font-medium">
                        {tOption('experience', job.experience_level, job.experience_level)}
                      </span>
                    </div>
                  )}
                  {salaryText && (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-500 dark:text-gray-500">{t('labels.salary')}</span>
                      <span className="font-medium">{salaryText}</span>
                    </div>
                  )}
                </div>
              </div>

              {job.requirements && (
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card dark:border-gray-700 dark:bg-gray-800">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-gray-100">{t('job.requirements')}</h3>
                  <div className="mt-2 whitespace-pre-wrap text-sm text-slate-600 dark:text-gray-400">
                    {job.requirements}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {showApplySection && (
        <Card className="mt-6 dark:border-gray-700 dark:bg-gray-800">
          <CardHeader>
            <CardTitle>{t('job.applyFor')}</CardTitle>
          </CardHeader>
          <CardContent>
            {applied ? (
              <p className="font-medium text-emerald-600 dark:text-emerald-400">
                {t('job.appliedSuccess')}
              </p>
            ) : (
              <form onSubmit={handleApply} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-gray-300">
                    {hasSavedResume ? t('job.uploadDifferentResume') : t('job.resumeOptional')}
                  </label>
                  {hasSavedResume && (
                    <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
                      {t('job.savedResumeHint', { name: savedResumeName })}
                    </div>
                  )}
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                    className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-slate-900 hover:file:bg-slate-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:file:bg-gray-700 dark:file:text-gray-200"
                  />
                  {resumeFile && (
                    <p className="mt-2 text-sm text-slate-500 dark:text-gray-400">
                      {t('job.selected', { name: resumeFile.name })}
                    </p>
                  )}
                  {!resumeFile && hasSavedResume && (
                    <p className="mt-2 text-sm text-slate-500 dark:text-gray-400">
                      {t('job.noExtraUpload')}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-gray-300">
                    {t('job.coverLetter')}
                  </label>
                  <Textarea
                    placeholder={t('job.coverLetterPlaceholder')}
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    rows={4}
                  />
                </div>
                <Button type="submit" disabled={applyMutation.isPending}>
                  {applyMutation.isPending ? t('job.applying') : t('job.submit')}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {!user && (
        <p className="mt-6 text-slate-600 dark:text-gray-400">
          <Link to="/login" className="font-medium text-primary-600 hover:underline dark:text-primary-400">
            {t('job.login')}
          </Link>{' '}
          {t('job.or')}{' '}
          <Link to="/register" className="font-medium text-primary-600 hover:underline dark:text-primary-400">
            {t('job.register')}
          </Link>{' '}
          {t('job.toApply')}
        </p>
      )}

      {relatedJobs.length > 0 && (
        <div className="mt-12">
          <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-gray-100">{t('job.relatedJobs')}</h2>
          <div className="space-y-4">
            {relatedJobs.map((relatedJob, index) => (
              <JobCard
                key={relatedJob.id}
                job={relatedJob}
                index={index}
                showBookmark={user?.role === 'job_seeker'}
                user={user}
                applied={appliedJobIds.has(relatedJob.id)}
              />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}
