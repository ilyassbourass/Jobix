import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Bell, Briefcase, CheckCheck, UserRoundSearch, X } from 'lucide-react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { Button } from './ui/Button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from './ui/DropdownMenu'
import { cn } from '../lib/utils'
import { useI18n } from '../context/I18nContext'

function formatRelativeTime(timestamp, t, locale) {
  if (!timestamp) return ''

  const date = new Date(timestamp)
  const diffMs = date.getTime() - Date.now()
  const diffMinutes = Math.round(diffMs / 60000)
  const absMinutes = Math.abs(diffMinutes)

  if (absMinutes < 1) return t('notifications.justNow')
  if (absMinutes < 60) return t('notifications.minutesAgo', { count: absMinutes })

  const absHours = Math.round(absMinutes / 60)
  if (absHours < 24) return t('notifications.hoursAgo', { count: absHours })

  const absDays = Math.round(absHours / 24)
  if (absDays < 7) return t('notifications.daysAgo', { count: absDays })

  return date.toLocaleDateString(locale)
}

function iconForNotification(type) {
  if (type === 'application_received') return Briefcase
  if (type === 'application_status_changed') return UserRoundSearch
  return Bell
}

function markNotificationAsRead(oldData, id) {
  if (!oldData?.data) return oldData

  let unreadRemoved = 0
  const updated = oldData.data.map((notification) => {
    if (notification.id !== id || notification.read_at) return notification

    unreadRemoved += 1

    return {
      ...notification,
      read_at: new Date().toISOString(),
    }
  })

  return {
    ...oldData,
    data: updated,
    unread_count: Math.max((oldData.unread_count || 0) - unreadRemoved, 0),
  }
}

function markAllNotificationsAsRead(oldData) {
  if (!oldData?.data) return oldData

  const readAt = new Date().toISOString()

  return {
    ...oldData,
    unread_count: 0,
    data: oldData.data.map((notification) => ({
      ...notification,
      read_at: notification.read_at || readAt,
    })),
  }
}

function removeNotification(oldData, id) {
  if (!oldData?.data) return oldData

  const removed = oldData.data.find((notification) => notification.id === id)
  const updated = oldData.data.filter((notification) => notification.id !== id)
  const unreadDelta = removed && !removed.read_at ? 1 : 0

  return {
    ...oldData,
    data: updated,
    unread_count: Math.max((oldData.unread_count || 0) - unreadDelta, 0),
  }
}

function clearNotifications(oldData) {
  if (!oldData?.data) return oldData

  return {
    ...oldData,
    data: [],
    unread_count: 0,
  }
}

