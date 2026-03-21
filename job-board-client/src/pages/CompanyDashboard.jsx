import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import api from '../api/axios'
import PageHeader from '../components/PageHeader'
import { Button } from '../components/ui/Button'
import JobPostingForm from './company/JobPostingForm'
import JobPostingList from './company/JobPostingList'
import ApplicantsModal from './company/ApplicantsModal'
import { useI18n } from '../context/I18nContext'

const emptyForm = {
  title: '',
  category_id: '',
  description: '',
  requirements: '',
  location: '',
  job_type: 'full_time',
  work_mode: '',
  experience_level: '',
  salary_min: '',
  salary_max: '',
  expires_at: '',
}

export default function CompanyDashboard() {
  const { t } = useI18n()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [applicantsJobId, setApplicantsJobId] = useState(null)
  const formRef = useRef(null)

  const {
    data: jobsResponse,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['companyJobs'],
    queryFn: async () => {
      const { data } = await api.get('/my/jobs')
      return data
    },
  })

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(false)
  }

  const handleEdit = (job) => {
    setForm({
      title: job.title,
      category_id: job.category_id,
      description: job.description,
      requirements: job.requirements || '',
      location: job.location,
      job_type: job.job_type,
      work_mode: job.work_mode || '',
      experience_level: job.experience_level || '',
      salary_min: job.salary_min || '',
      salary_max: job.salary_max || '',
      expires_at: job.expires_at ? job.expires_at.slice(0, 10) : '',
    })
    setEditingId(job.id)
    setShowForm(true)
  }

  useEffect(() => {
    if (!showForm) return
    const target = formRef.current
    if (target?.scrollIntoView) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [showForm, editingId])

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <PageHeader
        title={t('companyDashboard.title')}
        description={t('companyDashboard.description')}
        actions={
          <Button
            onClick={() => {
              resetForm()
              setShowForm(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('companyDashboard.postJob')}
          </Button>
        }
      />

      {showForm && (
        <div ref={formRef}>
          <JobPostingForm
            key={editingId ?? 'new-job'}
            initialForm={form}
            editingId={editingId}
            onClose={resetForm}
          />
        </div>
      )}

      {isError && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
          <span>{t('companyDashboard.loadFailed')}</span>
          <Button type="button" size="sm" variant="outline" onClick={() => refetch()}>
            {t('common.retry')}
          </Button>
        </div>
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-gray-100">
          {t('companyDashboard.jobPostings')}
        </h2>
        <JobPostingList
          jobs={jobsResponse?.data}
          isLoading={isLoading}
          onEdit={handleEdit}
          onShowApplicants={setApplicantsJobId}
        />
      </section>

      <ApplicantsModal
        jobId={applicantsJobId}
        open={!!applicantsJobId}
        onClose={() => setApplicantsJobId(null)}
      />
    </motion.div>
  )
}
