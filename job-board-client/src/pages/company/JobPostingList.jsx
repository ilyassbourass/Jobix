import { Link } from 'react-router-dom'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { MapPin, Users, Edit, Trash2, ExternalLink, CalendarDays } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../api/axios'
import { JOB_TYPES } from '../../constants'
import { Card, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/Skeleton'
import { useI18n } from '../../context/I18nContext'
import CompanyLogo from '../../components/CompanyLogo'

export default function JobPostingList({ jobs, isLoading, onEdit, onShowApplicants }) {
  const queryClient = useQueryClient()
  const { t, tOption } = useI18n()

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/jobs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyJobs'] })
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      toast.success(t('jobList.jobDeleted'))
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || t('jobList.deleteFailed'))
    },
  })

  const handleDelete = (id) => {
    if (!confirm(t('jobList.deleteConfirm'))) return
    deleteMutation.mutate(id)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="mb-3 h-5 w-1/3" />
              <Skeleton className="mb-2 h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!jobs || jobs.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-slate-500 dark:text-gray-400">
          {t('jobList.noJobs')}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {jobs.map((job, index) => {
        const statusLabel = job.is_active ? t('admin.active') : t('admin.inactive')
        const jobTypeLabel = tOption('jobTypes', job.job_type, JOB_TYPES[job.job_type] || job.job_type)
        const publishedLabel = job.published_at
          ? new Date(job.published_at).toLocaleDateString()
          : null

        return (
          <motion.div
            key={job.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="overflow-hidden transition-shadow hover:shadow-soft">
              <CardContent className="p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-4">
                      <CompanyLogo company={job.company} size="sm" rounded="full" linkTo={false} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-lg font-semibold text-slate-900 dark:text-white">
                            {job.title}
                          </h3>
                          <Badge variant={job.is_active ? 'success' : 'secondary'}>
                            {statusLabel}
                          </Badge>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-slate-500 dark:text-gray-400">
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="h-4 w-4 shrink-0" />
                            {job.location}
                          </span>
                          <span>{jobTypeLabel}</span>
                          {job.category?.name && <span>{job.category.name}</span>}
                          {publishedLabel && (
                            <span className="inline-flex items-center gap-1.5">
                              <CalendarDays className="h-4 w-4 shrink-0" />
                              {publishedLabel}
                            </span>
                          )}
                        </div>

                        <div className="mt-3 flex flex-wrap gap-3">
                          <Link
                            to={`/jobs/${job.id}`}
                            className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:underline"
                          >
                            <ExternalLink className="h-4 w-4" />
                            {t('jobList.view')}
                          </Link>
                          <button
                            type="button"
                            onClick={() => onShowApplicants(job.id)}
                            className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:underline"
                          >
                            <Users className="h-4 w-4" />
                            {t('jobList.applicants')}
                            <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-800 dark:bg-primary-900/40 dark:text-primary-200">
                              {job.applications_count ?? 0}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => onEdit(job)}>
                      <Edit className="mr-1 h-4 w-4" />
                      {t('jobList.edit')}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(job.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      {t('jobList.delete')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}
