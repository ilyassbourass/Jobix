import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Briefcase, CheckCircle2, ShieldCheck, Sparkles, UserCircle } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useI18n } from '../context/I18nContext'

export default function About() {
  const { t } = useI18n()

  const highlights = [
    {
      key: 'candidate',
      icon: UserCircle,
      title: t('aboutPage.highlights.candidate.title'),
      body: t('aboutPage.highlights.candidate.body'),
    },
    {
      key: 'company',
      icon: Briefcase,
      title: t('aboutPage.highlights.company.title'),
      body: t('aboutPage.highlights.company.body'),
    },
    {
      key: 'admin',
      icon: ShieldCheck,
      title: t('aboutPage.highlights.admin.title'),
      body: t('aboutPage.highlights.admin.body'),
    },
  ]

  const stackItems = [
    t('aboutPage.stack.backend'),
    t('aboutPage.stack.frontend'),
    t('aboutPage.stack.data'),
    t('aboutPage.stack.ui'),
    t('aboutPage.stack.auth'),
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <PageHeader
        title={t('aboutPage.title')}
        description={t('aboutPage.description')}
        actions={
          <Button asChild>
            <Link to="/">{t('aboutPage.cta')}</Link>
          </Button>
        }
      />

      <Card className="overflow-hidden border-slate-200/80 shadow-soft dark:border-slate-800 dark:bg-slate-900/70">
        <CardContent className="p-8 sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.25fr_0.85fr] lg:items-start">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary-700 dark:border-primary-900/60 dark:bg-primary-950/40 dark:text-primary-300">
                <Sparkles className="h-3.5 w-3.5" />
                {t('aboutPage.overviewTitle')}
              </div>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-700 dark:text-gray-300">
                {t('aboutPage.overviewBody')}
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {highlights.map(({ key, icon: Icon, title }) => (
                  <div
                    key={key}
                    className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70"
                  >
                    <Icon className="h-5 w-5 text-primary-600 dark:text-primary-300" />
                    <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">{title}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-6 dark:border-slate-800 dark:bg-slate-950/40">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-gray-400">
                {t('aboutPage.stackTitle')}
              </p>
              <div className="mt-4 space-y-3">
                {stackItems.map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900/70 dark:text-gray-200"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary-600 dark:text-primary-300" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {highlights.map(({ key, icon: Icon, title, body }) => (
          <Card key={key} className="border-slate-200/80 dark:border-slate-800 dark:bg-slate-900/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Icon className="h-4 w-4 text-primary-600 dark:text-primary-300" />
                {title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 dark:text-gray-300">{body}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-slate-200/80 dark:border-slate-800 dark:bg-slate-900/70">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{t('aboutPage.description')}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">{t('aboutPage.overviewBody')}</p>
          </div>
          <Button asChild className="shrink-0">
            <Link to="/">
              {t('aboutPage.cta')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}
