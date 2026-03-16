import { useState } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../lib/utils'

function getOwnerAvatarUrl(filename) {
  if (!filename) return null
  const base = import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:8000'
  return `${base}/storage/avatars/${filename}`
}

function getStorageUrl(path) {
  if (!path) return null
  const base = import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:8000'
  const clean = String(path).replace(/^\/+/, '')
  return clean.startsWith('http') ? clean : `${base}/storage/${clean}`
}

function appendCacheBuster(url, value) {
  if (!url || !value) return url
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}cb=${encodeURIComponent(String(value))}`
}

export default function CompanyLogo({ company, className = '', size = 'md', rounded = 'lg', linkTo = true }) {
  const initial = company?.name?.charAt(0)?.toUpperCase() || '?'
  const [imgError, setImgError] = useState(false)
  const apiBase = import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:8000'
  const companyLogoEndpoint = company?.id ? `${apiBase}/api/companies/${company.id}/logo` : null
  const companyPublicPath = company?.slug || company?.id

  const hasCompanyLogo = Boolean(company?.logo || company?.logo_url)
  const imageVersion = company?.logo || company?.owner_avatar || company?.updated_at || null
  const baseDisplayUrl = hasCompanyLogo
    ? (companyLogoEndpoint || company?.logo_url || getStorageUrl(company?.logo))
    : ((company?.owner_avatar ? getOwnerAvatarUrl(company.owner_avatar) : null) || company?.owner_avatar_url)
  const displayUrl = appendCacheBuster(baseDisplayUrl, imageVersion)

  const sizeClasses = {
    xs: 'h-8 w-8 text-xs',
    sm: 'h-10 w-10 text-xs',
    md: 'h-12 w-12 text-sm',
    lg: 'h-14 w-14 text-lg',
  }

  const roundedClasses = {
    full: 'rounded-full',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
  }

  const Wrapper = linkTo && companyPublicPath ? Link : 'div'
  const wrapperProps = linkTo && companyPublicPath ? { to: `/companies/${companyPublicPath}` } : {}

  return (
    <Wrapper
      {...wrapperProps}
      className={cn(
        'shrink-0 bg-primary-100 text-primary-700 font-semibold ring-1 ring-primary-100/60 overflow-hidden flex items-center justify-center',
        linkTo && companyPublicPath && 'hover:ring-2 hover:ring-primary-400 transition-all',
        sizeClasses[size] || sizeClasses.md,
        roundedClasses[rounded] || roundedClasses.lg,
        className
      )}
    >
      {displayUrl && !imgError ? (
        <img
          src={displayUrl}
          alt={company?.name}
          className={cn('h-full w-full object-cover', roundedClasses[rounded] || roundedClasses.lg)}
          onError={() => setImgError(true)}
          loading="lazy"
        />
      ) : (
        <span aria-hidden>{initial}</span>
      )}
    </Wrapper>
  )
}

