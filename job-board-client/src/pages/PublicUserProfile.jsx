import { useEffect, useState } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MapPin, Linkedin, Github, Globe, FileText, Calendar, Link2 } from 'lucide-react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import UserAvatar from '../components/UserAvatar'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'
import { useI18n } from '../context/I18nContext'

const getFilenameFromHeaders = (headers = {}) => {
  const contentDisposition = headers['content-disposition'] || headers['Content-Disposition']
  if (!contentDisposition) return null

  const utfMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utfMatch?.[1]) return decodeURIComponent(utfMatch[1]).replace(/["']/g, '')

  const simpleMatch = contentDisposition.match(/filename="?([^"]+)"?/i)
  if (simpleMatch?.[1]) return simpleMatch[1]

  return null
}

export default function PublicUserProfile() {
  const { username } = useParams()
  const { user: authUser } = useAuth()
  const { t, tOption, locale } = useI18n()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [downloadingResume, setDownloadingResume] = useState(false)
  const [requestVersion, setRequestVersion] = useState(0)

  useEffect(() => {
    setLoading(true)
    setUser(null)
    setLoadError(false)
    api
      .get(`/users/${username}`)
      .then(({ data }) => setUser(data))
      .catch((err) => {
        setUser(null)
        setLoadError(err?.response?.status !== 404)
      })
      .finally(() => setLoading(false))
  }, [username, requestVersion])

  const downloadResume = async () => {
    if (!authUser) {
      toast.error(t('publicProfile.signInResume'))
      return
    }

    setDownloadingResume(true)
    try {
      const response = await api.get(`/users/${username}/resume`, { responseType: 'blob' })
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      const safeName = (user?.name || username || 'candidate').replace(/[^a-z0-9_-]+/gi, '-')
      const headerName = getFilenameFromHeaders(response.headers)
      const fallbackExt = user?.resume_filename?.split('.').pop()
      const fallbackName = fallbackExt ? `${safeName}-resume.${fallbackExt}` : `${safeName}-resume.pdf`
      link.href = blobUrl
      link.setAttribute('download', headerName || user?.resume_filename || fallbackName)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(blobUrl)
    } catch (err) {
      const status = err?.response?.status
      if (status === 403) {
        toast.error(t('publicProfile.resumeAccessLimited'))
      } else if (status === 404) {
        toast.error(t('publicProfile.noResume'))
      } else if (status === 401) {
        toast.error(t('publicProfile.signInResume'))
      } else {
        toast.error(t('publicProfile.resumeDownloadError'))
      }
    } finally {
      setDownloadingResume(false)
    }
  }

  const skills = user?.skills ? user.skills.split(',').map((skill) => skill.trim()).filter(Boolean) : []
  const projectItems = user?.projects
    ? user.projects.split('\n').map((line) => line.trim()).filter(Boolean)
    : []
  const roleLabel = user?.role ? tOption('roles', user.role, user.role.replace('_', ' ')) : ''
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(locale, { month: 'long', year: 'numeric' })
    : null
  const profileLinksCount = [user?.linkedin_url, user?.github_url, user?.portfolio_url].filter(Boolean).length
  const contactLinks = [
    { label: 'LinkedIn', url: user?.linkedin_url, icon: Linkedin },
    { label: 'GitHub', url: user?.github_url, icon: Github },
    { label: t('profile.portfolio'), url: user?.portfolio_url, icon: Globe },
  ].filter((item) => item.url)
  const profileSummary = user?.headline || roleLabel || t('publicProfile.noHeadline')

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    if (loadError) {
      return (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-card dark:border-gray-700 dark:bg-gray-800">
          <p className="font-medium text-slate-700 dark:text-gray-200">{t('publicProfile.loadFailed')}</p>
          <p className="mt-1 text-slate-500 dark:text-gray-400">{t('publicProfile.loadFailedDesc')}</p>
          <Button type="button" className="mt-4" onClick={() => setRequestVersion((value) => value + 1)}>
            {t('common.retry')}
          </Button>
        </div>
      )
    }

    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-card dark:border-gray-700 dark:bg-gray-800">
        <p className="font-medium text-slate-700 dark:text-gray-200">{t('publicProfile.userNotFound')}</p>
        <p className="mt-1 text-slate-500 dark:text-gray-400">{t('publicProfile.userNotFoundDesc')}</p>
        <Button asChild className="mt-4">
          <Link to="/">{t('publicProfile.browseJobs')}</Link>
        </Button>
      </div>
    )
  }

  if (user.role === 'company' && (user.company?.slug || user.company?.id)) {
    return <Navigate to={`/companies/${user.company.slug || user.company.id}`} replace />
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-4xl space-y-6"
    >
      <Card className="overflow-hidden border-slate-200/80 shadow-soft dark:border-slate-800 dark:bg-slate-900/80">
        <CardContent className="p-8">
          <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <UserAvatar
                user={user}
                size="lg"
                className="h-32 w-32 border-4 border-white shadow-sm dark:border-gray-800"
              />
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">{user.name}</h1>
                <p className="mt-2 text-base font-medium text-slate-700 dark:text-gray-200">{profileSummary}</p>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <Badge variant="outline" className="capitalize text-slate-700 dark:text-gray-300">
                    {roleLabel}
                  </Badge>
                  {memberSince && (
                    <span className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-gray-400">
                      <Calendar className="h-4 w-4" />
                      {t('publicProfile.memberSince', { date: memberSince })}
                    </span>
                  )}
                  {user.location && (
                    <span className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-gray-400">
                      <MapPin className="h-4 w-4" />
                      {user.location}
                    </span>
                  )}
                </div>

                {contactLinks.length > 0 && (
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                    {contactLinks.map((link) => (
                      <a
                        key={link.label}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center rounded-full bg-slate-100 p-2.5 text-slate-700 transition-colors hover:bg-slate-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                      >
                        <link.icon className="h-5 w-5" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 dark:border-slate-700/80 dark:bg-slate-900/60">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-gray-400">
                {t('publicProfile.snapshot')}
              </p>
              <div className="mt-4 space-y-3 text-sm text-slate-700 dark:text-gray-300">
                <div className="flex items-center justify-between gap-3">
                  <span>{t('publicProfile.linksShared')}</span>
                  <span className="font-semibold">{profileLinksCount}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>{t('publicProfile.skills')}</span>
                  <span className="font-semibold">{skills.length}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>{t('publicProfile.resume')}</span>
                  <span className="font-semibold">
                    {user.has_resume ? t('publicProfile.resumeOnFile') : t('publicProfile.resumeNotShared')}
                  </span>
                </div>
              </div>

              <div className="mt-5">
                {user.has_resume ? (
                  authUser ? (
                    <Button
                      variant="default"
                      size="lg"
                      onClick={downloadResume}
                      disabled={downloadingResume}
                      className="w-full gap-2 shadow-sm"
                    >
                      <FileText className="h-5 w-5" />
                      {downloadingResume ? t('publicProfile.preparingResume') : t('publicProfile.downloadResume')}
                    </Button>
                  ) : (
                    <p className="text-sm text-slate-500 dark:text-gray-400">
                      {t('publicProfile.signInResume')}
                    </p>
                  )
                ) : (
                  <p className="text-sm text-slate-500 dark:text-gray-400">{t('publicProfile.noResume')}</p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-6 border-t border-slate-200 pt-8 dark:border-slate-800 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-4 text-center dark:border-slate-700/80 dark:bg-slate-900/60">
              <p className="text-xl font-bold text-slate-900 dark:text-white">{skills.length}</p>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-gray-400">
                {t('publicProfile.skills')}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-4 text-center dark:border-slate-700/80 dark:bg-slate-900/60">
              <p className="text-xl font-bold text-slate-900 dark:text-white">{profileLinksCount}</p>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-gray-400">
                {t('publicProfile.links')}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-4 text-center dark:border-slate-700/80 dark:bg-slate-900/60">
              <p className="text-xl font-bold text-slate-900 dark:text-white">{projectItems.length}</p>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-gray-400">
                {t('publicProfile.featuredProjects')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {(user.bio || user.headline) && (
        <Card className="dark:border-slate-800 dark:bg-slate-900/80">
          <CardHeader>
            <CardTitle>{t('publicProfile.about')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {user.headline && (
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 dark:border-slate-700/80 dark:bg-slate-900/70 dark:text-gray-200">
                {user.headline}
              </div>
            )}
            {user.bio && (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-gray-300">
                {user.bio}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {projectItems.length > 0 && (
        <Card className="dark:border-slate-800 dark:bg-slate-900/80">
          <CardHeader>
            <CardTitle>{t('publicProfile.featuredProjects')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {projectItems.map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 dark:border-slate-700/80 dark:bg-slate-900/70 dark:text-gray-200"
                >
                  {item}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="dark:border-slate-800 dark:bg-slate-900/80">
        <CardHeader>
          <CardTitle>{t('publicProfile.contact')}</CardTitle>
        </CardHeader>
        <CardContent>
          {contactLinks.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-3">
              {contactLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-primary-200 hover:bg-slate-50 dark:border-slate-700/80 dark:bg-slate-900/70 dark:text-gray-200 dark:hover:border-slate-600 dark:hover:bg-slate-900"
                >
                  <span className="inline-flex items-center gap-2">
                    <link.icon className="h-4 w-4 text-primary-600 dark:text-primary-300" />
                    {link.label}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-gray-400">{t('publicProfile.open')}</span>
                </a>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600 dark:border-slate-700/80 dark:bg-slate-950/40 dark:text-gray-300">
              <p className="font-medium text-slate-700 dark:text-gray-200">{t('publicProfile.noContactTitle')}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">
                {authUser ? t('publicProfile.noContactHintSignedIn') : t('publicProfile.noContactHintGuest')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
