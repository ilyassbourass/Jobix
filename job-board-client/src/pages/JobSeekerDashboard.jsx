import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Briefcase, Bookmark, CheckCircle2, FileText, UserCircle, ArrowRight, Copy, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { APPLICATION_STATUS } from '../constants'
import { useI18n } from '../context/I18nContext'

function getStatusVariant(status) {
  if (status === 'accepted') return 'success'
  if (status === 'rejected') return 'destructive'
  return 'secondary'
}

export default function JobSeekerDashboard() {
  const { user } = useAuth()
  const { t, tOption, locale } = useI18n()
  const savedJobsQueryKey = ['savedJobs', user?.id ?? 'guest']
  const applicationsQueryKey = ['myApplications', user?.id ?? 'guest']

  const {
    data: savedJobsData,
    isError: savedJobsError,
    refetch: refetchSavedJobs,
  } = useQuery({
    queryKey: savedJobsQueryKey,
    queryFn: async () => {
      const { data } = await api.get('/saved-jobs?per_page=100')
      return data
    },
    enabled: user?.role === 'job_seeker',
  })

  const {
    data: applicationsData,
    isError: applicationsError,
    refetch: refetchApplications,
  } = useQuery({
    queryKey: applicationsQueryKey,
    queryFn: async () => {
      const { data } = await api.get('/my/applications?per_page=20')
      return data
    },
    enabled: user?.role === 'job_seeker',
  })

  if (!user) return null
  const hasLoadError = savedJobsError || applicationsError

  const savedJobs = savedJobsData?.data || []
  const applications = applicationsData?.data || []
  const acceptedCount = applications.filter((app) => app.status === 'accepted').length
  const publicProfilePath = user.username ? `/public-profile/${user.username}` : null
  const publicProfileUrl =
    publicProfilePath && typeof window !== 'undefined'
      ? `${window.location.origin}${publicProfilePath}`
      : publicProfilePath
  const professionalLinksCount = [user.linkedin_url, user.github_url, user.portfolio_url].filter(Boolean).length

  const profileFields = [
    user.name,
    user.username,
    user.bio,
    user.skills,
    user.location,
    user.linkedin_url,
    user.github_url,
    user.portfolio_url,
    user.resume_path || user.has_resume,
  ]
  const completedFields = profileFields.filter(Boolean).length
  const completion = Math.round((completedFields / profileFields.length) * 100)
  const hasResume = Boolean(user.resume_path || user.has_resume)

  const completionTips = [
    !user.bio && t('dashboard.tips.addBio'),
    !user.skills && t('dashboard.tips.addSkills'),
    !user.linkedin_url && t('dashboard.tips.addLinkedIn'),
    !user.portfolio_url && t('dashboard.tips.addPortfolio'),
    !(user.resume_path || user.has_resume) && t('dashboard.tips.uploadResume'),
  ].filter(Boolean)

  const copyPublicProfileLink = async () => {
    if (!publicProfileUrl) return

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(publicProfileUrl)
      } else {
        const input = document.createElement('input')
        input.value = publicProfileUrl
        document.body.appendChild(input)
        input.select()
        document.execCommand('copy')
        input.remove()
      }

      toast.success(t('dashboard.linkCopied'))
    } catch {
      toast.error(t('dashboard.linkCopyError'))
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={t('dashboard.title')}
        description={t('dashboard.description')}
        actions={
          <Button asChild>
            <Link to="/profile">{t('dashboard.editProfile')}</Link>
          </Button>
        }
      />

      {hasLoadError && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
          <span>{t('dashboard.loadFailed')}</span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              refetchSavedJobs()
              refetchApplications()
            }}
          >
            {t('common.retry')}
          </Button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t('dashboard.stats.profileCompletion')}
          value={`${completion}%`}
          icon={UserCircle}
          accentClass="text-primary-600 dark:text-primary-300"
        />
        <StatCard
          label={t('dashboard.stats.applicationsSent')}
          value={applications.length}
          icon={Briefcase}
          accentClass="text-amber-600 dark:text-amber-300"
        />
        <StatCard
          label={t('dashboard.stats.savedJobs')}
          value={savedJobs.length}
          icon={Bookmark}
          accentClass="text-emerald-600 dark:text-emerald-300"
        />
        <StatCard
          label={t('dashboard.stats.accepted')}
          value={acceptedCount}
          icon={CheckCircle2}
          accentClass="text-blue-600 dark:text-blue-300"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>{t('dashboard.profileReadiness')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-gray-400">{t('dashboard.completionScore')}</span>
                <span className="font-semibold text-slate-900 dark:text-white">{completion}%</span>
              </div>
              <div className="h-3 rounded-full bg-slate-100 dark:bg-gray-700">
                <div
                  className="h-3 rounded-full bg-primary-600 transition-all"
                  style={{ width: `${completion}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              {completionTips.length > 0 ? (
                completionTips.slice(0, 4).map((tip) => (
                  <div
                    key={tip}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-300"
                  >
                    {tip}
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                  {t('dashboard.profileReady')}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('dashboard.recentApplications')}</CardTitle>
          </CardHeader>
          <CardContent>
            {applications.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-gray-700">
                <p className="font-medium text-slate-800 dark:text-gray-100">{t('dashboard.noApplications')}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">
                  {t('dashboard.noApplicationsHint')}
                </p>
                <Button asChild className="mt-4">
                  <Link to="/">{t('dashboard.browseJobs')}</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {applications.slice(0, 5).map((application) => (
                  <Link
                    key={application.id}
                    to={`/jobs/${application.job?.id}`}
                    className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-primary-200 hover:bg-slate-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600 dark:hover:bg-gray-800/80 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-white">{application.job?.title}</p>
                      <p className="text-sm text-slate-500 dark:text-gray-400">
                        {application.job?.company?.name || t('dashboard.unknownCompany')}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={getStatusVariant(application.status)}>
                        {tOption(
                          'applicationStatus',
                          application.status,
                          APPLICATION_STATUS[application.status] || application.status
                        )}
                      </Badge>
                      <span className="text-xs text-slate-500 dark:text-gray-400">
                        {new Date(application.created_at).toLocaleDateString(locale)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.savedJobsTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            {savedJobs.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-gray-400">
                {t('dashboard.savedJobsHint')}
              </p>
            ) : (
              <div className="space-y-3">
                {savedJobs.slice(0, 4).map((job) => (
                  <Link
                    key={job.id}
                    to={`/jobs/${job.id}`}
                    className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3 hover:bg-slate-50 dark:border-gray-700 dark:hover:bg-gray-800/60"
                  >
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{job.title}</p>
                      <p className="text-sm text-slate-500 dark:text-gray-400">{job.company?.name}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>{t('dashboard.professionalProfile')}</CardTitle>
                <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">
                  {t('dashboard.professionalProfileHint')}
                </p>
              </div>
              <Badge variant={publicProfilePath ? 'success' : 'warning'}>
                {publicProfilePath ? t('dashboard.statusLive') : t('dashboard.statusNeedsUsername')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4 dark:border-gray-700 dark:bg-gray-900/50">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-gray-400">
                {t('dashboard.publicProfileLink')}
              </p>
              {publicProfilePath ? (
                <>
                  <p className="mt-2 font-medium text-slate-900 dark:text-white">
                    {t('dashboard.publicProfileLive')}
                  </p>
                  <p className="mt-1 truncate text-sm text-primary-600 dark:text-primary-300">
                    {publicProfileUrl}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button asChild size="sm">
                      <Link to={publicProfilePath}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        {t('dashboard.openProfile')}
                      </Link>
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={copyPublicProfileLink}>
                      <Copy className="mr-2 h-4 w-4" />
                      {t('dashboard.copyLink')}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="mt-2 text-sm text-slate-600 dark:text-gray-300">
                    {t('dashboard.usernameHint')}
                  </p>
                  <Button asChild size="sm" className="mt-4">
                    <Link to="/profile">
                      <FileText className="mr-2 h-4 w-4" />
                      {t('dashboard.finishProfile')}
                    </Link>
                  </Button>
                </>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 px-4 py-3 dark:border-gray-700">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-gray-400">
                  {t('dashboard.resume')}
                </p>
                <p className="mt-2 font-semibold text-slate-900 dark:text-white">
                  {hasResume ? t('dashboard.resumeUploaded') : t('dashboard.resumeMissing')}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 px-4 py-3 dark:border-gray-700">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-gray-400">
                  {t('dashboard.profileLinks')}
                </p>
                <p className="mt-2 font-semibold text-slate-900 dark:text-white">
                  {t('dashboard.linksConnected', { count: professionalLinksCount })}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 px-4 py-3 dark:border-gray-700">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-gray-400">
                  {t('dashboard.completionScore')}
                </p>
                <p className="mt-2 font-semibold text-slate-900 dark:text-white">
                  {t('dashboard.completionReady', { count: completion })}
                </p>
              </div>
            </div>

            <Button asChild variant="outline">
              <Link to="/profile">
                <FileText className="mr-2 h-4 w-4" />
                {t('dashboard.improveProfile')}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