export default function NotificationMenu({ user }) {
  const { t, locale } = useI18n()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const queryKey = useMemo(() => ['notifications', user?.id ?? 'guest'], [user?.id])

  const { data, refetch, isFetching, isError } = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await api.get('/notifications?per_page=8')
      return response.data
    },
    enabled: Boolean(user),
    staleTime: 30000,
  })

  const markReadMutation = useMutation({
    mutationFn: async (notificationId) => {
      const response = await api.post(`/notifications/${notificationId}/read`)
      return response.data
    },
    onSuccess: (notification) => {
      queryClient.setQueryData(queryKey, (oldData) => markNotificationAsRead(oldData, notification.id))
    },
    onError: () => {
      toast.error(t('notifications.actionFailed'))
    },
  })

  const markAllMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/notifications/read-all')
      return response.data
    },
    onSuccess: () => {
      queryClient.setQueryData(queryKey, (oldData) => markAllNotificationsAsRead(oldData))
    },
    onError: () => {
      toast.error(t('notifications.actionFailed'))
    },
  })

  const clearAllMutation = useMutation({
    mutationFn: async () => {
      const response = await api.delete('/notifications')
      return response.data
    },
    onSuccess: () => {
      queryClient.setQueryData(queryKey, (oldData) => clearNotifications(oldData))
    },
    onError: () => {
      toast.error(t('notifications.actionFailed'))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (notificationId) => {
      const response = await api.delete(`/notifications/${notificationId}`)
      return response.data
    },
    onSuccess: (_, notificationId) => {
      queryClient.setQueryData(queryKey, (oldData) => removeNotification(oldData, notificationId))
    },
    onError: () => {
      toast.error(t('notifications.actionFailed'))
    },
  })

  if (!user) return null

  const notifications = data?.data || []
  const unreadCount = data?.unread_count || 0
  const deletingNotificationId = deleteMutation.isPending ? deleteMutation.variables : null

  const handleNotificationClick = async (notification) => {
    if (!notification.read_at) {
      try {
        await markReadMutation.mutateAsync(notification.id)
      } catch {
        // Keep navigation working even if marking as read fails.
      }
    }

    if (notification.action_url) {
      navigate(notification.action_url)
    }
  }

  return (
    <DropdownMenu onOpenChange={(open) => open && refetch()}>
      <DropdownMenuTrigger asChild>
        <button
          className="relative rounded-xl border border-slate-200/80 bg-white/70 p-2 shadow-sm transition hover:bg-slate-100 dark:border-gray-700/80 dark:bg-gray-900/70 dark:hover:bg-gray-800 md:rounded-lg md:border-0 md:bg-transparent md:shadow-none"
          aria-label={t('notifications.openAria')}
        >
          <Bell className="h-5 w-5 text-slate-700 dark:text-slate-200" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-primary-600 px-1 text-[11px] font-semibold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[calc(100vw-1.5rem)] max-w-[360px] p-0">
        <div className="border-b border-slate-200 px-4 py-3 dark:border-gray-700">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{t('notifications.title')}</p>
              <p className="text-xs text-slate-500 dark:text-gray-400">
                {unreadCount > 0
                  ? unreadCount === 1
                    ? t('notifications.unreadSingle', { count: unreadCount })
                    : t('notifications.unreadPlural', { count: unreadCount })
                  : t('notifications.caughtUp')}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-8 px-2 text-xs"
                disabled={unreadCount === 0 || markAllMutation.isPending}
                onClick={() => markAllMutation.mutate()}
              >
                <CheckCheck className="mr-1.5 h-4 w-4" />
                {t('notifications.markAll')}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-8 px-2 text-xs text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white"
                disabled={notifications.length === 0 || clearAllMutation.isPending}
                onClick={() => clearAllMutation.mutate()}
              >
                {t('notifications.clear')}
              </Button>
            </div>
          </div>
        </div>

        <div className="max-h-[420px] overflow-y-auto">
          {isError ? (
            <div className="px-4 py-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-gray-800">
                <Bell className="h-5 w-5 text-slate-500 dark:text-gray-400" />
              </div>
              <p className="mt-3 text-sm font-medium text-slate-800 dark:text-gray-200">
                {t('notifications.loadFailed')}
              </p>
              <Button type="button" size="sm" variant="outline" className="mt-4" onClick={() => refetch()}>
                {t('common.retry')}
              </Button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-gray-800">
                <Bell className="h-5 w-5 text-slate-500 dark:text-gray-400" />
              </div>
              <p className="mt-3 text-sm font-medium text-slate-800 dark:text-gray-200">
                {t('notifications.emptyTitle')}
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">
                {t('notifications.emptyBody')}
              </p>
            </div>
          ) : (
            notifications.map((notification, index) => {
              const Icon = iconForNotification(notification.type)

              return (
                <div
                  key={notification.id}
                  className={cn(
                    'flex items-start gap-3 px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-gray-800/80',
                    index !== notifications.length - 1 && 'border-b border-slate-200 dark:border-gray-700/70'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => handleNotificationClick(notification)}
                    className="flex min-w-0 flex-1 items-start gap-3 text-left"
                  >
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-primary-600 dark:bg-gray-800 dark:text-primary-300">
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {notification.title}
                        </p>
                        {!notification.read_at && (
                          <span className="mt-1 inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-primary-500" />
                        )}
                      </div>
                      <p className="mt-1 text-sm leading-5 text-slate-600 dark:text-gray-300">
                        {notification.message}
                      </p>
                      <p className="mt-2 text-xs text-slate-500 dark:text-gray-400">
                        {formatRelativeTime(notification.created_at, t, locale)}
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(notification.id)}
                    disabled={deletingNotificationId === notification.id}
                    className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                    aria-label={t('notifications.dismissAria')}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )
            })
          )}
        </div>

        {isFetching && (
          <div className="border-t border-slate-200 px-4 py-2 text-xs text-slate-500 dark:border-gray-700 dark:text-gray-400">
            {t('notifications.updating')}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
