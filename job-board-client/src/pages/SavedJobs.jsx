import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import api from '../api/axios'
import JobCard from '../components/JobCard'
import JobCardSkeleton from '../components/JobCardSkeleton'
import PageHeader from '../components/PageHeader'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'
import { useI18n } from '../context/I18nContext'

export default function SavedJobs() {
  const { user } = useAuth()
  const { t } = useI18n()
  const [jobs, setJobs] = useState({ data: [], current_page: 1, last_page: 1 })
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [undoToast, setUndoToast] = useState(null)
  const [undoJob, setUndoJob] = useState(null)
  const [appliedIds, setAppliedIds] = useState(new Set())
  const undoTimeoutRef = useRef(null)

  const fetchSaved = (page = 1) => {
    setLoading(true)
    setLoadError('')
    api
      .get(`/saved-jobs?page=${page}`)
      .then(({ data }) => setJobs(data))
      .catch(() => {
        setJobs({ data: [], current_page: 1, last_page: 1 })
        setLoadError(t('savedJobs.loadFailed'))
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchSaved(1)
  }, [])

  useEffect(() => {
    if (user?.role !== 'job_seeker') return

    api
      .get('/my/applications?per_page=500')
      .then(({ data }) => {
        const ids = new Set((data?.data || []).map((a) => a.job_id))
        setAppliedIds(ids)
      })
      .catch(() => {})
  }, [user])

  useEffect(() => {
    return () => {
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current)
    }
  }, [])

  const doRemovePermanently = () => {
    setUndoJob(null)
    setUndoToast(null)
  }

  const toggleSaved = async (jobId, nextSaved) => {
    if (nextSaved) {
      try {
        await api.post(`/jobs/${jobId}/save`)
      } finally {
        fetchSaved(jobs.current_page)
      }
      return
    }

    const job = jobs.data.find((item) => item.id === jobId)
    if (!job) return

    setJobs((prev) => ({ ...prev, data: prev.data.filter((item) => item.id !== jobId) }))
    setUndoJob(job)
    setUndoToast(t('savedJobs.removed'))

    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current)
    undoTimeoutRef.current = setTimeout(() => {
      api
        .delete(`/jobs/${jobId}/save`)
        .then(() => doRemovePermanently())
        .catch(() => {
          fetchSaved(jobs.current_page)
          setUndoToast(null)
          setUndoJob(null)
          toast.error(t('savedJobs.removeFailed'))
        })
        .finally(() => {
          undoTimeoutRef.current = null
        })
    }, 5000)
  }

  const handleUndo = () => {
    if (!undoJob) return

    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current)
      undoTimeoutRef.current = null
    }

    setJobs((prev) => ({
      ...prev,
      data: [...prev.data, undoJob].sort((a, b) => b.id - a.id),
    }))
    api.post(`/jobs/${undoJob.id}/save`).catch(() => {
      fetchSaved(jobs.current_page)
      toast.error(t('savedJobs.undoFailed'))
    })
    setUndoJob(null)
    setUndoToast(null)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader
        title={t('savedJobs.title')}
        description={t('savedJobs.description')}
        actions={<Badge variant="secondary">{t('savedJobs.savedCount', { count: jobs.data.length })}</Badge>}
      />

      {loadError && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
          <span>{loadError}</span>
          <Button size="sm" variant="outline" onClick={() => fetchSaved(jobs.current_page || 1)}>
            {t('common.retry')}
          </Button>
        </div>
      )}

      {undoToast && (
        <div className="mb-4 flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-md dark:border-gray-700 dark:bg-gray-800">
          <span className="text-sm text-slate-700 dark:text-gray-200">{undoToast}</span>
          <Button size="sm" variant="outline" onClick={handleUndo}>
            {t('savedJobs.undo')}
          </Button>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <JobCardSkeleton key={i} />
          ))}
        </div>
      ) : jobs.data.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-card dark:border-gray-700 dark:bg-gray-800">
          <p className="font-medium text-slate-700 dark:text-gray-100">{t('savedJobs.emptyTitle')}</p>
          <p className="mt-1 text-slate-500 dark:text-gray-400">
            {t('savedJobs.emptyHint')}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.data.map((job, index) => (
            <JobCard
              key={job.id}
              job={job}
              index={index}
              saved
              showBookmark
              onToggleSaved={(next) => toggleSaved(job.id, next)}
              user={user}
              applied={appliedIds.has(job.id)}
            />
          ))}
        </div>
      )}
    </motion.div>
  )
}
