import { useMemo } from 'react'
import { Clock } from 'lucide-react'
import { useI18n } from '../context/I18nContext'

function formatPostedTime(publishedAt, t) {
  if (!publishedAt) return null
  const date = new Date(publishedAt)
  if (Number.isNaN(date.getTime())) return null

  const diffMs = Date.now() - date.getTime()
  const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
  if (diffDays === 0) return t('posted.today')
  if (diffDays === 1) return t('posted.oneDay')
  return t('posted.days', { count: diffDays })
}

export default function PostedTime({ publishedAt, className = '' }) {
  const { t } = useI18n()
  const label = useMemo(() => formatPostedTime(publishedAt, t), [publishedAt, t])
  if (!label) return null
  return (
    <span className={`inline-flex items-center gap-1 text-xs text-slate-500 dark:text-gray-400 ${className}`}>
      <Clock className="h-3.5 w-3.5" />
      {label}
    </span>
  )
}

