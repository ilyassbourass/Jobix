import { Avatar, AvatarFallback, AvatarImage } from './ui/Avatar'

const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:8000'
function getStorageUrl(path) {
  if (!path) return null
  const clean = path.replace(/^\/+/, '')
  return clean.startsWith('http') ? clean : `${API_BASE}/storage/${clean}`
}

function appendCacheBuster(url, value) {
  if (!url || !value) return url
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}cb=${encodeURIComponent(String(value))}`
}

export default function UserAvatar({ user, size = 'md', className = '', fallbackDelayMs = 0 }) {
  const isCompany = user?.role === 'company'
  const company = user?.company
  const userAvatarEndpoint = user?.id ? `${API_BASE}/api/users/${user.id}/avatar` : null
  const companyLogoEndpoint = company?.id ? `${API_BASE}/api/companies/${company.id}/logo` : null
  const hasCustomImage = isCompany && company
    ? Boolean(company?.logo || company?.logo_url)
    : Boolean(user?.avatar || user?.avatar_url)
  const imageVersion = isCompany && company
    ? (company?.logo || company?.updated_at || user?.updated_at || null)
    : (user?.avatar || user?.updated_at || null)
  const baseSrc = isCompany && company
    ? (companyLogoEndpoint || company?.logo_url || getStorageUrl(company.logo))
    : (userAvatarEndpoint || user?.avatar_url || getStorageUrl(user?.avatar ? 'avatars/' + user.avatar : null))
  const src = hasCustomImage ? appendCacheBuster(baseSrc, imageVersion) : null

  const initial = isCompany && company
    ? company.name?.charAt(0)?.toUpperCase() || '?'
    : user?.name?.charAt(0)?.toUpperCase() || 'U'

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-9 w-9',
    lg: 'h-12 w-12',
  }

  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      <AvatarImage src={src} alt={user?.name} loading="eager" decoding="async" />
      <AvatarFallback
        delayMs={fallbackDelayMs}
        className="bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200"
      >
        {initial}
      </AvatarFallback>
    </Avatar>
  )
}
