import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/Dialog'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import UserAvatar from '../../components/UserAvatar'
import toast from 'react-hot-toast'
import { APPLICATION_STATUS } from '../../constants'
import { useI18n } from '../../context/I18nContext'

const STATUS_ORDER = ['pending', 'reviewing', 'interview', 'accepted', 'rejected']

const EMPTY_DRAFT = {
  company_notes: '',
  rejection_reason: '',
}

const normalizeText = (value) => (value || '').trim()

export default function ApplicantsModal({ jobId, open, onClose }) {
  const { t, tOption, locale } = useI18n()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [drafts, setDrafts] = useState({})
  const [savingId, setSavingId] = useState(null)
  const [downloadingResumeId, setDownloadingResumeId] = useState(null)

  useEffect(() => {
    if (!jobId || !open) return

    setLoading(true)
    api
      .get(`/jobs/${jobId}/applications`)
      .then(({ data }) => {
        setApplications(data)
        setDrafts(
          data.reduce((acc, app) => {
            acc[app.id] = {
              company_notes: app.company_notes || '',
              rejection_reason: app.rejection_reason || '',
            }
            return acc
          }, {})
        )
        setStatusFilter('all')
      })
      .catch(() => {
        setApplications([])
        setDrafts({})
        toast.error(t('applicants.loadFailed'))
      })
      .finally(() => setLoading(false))
  }, [jobId, open])

  const getDraft = (app) => ({
    ...EMPTY_DRAFT,
    ...(drafts[app.id] || {}),
  })

  const updateDraft = (appId, field, value) => {
    setDrafts((prev) => ({
      ...prev,
      [appId]: {
        ...EMPTY_DRAFT,
        ...(prev[appId] || {}),
        [field]: value,
      },
    }))
  }

  const replaceApplication = (nextApplication) => {
    setApplications((prev) =>
      prev.map((app) => (app.id === nextApplication.id ? nextApplication : app))
    )
    setDrafts((prev) => ({
      ...prev,
      [nextApplication.id]: {
        company_notes: nextApplication.company_notes || '',
        rejection_reason: nextApplication.rejection_reason || '',
      },
    }))
  }

  const saveApplication = async (app, nextStatus = app.status, successMessage = null) => {
    const draft = getDraft(app)

    if (nextStatus === 'rejected' && !draft.rejection_reason.trim()) {
      toast.error(t('applicants.rejectionReasonRequired'))
      return
    }

    setSavingId(app.id)

    try {
      const { data } = await api.put(`/applications/${app.id}/status`, {
        status: nextStatus,
        company_notes: draft.company_notes.trim() || null,
        rejection_reason: draft.rejection_reason.trim() || null,
      })

      replaceApplication(data)
      toast.success(
        successMessage ||
          t('applicants.movedTo', {
            status: tOption(
              'applicationStatus',
              data.status,
              APPLICATION_STATUS[data.status] || data.status
            ),
          })
      )
    } catch (err) {
      toast.error(err.response?.data?.message || t('applicants.updateFailed'))
    } finally {
      setSavingId(null)
    }
  }

  const downloadResume = async (app) => {
    setDownloadingResumeId(app.id)

    try {
      const response = await api.get(`/applications/${app.id}/resume`, {
        responseType: 'blob',
      })
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      const safeName = (app.user?.name || 'applicant').replace(/[^a-z0-9_-]+/gi, '-')
      const extension = app.resume_path?.split('.').pop()
      link.href = blobUrl
      link.setAttribute('download', extension ? `resume-${safeName}-${app.id}.${extension}` : `resume-${safeName}-${app.id}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(blobUrl)
      toast.success(t('applicants.resumeDownloaded'))
    } catch (err) {
      toast.error(err.response?.data?.message || t('applicants.resumeDownloadFailed'))
    } finally {
      setDownloadingResumeId(null)
    }
  }

  const statusCounts = STATUS_ORDER.reduce(
    (acc, status) => {
      acc[status] = applications.filter((app) => app.status === status).length
      return acc
    },
    {}
  )

  const filteredApplications =
    statusFilter === 'all'
      ? applications
      : applications.filter((app) => app.status === statusFilter)

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('applicants.title')}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
          </div>
        ) : applications.length === 0 ? (
          <p className="py-8 text-center text-slate-500">{t('applicants.noApplications')}</p>
        ) : (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 lg:col-span-2 dark:border-gray-700 dark:bg-gray-800/60">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-gray-400">
                  {t('applicants.totalApplicants')}
                </p>
                <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-gray-100">{applications.length}</p>
              </div>

              {STATUS_ORDER.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`rounded-xl border p-4 text-left transition ${
                    statusFilter === status
                      ? 'border-primary-500 bg-primary-50 shadow-sm dark:border-primary-500 dark:bg-primary-500/10'
                      : 'border-slate-200 bg-white hover:border-slate-300 dark:border-gray-700 dark:bg-gray-800/50'
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-gray-400">
                    {tOption('applicationStatus', status, APPLICATION_STATUS[status])}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-gray-100">
                    {statusCounts[status] || 0}
                  </p>
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-end sm:justify-between dark:border-gray-700 dark:bg-gray-800/40">
              <div className="w-full max-w-xs">
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-gray-300">
                  {t('applicants.filterByStage')}
                </label>
                <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="all">{t('applicants.allStages')}</option>
                  {STATUS_ORDER.map((status) => (
                    <option key={status} value={status}>
                      {tOption('applicationStatus', status, APPLICATION_STATUS[status])}
                    </option>
                  ))}
                </Select>
              </div>

              <p className="text-sm text-slate-500 dark:text-gray-400">
                {t('applicants.pipelineHint')}
              </p>
            </div>

            {filteredApplications.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500 dark:border-gray-700 dark:text-gray-400">
                {t('applicants.noMatch')}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredApplications.map((app) => {
                  const draft = getDraft(app)
                  const isSaving = savingId === app.id
                  const isDownloadingResume = downloadingResumeId === app.id
                  const hasNotesChanges = normalizeText(draft.company_notes) !== normalizeText(app.company_notes)

                  return (
                    <div
                      key={app.id}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800/40"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start gap-3">
                            <UserAvatar user={app.user} size="md" />
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                {app.user?.username ? (
                                  <Link
                                    to={`/public-profile/${app.user.username}`}
                                    className="truncate text-base font-semibold text-slate-900 hover:text-primary-600 dark:text-gray-100 dark:hover:text-primary-400"
                                >
                                  {app.user?.name}
                                </Link>
                              ) : (
                                <p className="truncate text-base font-semibold text-slate-900 dark:text-gray-100">
                                    {app.user?.name}
                                  </p>
                                )}
                                <Badge
                                  variant={
                                    app.status === 'accepted'
                                      ? 'success'
                                      : app.status === 'rejected'
                                        ? 'destructive'
                                        : 'secondary'
                                  }
                                >
                                  {tOption(
                                    'applicationStatus',
                                    app.status,
                                    APPLICATION_STATUS[app.status] || app.status
                                  )}
                                </Badge>
                              </div>
                              <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">{app.user?.email}</p>
                              <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">
                                {t('applicants.applied', {
                                  date: new Date(app.created_at).toLocaleDateString(locale),
                                })}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 grid gap-4 lg:grid-cols-2">
                            <div className="rounded-xl bg-slate-50 p-4 dark:bg-gray-900/40">
                              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-gray-400">
                                {t('applicants.coverLetter')}
                              </p>
                              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700 dark:text-gray-300">
                                {app.cover_letter || t('applicants.noCoverLetter')}
                              </p>
                            </div>

                            <div className="rounded-xl bg-slate-50 p-4 dark:bg-gray-900/40">
                              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-gray-400">
                                {t('applicants.recruiterNotes')}
                              </p>
                              <Textarea
                                className="mt-2 min-h-[110px] bg-white dark:bg-gray-800"
                                placeholder={t('applicants.recruiterNotesPlaceholder')}
                                value={draft.company_notes}
                                disabled={isSaving}
                                onChange={(e) => updateDraft(app.id, 'company_notes', e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="mt-4">
                            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-gray-300">
                              {t('applicants.rejectionReason')}
                            </label>
                            <Input
                              placeholder={t('applicants.rejectionPlaceholder')}
                              value={draft.rejection_reason}
                              disabled={isSaving}
                              onChange={(e) => updateDraft(app.id, 'rejection_reason', e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="w-full space-y-3 lg:w-64">
                          <div className="rounded-xl border border-slate-200 p-3 dark:border-gray-700">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-gray-400">
                              {t('applicants.currentStage')}
                            </p>
                            <p className="mt-2 text-sm font-medium text-slate-900 dark:text-gray-100">
                              {tOption(
                                'applicationStatus',
                                app.status,
                                APPLICATION_STATUS[app.status] || app.status
                              )}
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isSaving}
                              onClick={() => saveApplication(app, 'reviewing')}
                            >
                              {t('applicants.review')}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isSaving}
                              onClick={() => saveApplication(app, 'interview')}
                            >
                              {t('applicants.interview')}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-emerald-600 hover:bg-emerald-50"
                              disabled={isSaving}
                              onClick={() => saveApplication(app, 'accepted')}
                            >
                              {t('applicants.accept')}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:bg-red-50"
                              disabled={isSaving}
                              onClick={() => saveApplication(app, 'rejected')}
                            >
                              {t('applicants.reject')}
                            </Button>
                          </div>

                          <Button
                            className="w-full"
                            variant="secondary"
                            disabled={isSaving || !hasNotesChanges}
                            onClick={() =>
                              saveApplication(
                                app,
                                app.status,
                                normalizeText(draft.company_notes)
                                  ? t('applicants.notesSaved')
                                  : t('applicants.notesCleared')
                              )
                            }
                          >
                            {isSaving ? t('applicants.saving') : t('applicants.saveNotes')}
                          </Button>

                          {app.resume_path ? (
                            <Button
                              className="w-full"
                              variant="outline"
                              disabled={isSaving || isDownloadingResume}
                              onClick={() => downloadResume(app)}
                            >
                              {isDownloadingResume
                                ? t('applicants.downloadingResume')
                                : t('applicants.downloadResume')}
                            </Button>
                          ) : (
                            <div className="rounded-xl border border-dashed border-slate-300 px-3 py-2 text-center text-sm text-slate-500 dark:border-gray-700 dark:text-gray-400">
                              {t('applicants.noResumeAttached')}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
