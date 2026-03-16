import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ShieldCheck, Sparkles, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/axios'
import { JOB_TYPES } from '../constants'
import JobCard from '../components/JobCard'
import JobCardSkeleton from '../components/JobCardSkeleton'
import SearchBar from '../components/SearchBar'
import { Button } from '../components/ui/Button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import PageHeader from '../components/PageHeader'
import { useI18n } from '../context/I18nContext'

export default function Home() {
  const { user } = useAuth()
  const { t } = useI18n()
  const isJobSeeker = user?.role === 'job_seeker'
  const isCompany = user?.role === 'company'
  const savedJobsQueryKey = ['savedJobs', user?.id ?? 'guest']
  const applicationsQueryKey = ['myApplications', user?.id ?? 'guest']
  const initialFilters = {
    search: '',
    category_id: '',
    location: '',
    job_type: '',
    salary_min: '',
    salary_max: '',
    work_mode: '',
    experience_level: '',
    page: 1,
  }
  const [draftFilters, setDraftFilters] = useState(initialFilters)
  const [filters, setFilters] = useState(initialFilters)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setFilters((current) => {
        const nextFilters = { ...draftFilters, page: 1 }

        return JSON.stringify(current) === JSON.stringify(nextFilters)
          ? current
          : nextFilters
      })
    }, 350)

    return () => window.clearTimeout(timeoutId)
  }, [draftFilters])

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get('/categories')
      return data
    },
  })

  const { data: jobsResponse, isLoading: loading, isError: jobsError, refetch: refetchJobs } = useQuery({
    queryKey: ['jobs', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.search) params.set('search', filters.search)
      if (filters.category_id) params.set('category_id', filters.category_id)
      if (filters.location) params.set('location', filters.location)
      if (filters.job_type) params.set('job_type', filters.job_type)
      if (filters.salary_min) params.set('salary_min', filters.salary_min)
      if (filters.salary_max) params.set('salary_max', filters.salary_max)
      if (filters.work_mode) params.set('work_mode', filters.work_mode)
      if (filters.experience_level) params.set('experience_level', filters.experience_level)
      params.set('page', filters.page)
      const { data } = await api.get(`/jobs?${params}`)
      return data
    },
    keepPreviousData: true,
  })

  const jobs = jobsResponse || { data: [], current_page: 1, last_page: 1, total: 0 }
  const hasJobsData = Array.isArray(jobsResponse?.data) && jobsResponse.data.length > 0

  const { data: savedJobsData } = useQuery({
    queryKey: savedJobsQueryKey,
    queryFn: async () => {
      const { data } = await api.get('/saved-jobs?per_page=100')
      return data
    },
    enabled: isJobSeeker,
  })

  const savedIds = new Set((savedJobsData?.data || []).map((job) => job.id))

  const { data: appliedJobsData } = useQuery({
    queryKey: applicationsQueryKey,
    queryFn: async () => {
      const { data } = await api.get('/my/applications?per_page=500')
      return data
    },
    enabled: isJobSeeker,
  })

  const appliedIds = new Set((appliedJobsData?.data || []).map((application) => application.job_id))

  const { data: companyJobsData } = useQuery({
    queryKey: ['companyJobsSummary', user?.id ?? 'guest'],
    queryFn: async () => {
      const { data } = await api.get('/my/jobs')
      return data
    },
    enabled: isCompany,
  })

  const companyJobsCount = companyJobsData?.total ?? companyJobsData?.data?.length ?? 0
  const thirdStatValue = isJobSeeker ? appliedIds.size : isCompany ? companyJobsCount : savedIds.size
  const thirdStatLabel = isJobSeeker
    ? t('home.stats.applications')
    : isCompany
      ? t('home.stats.openRoles')
      : t('home.stats.savedRoles')
  const queryClient = useQueryClient()

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
          const idx = newData.findIndex((job) => job.id === jobId)
          if (idx >= 0) newData.splice(idx, 1)
        }
        return { ...old, data: newData }
      })

      return { previousSaved }
    },
    onError: (err, newTodo, context) => {
      queryClient.setQueryData(savedJobsQueryKey, context.previousSaved)
      toast.error(t('job.saveFailed'))
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['savedJobs'] })
    },
  })

  const toggleSaved = (jobId, nextSaved) => {
    if (!user) return
    saveMutation.mutate({ jobId, nextSaved })
  }

  return (
    <div>
      <PageHeader
        title={t('home.title')}
        description={t('home.description')}
      />

      <div className="mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-primary-50 shadow-soft dark:border-gray-800 dark:from-gray-900 dark:via-gray-900 dark:to-primary-950/40">
        <div className="grid gap-8 px-6 py-8 lg:grid-cols-[1.3fr_0.9fr] lg:px-8">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary-700 dark:border-primary-900 dark:bg-gray-900/70 dark:text-primary-300">
              <Sparkles className="h-3.5 w-3.5" />
              {t('home.badge')}
            </div>
            <div>
              <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                {t('home.heroTitle')}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-gray-400 sm:text-base">
                {t('home.heroDescription')}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
                <p className="text-2xl font-bold text-slate-950 dark:text-white">{jobs.total || jobs.data.length}</p>
                <p className="text-sm text-slate-500 dark:text-gray-400">{t('home.stats.liveJobs')}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
                <p className="text-2xl font-bold text-slate-950 dark:text-white">{categories.length}</p>
                <p className="text-sm text-slate-500 dark:text-gray-400">{t('home.stats.categories')}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
                <p className="text-2xl font-bold text-slate-950 dark:text-white">
                  {thirdStatValue}
                </p>
                <p className="text-sm text-slate-500 dark:text-gray-400">
                  {thirdStatLabel}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <ShieldCheck className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              <p className="mt-3 font-semibold text-slate-900 dark:text-white">{t('home.features.presentationTitle')}</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">
                {t('home.features.presentationDesc')}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <Building2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <p className="mt-3 font-semibold text-slate-900 dark:text-white">{t('home.features.multiRoleTitle')}</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">
                {t('home.features.multiRoleDesc')}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <p className="mt-3 font-semibold text-slate-900 dark:text-white">{t('home.features.uxTitle')}</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">
                {t('home.features.uxDesc')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <SearchBar
          filters={draftFilters}
          onFiltersChange={setDraftFilters}
          categories={categories}
          jobTypes={JOB_TYPES}
        />
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <JobCardSkeleton key={i} />
          ))}
        </div>
      ) : jobsError && !hasJobsData ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-card dark:border-gray-700 dark:bg-gray-800">
          <p className="font-medium text-slate-700 dark:text-gray-200">{t('home.loadFailed')}</p>
          <p className="mt-1 text-slate-500 dark:text-gray-400">{t('home.loadFailedHint')}</p>
          <Button type="button" className="mt-4" onClick={() => refetchJobs()}>
            {t('common.retry')}
          </Button>
        </div>
      ) : jobs.data.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-card dark:border-gray-700 dark:bg-gray-800">
          <p className="text-slate-500 dark:text-gray-400">{t('home.empty')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.data.map((job, index) => (
            <JobCard
              key={job.id}
              job={job}
              index={index}
              saved={savedIds.has(job.id)}
              onToggleSaved={(next) => toggleSaved(job.id, next)}
              showBookmark={user?.role === 'job_seeker'}
              user={user}
              applied={appliedIds.has(job.id)}
            />
          ))}
        </div>
      )}

      {jobs.last_page > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={jobs.current_page === 1}
            onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
          >
            <ChevronLeft className="h-4 w-4" />
            {t('home.pagination.previous')}
          </Button>
          <span className="px-4 text-sm text-slate-600 dark:text-gray-400">
            {t('home.pagination.page', { current: jobs.current_page, total: jobs.last_page })}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={jobs.current_page === jobs.last_page}
            onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
          >
            {t('home.pagination.next')}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
