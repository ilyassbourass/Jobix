import { Card, CardContent } from './ui/Card'

export default function StatCard({ label, value, icon: Icon, accentClass = 'text-primary-600' }) {
  return (
    <Card className="overflow-hidden border border-slate-200 bg-white transition-shadow hover:shadow-soft dark:border-slate-800/80 dark:bg-slate-900/75">
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{value ?? 0}</p>
          </div>
          <div
            className={`rounded-xl bg-slate-100 p-3 ${accentClass} dark:bg-slate-800/90 dark:ring-1 dark:ring-slate-700/80`}
          >
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

