import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ExternalLink, MapPin, BriefcaseBusiness, Layers3 } from 'lucide-react'
import api from '../api/axios'
import { Card, CardContent } from '../components/ui/Card'
import CompanyLogo from '../components/CompanyLogo'
import JobCard from '../components/JobCard'
import JobCardSkeleton from '../components/JobCardSkeleton'
import { Button } from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'
import { useI18n } from '../context/I18nContext'

export default function CompanyPublic() {
  const { companySlug } = useParams()
  const { user } = useAuth()
  const { t } = useI18n()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [requestVersion, setRequestVersion] = useState(0)
  const applicationsQueryKey = ['myApplications', user?.id ?? 'guest']

  const { data: appliedJobsData } = useQuery({
    queryKey: applicationsQueryKey,
    queryFn: async () => {
      const { data } = await api.get('/my/applications?per_page=500')
      return data
    },
    enabled: user?.role === 'job_seeker',
  })

  useEffect(() => {
    setLoading(true)
    setLoadError(false)
    api
      .get(`/companies/${companySlug}`)
      .then(({ data: payload }) => setData(payload))
      .catch((err) => {
        setData(null)
        setLoadError(err?.response?.status !== 404)
      })
      .finally(() => setLoading(false))
  }, [companySlug, requestVersion])

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="h-14 w-14 rounded-xl bg-slate-100 dark:bg-gray-700" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-1/3 rounded bg-slate-100 dark:bg-gray-700" />
                <div className="h-4 w-1/2 rounded bg-slate-100 dark:bg-gray-700" />
              </div>
            </div>
          </CardContent>
        </Card>
        {[...Array(3)].map((_, index) => (
          <JobCardSkeleton key={index} />
        ))}
      </div>
    )
  }

  if (!data?.company) {
    if (loadError) {
      return (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-card dark:border-gray-700 dark:bg-gray-800">
          <p className="font-medium text-slate-700 dark:text-gray-100">{t('company.loadFailed')}</p>
          <p className="mt-1 text-slate-500 dark:text-gray-400">{t('company.loadFailedHint')}</p>
          <Button type="button" className="mt-4" onClick={() => setRequestVersion((value) => value + 1)}>
            {t('common.retry')}
          </Button>
        </div>
      )
    }

    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-card dark:border-gray-700 dark:bg-gray-800">
        <p className="font-medium text-slate-700 dark:text-gray-100">{t('company.notFound')}</p>
        <p className="mt-1 text-slate-500 dark:text-gray-400">{t('company.notFoundHint')}</p>
        <Button asChild className="mt-4">
          <Link to="/">{t('publicProfile.browseJobs')}</Link>
        </Button>
      </div>
    )
  }

  const company = data.company
  const jobs = data.jobs || []
  const appliedIds = new Set(
    user?.role === 'job_seeker' ? (appliedJobsData?.data || []).map((application) => application.job_id) : []
  )

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <Card className="overflow-hidden border-slate-200/80 shadow-soft dark:border-gray-800 dark:bg-gray-800">
        <div className="h-32 bg-gradient-to-r from-primary-600 via-primary-700 to-slate-900 sm:h-48" />
        <CardContent className="relative p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-4 sm:-mt-16 sm:flex-row sm:items-end">
              <div className="inline-block rounded-2xl bg-white p-2 shadow-sm ring-1 ring-slate-200 dark:bg-gray-800 dark:ring-gray-700">
                <CompanyLogo company={company} size="xl" rounded="xl" className="h-24 w-24 sm:h-32 sm:w-32" />
              </div>
              <div className="min-w-0 space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-gray-100">
                  {company.name}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-gray-400">
                  {company.location && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      {company.location}
                    </span>
                  )}
                  {company.industry && (
                    <span className="inline-flex items-center gap-1.5">
                      <Layers3 className="h-4 w-4" />
                      {company.industry}
                    </span>
                  )}
                  {company.website && (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 font-medium text-primary-600 transition-colors hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {t('company.website')}
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="rounded-xl bg-slate-50 px-4 py-3 text-center shadow-sm ring-1 ring-slate-200 dark:bg-gray-900 dark:ring-gray-700">
                <span className="block text-2xl font-bold text-primary-600 dark:text-primary-400">{jobs.length}</span>
                <span className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-gray-400">
                  {t('company.openRoles')}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-6 border-t border-slate-200 pt-8 dark:border-gray-700 lg:grid-cols-[1.4fr_0.8fr]">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-gray-100">{t('company.about')}</h2>
              {company.description ? (
                <div className="mt-3 max-w-3xl whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-gray-300">
                  {company.description}
                </div>
              ) : (
                <p className="mt-3 text-sm italic text-slate-500 dark:text-gray-500">{t('company.noDescription')}</p>
              )}
            </div>
            <div className="space-y-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-900/50">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-gray-400">
                  {t('company.snapshot')}
                </p>
                <div className="mt-3 space-y-2 text-sm text-slate-700 dark:text-gray-300">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5">
                      <BriefcaseBusiness className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                      {t('company.openRoles')}
                    </span>
                    <span className="font-semibold">{jobs.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{t('company.industry')}</span>
                    <span className="font-semibold">{company.industry || t('company.notSpecified')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{t('company.location')}</span>
                    <span className="font-semibold">{company.location || t('company.remoteFlexible')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="border-b border-slate-200 pb-3 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-gray-100">{t('company.openRolesTitle')}</h2>
        </div>
        {jobs.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-card dark:border-gray-700 dark:bg-gray-800">
            <p className="font-medium text-slate-700 dark:text-gray-100">{t('company.noOpenJobs')}</p>
            <p className="mt-1 text-slate-500 dark:text-gray-400">{t('company.checkBack')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job, index) => (
              <JobCard
                key={job.id}
                job={job}
                index={index}
                showBookmark={false}
                user={user}
                applied={appliedIds.has(job.id)}
              />
            ))}
          </div>
        )}
      </section>
    </motion.div>
  )
}
