import * as React from 'react'
import { cn } from '../../lib/utils'

const variantStyles = {
  default: 'bg-primary-100 text-primary-800 dark:bg-primary-950/60 dark:text-primary-300',
  secondary: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
  success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300',
  destructive: 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300',
  outline: 'border border-slate-300 text-slate-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300',
}

function Badge({ className, variant = 'default', ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
        variantStyles[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
