import { Search, MapPin, Briefcase, Filter, X } from 'lucide-react'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Select } from './ui/Select'
import { EXPERIENCE_LEVELS, WORK_MODES } from '../constants'
import { useI18n } from '../context/I18nContext'

export default function SearchBar({
  filters,
  onFiltersChange,
  categories = [],
  jobTypes = {},
}) {
  const { t, tOption } = useI18n()
  const hasActiveFilters =
    filters.search ||
    filters.location ||
    filters.category_id ||
    filters.job_type ||
    filters.salary_min ||
    filters.salary_max ||
    filters.work_mode ||
    filters.experience_level

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      location: '',
      category_id: '',
      job_type: '',
      salary_min: '',
      salary_max: '',
      work_mode: '',
      experience_level: '',
      page: 1,
    })
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card dark:border-gray-700 dark:bg-gray-800 md:p-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            placeholder={t('search.keyword')}
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value, page: 1 })}
            className="pl-10"
          />
        </div>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            placeholder={t('search.location')}
            value={filters.location}
            onChange={(e) => onFiltersChange({ ...filters, location: e.target.value, page: 1 })}
            className="pl-10"
          />
        </div>
        <div className="relative">
          <Briefcase className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Select
            value={filters.category_id}
            onChange={(e) =>
              onFiltersChange({ ...filters, category_id: e.target.value, page: 1 })
            }
            className="pl-10 pr-8"
          >
            <option value="">{t('search.categories')}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Select
            value={filters.job_type}
            onChange={(e) =>
              onFiltersChange({ ...filters, job_type: e.target.value, page: 1 })
            }
            className="pl-10 pr-8"
          >
            <option value="">{t('search.types')}</option>
            {Object.entries(jobTypes).map(([k, v]) => (
              <option key={k} value={k}>
                {tOption('jobTypes', k, v)}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="relative">
          <Input
            type="number"
            min="0"
            placeholder={t('search.minSalary')}
            value={filters.salary_min || ''}
            onChange={(e) => onFiltersChange({ ...filters, salary_min: e.target.value, page: 1 })}
          />
        </div>
        <div className="relative">
          <Input
            type="number"
            min="0"
            placeholder={t('search.maxSalary')}
            value={filters.salary_max || ''}
            onChange={(e) => onFiltersChange({ ...filters, salary_max: e.target.value, page: 1 })}
          />
        </div>
        <div>
          <Select
            value={filters.work_mode || ''}
            onChange={(e) => onFiltersChange({ ...filters, work_mode: e.target.value, page: 1 })}
          >
            <option value="">{t('search.workMode')}</option>
            {Object.entries(WORK_MODES).map(([k, v]) => (
              <option key={k} value={k}>
                {tOption('workModes', k, v)}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Select
            value={filters.experience_level || ''}
            onChange={(e) =>
              onFiltersChange({ ...filters, experience_level: e.target.value, page: 1 })
            }
          >
            <option value="">{t('search.experience')}</option>
            {Object.entries(EXPERIENCE_LEVELS).map(([k, v]) => (
              <option key={k} value={k}>
                {tOption('experience', k, v)}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-slate-600"
          >
            <X className="mr-2 h-4 w-4" />
            {t('search.clear')}
          </Button>
        )}
      </div>
    </div>
  )
}
