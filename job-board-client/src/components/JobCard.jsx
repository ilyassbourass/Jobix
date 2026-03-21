import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MapPin, Building2, DollarSign, Bookmark } from 'lucide-react'
import { Card, CardContent } from './ui/Card'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { JOB_TYPES } from '../constants'
import { cn } from '../lib/utils'
import CompanyLogo from './CompanyLogo'
import PostedTime from './PostedTime'
import { useI18n } from '../context/I18nContext'

export default function JobCard({
  job,
  index = 0,
  showBookmark = false,
  saved = false,
  onToggleSaved,
  bookmarkPending = false,
  user = null,
  applied = false,
}) {
  const { t, tOption } = useI18n()
  const normalizedRole = typeof user?.role === 'string' ? user.role.trim().toLowerCase() : null
  const isAdmin = normalizedRole === 'admin'
  const canApply = !user || normalizedRole === 'job_seeker'
  const showAppliedStatus = canApply && applied
  const companyPublicPath = job.company?.slug || job.company?.id
  const hasSalary = job.salary_min || job.salary_max
  const salaryText = hasSalary
    ? `$${Number(job.salary_min || 0).toLocaleString()} - $${Number(job.salary_max || 0).toLocaleString()}`
    : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className="group overflow-hidden border border-slate-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex min-w-0 gap-4">
              <CompanyLogo company={job.company} size="md" rounded="lg" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <Link
                    to={`/jobs/${job.id}`}
                    className="truncate text-base font-semibold text-slate-900 transition-colors hover:text-primary-700 dark:text-gray-100 sm:text-lg"
                  >
                    {job.title}
                  </Link>
                  <PostedTime publishedAt={job.published_at} />
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                  {companyPublicPath ? (
                    <Link
                      to={`/companies/${companyPublicPath}`}
                      className="inline-flex items-center gap-1.5 font-medium text-primary-700 hover:underline dark:text-primary-400"
                    >
                      <Building2 className="h-4 w-4 shrink-0" />
                      {job.company?.name}
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 font-medium text-primary-700 dark:text-primary-400">
                      <Building2 className="h-4 w-4 shrink-0" />
                      {job.company?.name}
                    </span>
                  )}
                  <span className="text-slate-400">&bull;</span>
                  <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-gray-400">
                    <MapPin className="h-4 w-4 shrink-0" />
                    {job.location}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">
                    {tOption('jobTypes', job.job_type, JOB_TYPES[job.job_type] || job.job_type)}
                  </Badge>
                  {job.category?.name && <Badge variant="outline">{job.category.name}</Badge>}
                  {!!job.work_mode && (
                    <Badge variant="outline">
                      {tOption('workModes', job.work_mode, job.work_mode.replace('_', ' '))}
                    </Badge>
                  )}
                  {!!job.experience_level && (
                    <Badge variant="outline">
                      {tOption('experience', job.experience_level, job.experience_level)}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex shrink-0 flex-row items-center justify-between gap-3 md:flex-col md:items-end md:justify-start">
              <div className="flex items-center gap-2">
                {showBookmark && user?.role === 'job_seeker' && (
                  <button
                    type="button"
                    onClick={() => onToggleSaved?.(!saved)}
                    disabled={bookmarkPending}
                    aria-busy={bookmarkPending}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                      saved
                        ? 'border-primary-200 bg-primary-50 text-primary-700 hover:bg-primary-100 dark:border-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
                    )}
                    aria-label={saved ? t('job.saved') : t('job.save')}
                  >
                    <Bookmark className={cn('h-4 w-4', saved && 'fill-primary-600')} />
                    {saved ? t('job.saved') : t('job.save')}
                  </button>
                )}
                {salaryText && (
                  <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 dark:bg-emerald-900/30">
                    <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                      {salaryText}
                    </span>
                  </div>
                )}
              </div>
              {canApply ? (
                showAppliedStatus ? (
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                    {t('job.alreadyApplied')}
                  </span>
                ) : (
                  <Button
                    asChild
                    size="sm"
                    className="w-full shadow-sm transition-transform active:scale-[0.98] md:w-auto"
                  >
                    <Link to={`/jobs/${job.id}`}>{t('job.applyNow')}</Link>
                  </Button>
                )
              ) : (
                <Button
                  asChild
                  size="sm"
                  variant={isAdmin ? 'outline' : 'secondary'}
                  className="w-full shadow-sm transition-transform active:scale-[0.98] md:w-auto"
                >
                  <Link to={`/jobs/${job.id}`}>{t('job.viewJob')}</Link>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
