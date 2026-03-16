import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
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
  const [toast, setToast] = useState(null)
  const [undoJob, setUndoJob] = useState(null)
  const [appliedIds, setAppliedIds] = useState(new Set())
  const undoTimeoutRef = useRef(null)

  const fetchSaved = (page = 1) => {
    setLoading(true)
    api
      .get(`/saved-jobs?page=${page}`)
      .then(({ data }) => setJobs(data))
      .catch(() => setJobs({ data: [], current_page: 1, last_page: 1 }))
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
    setToast(null)
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
    setToast(t('savedJobs.removed'))

    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current)
    undoTimeoutRef.current = setTimeout(() => {
      api.delete(`/jobs/${jobId}/save`).catch(() => {})
      doRemovePermanently()
      undoTimeoutRef.current = null
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
    api.post(`/jobs/${undoJob.id}/save`).catch(() => {})
    setUndoJob(null)
    setToast(null)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader
        title={t('savedJobs.title')}
        description={t('savedJobs.description')}
        actions={<Badge variant="secondary">{t('savedJobs.savedCount', { count: jobs.data.length })}</Badge>}
      />

      {toast && (
        <div className="mb-4 flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-md dark:border-gray-700 dark:bg-gray-800">
          <span className="text-sm text-slate-700 dark:text-gray-200">{toast}</span>
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
