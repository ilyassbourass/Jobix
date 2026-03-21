import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Users, Building2, Briefcase, FileCheck } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts'
import api from '../api/axios'
import toast from 'react-hot-toast'
import PageHeader from '../components/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import StatCard from '../components/StatCard'
import UserAvatar from '../components/UserAvatar'
import CompanyLogo from '../components/CompanyLogo'
import { useI18n } from '../context/I18nContext'
import { Link } from 'react-router-dom'

export default function AdminDashboard() {
  const { t, tOption } = useI18n()
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState({ data: [] })
  const [jobs, setJobs] = useState({ data: [] })
  const [tab, setTab] = useState('stats')
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState(30)
  const [statsLoading, setStatsLoading] = useState(false)
  const [statsError, setStatsError] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [userRole, setUserRole] = useState('all')
  const [userPage, setUserPage] = useState(1)
  const [userLoading, setUserLoading] = useState(false)
  const [userError, setUserError] = useState('')
  const [deletingUserId, setDeletingUserId] = useState(null)
  const [jobSearch, setJobSearch] = useState('')
  const [jobStatus, setJobStatus] = useState('all')
  const [jobPage, setJobPage] = useState(1)
  const [jobLoading, setJobLoading] = useState(false)
  const [jobError, setJobError] = useState('')
  const [togglingJobId, setTogglingJobId] = useState(null)

  const fetchStats = async (selectedRange = range) => {
    setStatsLoading(true)
    setStatsError('')
    try {
      const { data } = await api.get(`/admin/stats?range=${selectedRange}`)
      setStats(data)
    } catch {
      setStatsError(t('admin.loadStatsFailed'))
    } finally {
      setStatsLoading(false)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats(range)
  }, [range])

  const fetchUsers = async () => {
    setUserLoading(true)
    setUserError('')
    try {
      const params = {
        page: userPage,
        per_page: 12,
      }
      if (userSearch.trim()) params.search = userSearch.trim()
      if (userRole !== 'all') params.role = userRole
      const { data } = await api.get('/admin/users', { params })
      if (data && Array.isArray(data.data)) {
        setUsers(data)
      } else if (Array.isArray(data)) {
        setUsers({ data })
      } else {
        setUsers({ data: [] })
      }
    } catch {
      setUserError(t('admin.loadUsersFailed'))
    } finally {
      setUserLoading(false)
    }
  }

  const fetchJobs = async () => {
    setJobLoading(true)
    setJobError('')
    try {
      const params = {
        page: jobPage,
        per_page: 10,
      }
      if (jobSearch.trim()) params.search = jobSearch.trim()
      if (jobStatus !== 'all') params.is_active = jobStatus === 'active' ? 1 : 0
      const { data } = await api.get('/admin/jobs', { params })
      if (data && Array.isArray(data.data)) {
        setJobs(data)
      } else if (Array.isArray(data)) {
        setJobs({ data })
      } else {
        setJobs({ data: [] })
      }
    } catch {
      setJobError(t('admin.loadJobsFailed'))
    } finally {
      setJobLoading(false)
    }
  }

  useEffect(() => {
    if (tab !== 'users') return undefined
    const timer = setTimeout(fetchUsers, 250)
    return () => clearTimeout(timer)
  }, [tab, userSearch, userRole, userPage])

  useEffect(() => {
    if (tab !== 'jobs') return undefined
    const timer = setTimeout(fetchJobs, 250)
    return () => clearTimeout(timer)
  }, [tab, jobSearch, jobStatus, jobPage])

  const handleToggleJobStatus = async (id) => {
    setTogglingJobId(id)
    try {
      await api.put(`/admin/jobs/${id}/toggle-status`)
      setJobs((prev) => ({
        ...prev,
        data: prev.data.map((job) => (job.id === id ? { ...job, is_active: !job.is_active } : job)),
      }))
      toast.success(t('admin.jobStatusUpdated'))
    } catch (err) {
      toast.error(err.response?.data?.message || t('admin.actionFailed'))
    } finally {
      setTogglingJobId(null)
    }
  }

  const handleDeleteUser = async (id) => {
    if (!confirm(t('admin.deleteUserConfirm'))) return

    setDeletingUserId(id)
    try {
      await api.delete(`/admin/users/${id}`)
      setUsers((prev) => ({ ...prev, data: prev.data.filter((user) => user.id !== id) }))
      toast.success(t('admin.userDeleted'))
    } catch (err) {
      toast.error(err.response?.data?.message || t('admin.actionFailed'))
    } finally {
      setDeletingUserId(null)
    }
  }

  const overviewData = stats?.timeseries || []
  const statCards = [
    {
      key: 'users_count',
      label: t('admin.statLabels.totalUsers'),
      icon: Users,
      color: 'text-blue-600 dark:text-blue-300',
    },
    {
      key: 'companies_count',
      label: t('admin.statLabels.companies'),
      icon: Building2,
      color: 'text-emerald-600 dark:text-emerald-300',
    },
    {
      key: 'jobs_count',
      label: t('admin.statLabels.totalJobs'),
      icon: Briefcase,
      color: 'text-amber-600 dark:text-amber-300',
    },
    {
      key: 'applications_count',
      label: t('admin.statLabels.applications'),
      icon: FileCheck,
      color: 'text-purple-600 dark:text-violet-300',
    },
  ]

  const roleOptions = [
    { value: 'all', label: t('admin.filters.allRoles') },
    { value: 'job_seeker', label: tOption('roles', 'job_seeker', 'Job seeker') },
    { value: 'company', label: tOption('roles', 'company', 'Company') },
    { value: 'admin', label: tOption('roles', 'admin', 'Admin') },
  ]

  const userRows = Array.isArray(users?.data)
    ? users.data
    : Array.isArray(users)
      ? users
      : []
  const jobRows = Array.isArray(jobs?.data)
    ? jobs.data
    : Array.isArray(jobs)
      ? jobs
      : []

  const userTotal = users?.total ?? userRows.length ?? 0
  const jobTotal = jobs?.total ?? jobRows.length ?? 0
  const userHasPagination = users && typeof users === 'object' && typeof users.last_page === 'number'
  const jobHasPagination = jobs && typeof jobs === 'object' && typeof jobs.last_page === 'number'

  const profileLinkForUser = (user) => {
    if (!user) return null
    if (user.role === 'company' && user.company?.slug) return `/companies/${user.company.slug}`
    if (user.username) return `/public-profile/${user.username}`
    return null
  }

  const companyLink = (company) => {
    if (!company?.slug) return null
    return `/companies/${company.slug}`
  }

  const jobLink = (job) => {
    if (!job?.id) return null
    return `/jobs/${job.id}`
  }

  if (loading && !stats && !statsError) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
      </div>
    )
  }

  if (!stats && statsError) {
    return (
      <Card className="border-slate-200 shadow-soft dark:border-gray-800 dark:bg-gray-800">
        <CardContent className="p-12 text-center">
          <p className="font-medium text-slate-700 dark:text-gray-200">{statsError}</p>
          <Button type="button" className="mt-4" onClick={() => fetchStats(range)}>
            {t('common.retry')}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <PageHeader
        title={t('admin.title')}
        description={t('admin.description')}
      />

      <div className="mb-6 flex gap-2 border-b border-slate-200 dark:border-gray-800">
        {['stats', 'users', 'jobs'].map((currentTab) => (
          <button
            key={currentTab}
            onClick={() => setTab(currentTab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
              tab === currentTab
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-slate-600 hover:text-slate-900 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            {t(`admin.tabs.${currentTab}`)}
          </button>
        ))}
      </div>

      {tab === 'stats' && stats && (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-600 dark:text-gray-400">{t('admin.charts')}</span>
              <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-800">
                {[
                  { label: t('admin.ranges.seven'), value: 7 },
                  { label: t('admin.ranges.thirty'), value: 30 },
                  { label: t('admin.ranges.year'), value: 365 },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setRange(option.value)}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      range === option.value
                        ? 'bg-primary-600 text-white'
                        : 'text-slate-700 hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {statsLoading && (
                <span className="text-xs text-slate-500 dark:text-gray-400">{t('admin.updating')}</span>
              )}
            </div>
            <Badge variant="secondary">{t('admin.activeJobs', { count: stats.active_jobs_count ?? 0 })}</Badge>
          </div>

          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map(({ key, label, icon: Icon, color }, index) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <StatCard label={label} value={stats[key] ?? 0} icon={Icon} accentClass={color} />
              </motion.div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.usersGrowth')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={overviewData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-gray-700" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="users"
                        stroke="#2563eb"
                        strokeWidth={2}
                        dot={{ fill: '#2563eb' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('admin.jobsApplications')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={overviewData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-gray-700" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                        }}
                      />
                      <Bar dataKey="jobs" fill="#d97706" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="applications" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {tab === 'users' && (
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex w-full flex-wrap items-center gap-3 lg:w-auto">
              <div className="w-full max-w-sm">
                <input
                  type="text"
                  value={userSearch}
                  onChange={(event) => {
                    setUserSearch(event.target.value)
                    setUserPage(1)
                  }}
                  placeholder={t('admin.filters.searchUsers')}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:ring-primary-900"
                />
              </div>
              <select
                value={userRole}
                onChange={(event) => {
                  setUserRole(event.target.value)
                  setUserPage(1)
                }}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:ring-primary-900 sm:w-auto"
              >
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-sm text-slate-500 dark:text-gray-400">
              {userLoading ? t('admin.loading') : t('admin.results', { count: userTotal })}
            </div>
          </div>
          {userError && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-red-50 px-6 py-3 text-sm text-red-700 dark:border-gray-700 dark:bg-red-950/30 dark:text-red-300">
              <span>{userError}</span>
              <Button type="button" size="sm" variant="outline" onClick={fetchUsers}>
                {t('common.retry')}
              </Button>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-gray-700">
              <thead className="bg-slate-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    {t('admin.table.id')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    {t('admin.table.name')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    {t('admin.table.email')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    {t('admin.table.role')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    {t('admin.table.company')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                    {t('admin.table.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                {userLoading && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500 dark:text-gray-400">
                      {t('admin.loading')}
                    </td>
                  </tr>
                )}
                {!userLoading && userRows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500 dark:text-gray-400">
                      {t('admin.emptyUsers')}
                    </td>
                  </tr>
                )}
                {!userLoading &&
                  userRows.map((user) => {
                    const profileLink = profileLinkForUser(user)
                    const companyProfile = companyLink(user.company)
                    const isDeleting = deletingUserId === user.id
                    return (
                      <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/50">
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-900 dark:text-gray-100">
                          {user.id}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center gap-3">
                            <UserAvatar user={user} size="sm" />
                            <div className="flex flex-col">
                              {profileLink ? (
                                <Link
                                  to={profileLink}
                                  className="text-sm font-semibold text-slate-900 transition hover:text-primary-600 dark:text-gray-100 dark:hover:text-primary-300"
                                >
                                  {user.name}
                                </Link>
                              ) : (
                                <span className="text-sm font-semibold text-slate-900 dark:text-gray-100">
                                  {user.name}
                                </span>
                              )}
                              {user.username && (
                                <span className="text-xs text-slate-500 dark:text-gray-400">
                                  @{user.username}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-2">
                            <a
                              href={`mailto:${user.email}`}
                              className="text-sm text-slate-600 transition hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-300"
                            >
                              {user.email}
                            </a>
                            <Badge variant={user.email_verified_at ? 'success' : 'warning'}>
                              {user.email_verified_at ? t('admin.verified') : t('admin.unverified')}
                            </Badge>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <Badge variant="secondary">
                            {tOption('roles', user.role, user.role?.replace('_', ' '))}
                          </Badge>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500 dark:text-gray-400">
                          {companyProfile ? (
                            <Link
                              to={companyProfile}
                              className="font-medium text-slate-700 transition hover:text-primary-600 dark:text-gray-200 dark:hover:text-primary-300"
                            >
                              {user.company?.name}
                            </Link>
                          ) : (
                            user.company?.name ?? '-'
                          )}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                          <div className="flex items-center justify-end gap-2">
                            {profileLink && (
                              <Button variant="outline" size="sm" asChild>
                                <Link to={profileLink}>
                                  {user.role === 'company' ? t('admin.viewCompany') : t('admin.viewProfile')}
                                </Link>
                              </Button>
                            )}
                            {user.role !== 'admin' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                                disabled={isDeleting}
                                onClick={() => handleDeleteUser(user.id)}
                              >
                                {isDeleting ? t('admin.deleting') : t('admin.delete')}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
          {userHasPagination && users.last_page > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-6 py-4 text-sm text-slate-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
              <span>{t('admin.pagination', { current: users.current_page, total: users.last_page })}</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUserPage((prev) => Math.max(1, prev - 1))}
                  disabled={userPage <= 1 || userLoading}
                >
                  {t('admin.prev')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUserPage((prev) => Math.min(users.last_page, prev + 1))}
                  disabled={userPage >= users.last_page || userLoading}
                >
                  {t('admin.next')}
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {tab === 'jobs' && (
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex w-full flex-wrap items-center gap-3 lg:w-auto">
              <div className="w-full max-w-sm">
                <input
                  type="text"
                  value={jobSearch}
                  onChange={(event) => {
                    setJobSearch(event.target.value)
                    setJobPage(1)
                  }}
                  placeholder={t('admin.filters.searchJobs')}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:ring-primary-900"
                />
              </div>
              <select
                value={jobStatus}
                onChange={(event) => {
                  setJobStatus(event.target.value)
                  setJobPage(1)
                }}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:ring-primary-900 sm:w-auto"
              >
                <option value="all">{t('admin.filters.allStatuses')}</option>
                <option value="active">{t('admin.active')}</option>
                <option value="inactive">{t('admin.inactive')}</option>
              </select>
            </div>
            <div className="text-sm text-slate-500 dark:text-gray-400">
              {jobLoading ? t('admin.loading') : t('admin.results', { count: jobTotal })}
            </div>
          </div>
          {jobError && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-red-50 px-6 py-3 text-sm text-red-700 dark:border-gray-700 dark:bg-red-950/30 dark:text-red-300">
              <span>{jobError}</span>
              <Button type="button" size="sm" variant="outline" onClick={fetchJobs}>
                {t('common.retry')}
              </Button>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-gray-700">
              <thead className="bg-slate-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    {t('admin.table.title')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    {t('admin.table.company')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    {t('admin.table.status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    {t('admin.table.applications')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                    {t('admin.table.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                {jobLoading && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500 dark:text-gray-400">
                      {t('admin.loading')}
                    </td>
                  </tr>
                )}
                {!jobLoading && jobRows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500 dark:text-gray-400">
                      {t('admin.emptyJobs')}
                    </td>
                  </tr>
                )}
                {!jobLoading &&
                  jobRows.map((job) => {
                    const companyProfile = companyLink(job.company)
                    const jobDetail = jobLink(job)
                    const isToggling = togglingJobId === job.id
                    return (
                      <tr key={job.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4">
                          {jobDetail ? (
                            <Link
                              to={jobDetail}
                              className="text-sm font-semibold text-slate-900 transition hover:text-primary-600 dark:text-gray-100 dark:hover:text-primary-300"
                            >
                              {job.title}
                            </Link>
                          ) : (
                            <span className="text-sm font-semibold text-slate-900 dark:text-gray-100">
                              {job.title}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <CompanyLogo company={job.company} size="sm" rounded="lg" />
                            {companyProfile ? (
                              <Link
                                to={companyProfile}
                                className="text-sm font-medium text-slate-600 transition hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-300"
                              >
                                {job.company?.name}
                              </Link>
                            ) : (
                              <span className="text-sm text-slate-500 dark:text-gray-400">
                                {job.company?.name}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <Badge variant={job.is_active ? 'success' : 'secondary'}>
                            {job.is_active ? t('admin.active') : t('admin.inactive')}
                          </Badge>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500 dark:text-gray-400">
                          {job.applications_count ?? 0}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {jobDetail && (
                            <Button variant="outline" size="sm" asChild>
                              <Link to={jobDetail}>{t('admin.viewJob')}</Link>
                            </Button>
                          )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleJobStatus(job.id)}
                              disabled={isToggling}
                            >
                              {isToggling ? t('admin.toggling') : t('admin.toggle')}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
          {jobHasPagination && jobs.last_page > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-6 py-4 text-sm text-slate-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
              <span>{t('admin.pagination', { current: jobs.current_page, total: jobs.last_page })}</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setJobPage((prev) => Math.max(1, prev - 1))}
                  disabled={jobPage <= 1 || jobLoading}
                >
                  {t('admin.prev')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setJobPage((prev) => Math.min(jobs.last_page, prev + 1))}
                  disabled={jobPage >= jobs.last_page || jobLoading}
                >
                  {t('admin.next')}
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </motion.div>
  )
}
