import { cn } from '../lib/utils'

export default function PageHeader({ title, description, actions, className }) {
  return (
    <div
      className={cn(
        'mb-8 flex flex-col gap-4 border-b border-slate-200/80 pb-6 dark:border-gray-800',
        'sm:flex-row sm:items-end sm:justify-between',
        className
      )}
    >
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl text-sm text-slate-600 dark:text-gray-400 sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  )
}
