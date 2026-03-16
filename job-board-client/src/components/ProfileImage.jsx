/**
 * Unified profile image component.
 * - Company users: profile image = company logo
 * - Job seekers: profile image = user avatar
 * Edit icon opens file selector. No separate upload sections.
 */
import { useEffect, useRef, useState } from 'react'
import { Pencil, Loader2, Trash2 } from 'lucide-react'
import api from '../api/axios'
import { cn } from '../lib/utils'
import toast from 'react-hot-toast'
import ImageCropDialog from './ImageCropDialog'
import { useI18n } from '../context/I18nContext'

const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:8000'

function getStorageUrl(path) {
  if (!path) return null
  const clean = path.replace(/^\/+/, '')
  if (clean.startsWith('http')) return clean
  return `${API_BASE}/storage/${clean}`
}

function appendCacheBuster(url, value) {
  if (!url || !value) return url
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}cb=${encodeURIComponent(String(value))}`
}

export default function ProfileImage({ user, onUpload, size = 'lg', showEdit = true, className = '' }) {
  const { t } = useI18n()
  const inputRef = useRef(null)
  const previewUrlRef = useRef(null)
  const cropUrlRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [imgError, setImgError] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [cropImageUrl, setCropImageUrl] = useState(null)
  const [cropFileName, setCropFileName] = useState('')

  const resetPreviewUrl = (nextUrl = null) => {
    setPreviewUrl((current) => {
      if (current) {
        window.URL.revokeObjectURL(current)
      }
      return nextUrl
    })
  }

  const cleanupCropState = () => {
    if (cropUrlRef.current) {
      window.URL.revokeObjectURL(cropUrlRef.current)
      cropUrlRef.current = null
    }
    setCropImageUrl(null)
    setCropFileName('')
  }

  // Reset image error whenever the user data changes (e.g. after avatar upload)
  useEffect(() => {
    setImgError(false)
    if (previewUrlRef.current) {
      window.URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = null
    }
    setPreviewUrl(null)
  }, [user?.avatar, user?.avatar_url, user?.company?.logo, user?.company?.logo_url])

  useEffect(() => {
    previewUrlRef.current = previewUrl
  }, [previewUrl])

  useEffect(() => () => {
    if (previewUrlRef.current) {
      window.URL.revokeObjectURL(previewUrlRef.current)
    }
    if (cropUrlRef.current) {
      window.URL.revokeObjectURL(cropUrlRef.current)
    }
  }, [])

  const isCompany = user?.role === 'company'
  const company = user?.company
  const userAvatarEndpoint = user?.id ? `${API_BASE}/api/users/${user.id}/avatar` : null
  const companyLogoEndpoint = company?.id ? `${API_BASE}/api/companies/${company.id}/logo` : null
  const hasCustomImage = isCompany && company
    ? Boolean(company?.logo)
    : Boolean(user?.avatar)
  const imageVersion = isCompany && company
    ? (company?.logo || company?.updated_at || user?.updated_at || null)
    : (user?.avatar || user?.updated_at || null)

  const baseDisplayUrl = isCompany && company
    ? companyLogoEndpoint || company?.logo_url || getStorageUrl(company.logo)
    : userAvatarEndpoint || user?.avatar_url || getStorageUrl(user?.avatar ? 'avatars/' + user.avatar : null)
  const displayUrl = previewUrl || (hasCustomImage ? appendCacheBuster(baseDisplayUrl, imageVersion) : null)
  const canDeletePhoto = Boolean(previewUrl || (hasCustomImage && !imgError))

  const initial = isCompany && company
    ? company.name?.charAt(0)?.toUpperCase() || '?'
    : user?.name?.charAt(0)?.toUpperCase() || 'U'

  const sizeClasses = {
    sm: 'h-10 w-10 text-sm',
    md: 'h-12 w-12 text-base',
    lg: 'h-20 w-20 text-xl',
  }

  const uploadAvatarFile = async (file) => {
    const formData = new FormData()
    formData.append('avatar', file)

    setUploading(true)
    setImgError(false)
    resetPreviewUrl(window.URL.createObjectURL(file))

    try {
      let data
      try {
        ({ data } = await api.post('/profile/upload-avatar', formData))
      } catch (err) {
        if (err?.response?.status !== 404) throw err

        const fallbackData = new FormData()
        fallbackData.append('_method', 'PUT')
        fallbackData.append('name', user?.name || '')
        fallbackData.append('avatar', file)
        const response = await api.post('/user/profile', fallbackData)
        data = response.data
      }

      setImgError(false)
      await onUpload?.(data)
      toast.success(t('profileImage.uploadSuccess'))
      cleanupCropState()
      if (inputRef.current) inputRef.current.value = ''
    } catch (err) {
      resetPreviewUrl(null)
      previewUrlRef.current = null
      const msg = err.response?.data?.message
        || err.response?.data?.errors?.avatar?.[0]
        || t('profileImage.uploadFailed')
      toast.error(msg)
    } finally {
      setUploading(false)
    }
  }

  const handleClick = () => {
    if (uploading || deleting || !showEdit) return
    inputRef.current?.click()
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      toast.error(t('profileImage.invalidType'))
      e.target.value = ''
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t('profileImage.tooLarge'))
      e.target.value = ''
      return
    }

    cleanupCropState()
    const objectUrl = window.URL.createObjectURL(file)
    cropUrlRef.current = objectUrl
    setCropImageUrl(objectUrl)
    setCropFileName(file.name)
  }

  const handleDelete = async () => {
    if (uploading || deleting || !showEdit || !canDeletePhoto) return

    const confirmed = confirm(isCompany
      ? t('profileImage.removeConfirmCompany')
      : t('profileImage.removeConfirmUser'))
    if (!confirmed) return

    setDeleting(true)
    try {
      let data
      try {
        ({ data } = await api.delete('/profile/avatar'))
      } catch (err) {
        if (err?.response?.status !== 404) throw err

        const fallbackData = new FormData()
        fallbackData.append('_method', 'PUT')
        fallbackData.append('name', user?.name || '')
        fallbackData.append('remove_avatar', '1')
        const response = await api.post('/user/profile', fallbackData)
        data = response.data
      }
      resetPreviewUrl(null)
      previewUrlRef.current = null
      cleanupCropState()
      setImgError(false)
      await onUpload?.(data)
      toast.success(t('profileImage.removeSuccess'))
    } catch (err) {
      const msg = err.response?.data?.message || t('profileImage.removeError')
      toast.error(msg)
    } finally {
      setDeleting(false)
    }
  }

  const wrapperClass = cn(
    'relative inline-block rounded-full overflow-hidden shrink-0',
    'bg-primary-100 text-primary-700 font-semibold ring-2 ring-slate-200 dark:ring-gray-700',
    'flex items-center justify-center',
    showEdit && 'cursor-pointer hover:ring-primary-400 transition-all',
    sizeClasses[size],
    className
  )

  return (
    <div className="inline-flex flex-col items-center gap-2">
      <ImageCropDialog
        open={Boolean(cropImageUrl)}
        imageUrl={cropImageUrl}
        fileName={cropFileName}
        loading={uploading}
        onClose={() => {
          cleanupCropState()
          if (inputRef.current) inputRef.current.value = ''
        }}
        onConfirm={uploadAvatarFile}
      />

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png"
        className="hidden"
        onChange={handleFileChange}
      />

      <button
        type="button"
        onClick={handleClick}
        className={cn(
          'rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
          !showEdit && 'cursor-default'
        )}
        disabled={!showEdit || deleting}
      >
        <div className={wrapperClass}>
          {displayUrl && !imgError ? (
            <img
              src={displayUrl}
              alt={isCompany ? company?.name : user?.name}
              className="h-full w-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <span aria-hidden>{initial}</span>
          )}
          {showEdit && (
            <span className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary-600 text-white shadow-md hover:bg-primary-700">
              {uploading || deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Pencil className="h-4 w-4" />
              )}
            </span>
          )}
        </div>
      </button>

      {showEdit && canDeletePhoto && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={uploading || deleting}
          className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Trash2 className="h-3.5 w-3.5" />
          {deleting ? t('profileImage.removing') : t('profileImage.deletePhoto')}
        </button>
      )}
    </div>
  )
}
