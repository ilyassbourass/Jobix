import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, SearchX } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { useAuth } from '../context/AuthContext'
import { useI18n } from '../context/I18nContext'

export default function NotFound() {
  const { user } = useAuth()
  const { t } = useI18n()

  const dashboardPath =
    user?.role === 'admin'
      ? '/admin'
      : user?.role === 'company'
        ? '/company'
        : user?.role === 'job_seeker'
          ? '/dashboard'
          : '/'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-3xl"
    >
      <Card className="overflow-hidden border-slate-200/80 shadow-soft dark:border-slate-800 dark:bg-slate-900/80">
        <CardContent className="p-8 text-center sm:p-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-300">
            <SearchX className="h-8 w-8" />
          </div>

          <div className="mt-6">
            <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs uppercase tracking-[0.18em]">
              {t('notFoundPage.badge')}
            </Badge>
          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
            {t('notFoundPage.title')}
          </h1>
          <p className="mt-3 text-base text-slate-600 dark:text-gray-300">
            {t('notFoundPage.description')}
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-500 dark:text-gray-400">
            {t('notFoundPage.body')}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild>
              <Link to="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('notFoundPage.browseJobs')}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/about">{t('notFoundPage.about')}</Link>
            </Button>
            {user && dashboardPath !== '/' && (
              <Button asChild variant="ghost">
                <Link to={dashboardPath}>{t('nav.dashboard')}</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

