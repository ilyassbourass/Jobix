import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Building2, Download, Mail, ShieldCheck, User2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import PageHeader from '../components/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { PasswordInput } from '../components/ui/PasswordInput'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import ProfileImage from '../components/ProfileImage'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { useI18n } from '../context/I18nContext'
import { WORK_MODES } from '../constants'

const getFilenameFromHeaders = (headers = {}) => {
  const contentDisposition = headers['content-disposition'] || headers['Content-Disposition']
  if (!contentDisposition) return null

  const utfMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utfMatch?.[1]) return decodeURIComponent(utfMatch[1]).replace(/["']/g, '')

  const simpleMatch = contentDisposition.match(/filename="?([^"]+)"?/i)
  if (simpleMatch?.[1]) return simpleMatch[1]

  return null
}

export default function Profile() {
  const { user, refreshUser } = useAuth()
  const { t, tOption } = useI18n()
  const resumeInputRef = useRef(null)
  const [form, setForm] = useState({
    name: '',
    username: '',
    phone: '',
    current_password: '',
    password: '',
    password_confirmation: '',
    bio: '',
    headline: '',
    seniority: '',
    availability: '',
    preferred_work_mode: '',
    experience: '',
    projects: '',
    skills_with_level: '',
    skills: '',
    location: '',
    linkedin_url: '',
    github_url: '',
    portfolio_url: '',
    company_name: '',
    company_description: '',
    company_website: '',
    company_location: '',
    company_industry: '',
  })
  const [resumeFile, setResumeFile] = useState(null)
  const [downloadingResume, setDownloadingResume] = useState(false)
  const [removingResume, setRemovingResume] = useState(false)

  const { data: selfProfile, refetch: refetchSelfProfile } = useQuery({
    queryKey: ['selfProfile'],
    queryFn: async () => {
      const { data } = await api.get('/user/profile')
      return data
    },
    enabled: !!user,
  })

  useEffect(() => {
    if (!user) return

    setForm({
      name: user.name || '',
      username: user.username || '',
      phone: user.phone || '',
      current_password: '',
      password: '',
      password_confirmation: '',
      bio: user.bio || '',
      headline: user.headline || '',
      seniority: user.seniority || '',
      availability: user.availability || '',
      preferred_work_mode: user.preferred_work_mode || '',
      experience: user.experience || '',
      projects: user.projects || '',
      skills_with_level: user.skills_with_level || '',
      skills: user.skills || '',
      location: user.location || '',
      linkedin_url: user.linkedin_url || '',
      github_url: user.github_url || '',
      portfolio_url: user.portfolio_url || '',
      company_name: user.company?.name || '',
      company_description: user.company?.description || '',
      company_website: user.company?.website || '',
      company_location: user.company?.location || '',
      company_industry: user.company?.industry || '',
    })
  }, [user])

  const handleChange = (e) => {
    const nextValue =
      e.target.name === 'username'
        ? e.target.value.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
        : e.target.value

    setForm((prev) => ({
      ...prev,
      [e.target.name]: nextValue,
    }))
  }

  const updateMutation = useMutation({
    mutationFn: async (formData) => api.post('/user/profile', formData),
    onSuccess: async () => {
      await Promise.all([refreshUser(), refetchSelfProfile()])
      toast.success(t('profile.profileUpdated'))
      setResumeFile(null)
      if (resumeInputRef.current) resumeInputRef.current.value = ''
      setForm((prev) => ({
        ...prev,
        current_password: '',
        password: '',
        password_confirmation: '',
      }))
    },
    onError: (err) => {
      const errors = err?.response?.data?.errors
      if (errors && typeof errors === 'object') {
        const firstMessage = Object.values(errors).flat().find(Boolean)
        toast.error(firstMessage || err.response?.data?.message || t('profile.updateFailed'))
        return
      }
      toast.error(err.response?.data?.message || t('profile.updateFailed'))
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()

    const formData = new FormData()
    formData.append('_method', 'PUT')
    formData.append('name', form.name)
    if (form.username) formData.append('username', form.username)
    if (form.phone) formData.append('phone', form.phone)

    if (form.password) {
      if (!form.current_password) {
        toast.error(t('profile.currentPasswordRequired'))
        return
      }
      formData.append('current_password', form.current_password)
      formData.append('password', form.password)
      formData.append('password_confirmation', form.password_confirmation)
    }

    if (user.role === 'job_seeker') {
      formData.append('bio', form.bio)
      formData.append('headline', form.headline)
      formData.append('seniority', form.seniority)
      formData.append('availability', form.availability)
      formData.append('preferred_work_mode', form.preferred_work_mode)
      formData.append('experience', form.experience)
      formData.append('projects', form.projects)
      formData.append('skills_with_level', form.skills_with_level)
      formData.append('skills', form.skills)
      formData.append('location', form.location)
      formData.append('linkedin_url', form.linkedin_url)
      formData.append('github_url', form.github_url)
      formData.append('portfolio_url', form.portfolio_url)
      if (resumeFile) formData.append('resume', resumeFile)
    }

    if (user.role === 'company') {
      formData.append('company_name', form.company_name)
      formData.append('company_description', form.company_description)
      formData.append('company_website', form.company_website)
      formData.append('company_location', form.company_location)
      formData.append('company_industry', form.company_industry)
    }

    updateMutation.mutate(formData)
  }

  const handleDownloadResume = async () => {
    const hasSavedResume = Boolean(
      selfProfile?.has_resume ??
        user?.has_resume ??
        selfProfile?.resume_path ??
        user?.resume_path ??
        selfProfile?.resume_filename ??
        user?.resume_filename
    )
    if (!hasSavedResume) return

    const profileKey = selfProfile?.username || user?.username || selfProfile?.id || user?.id
    if (!profileKey) {
      toast.error(t('profile.downloadResolveError'))
      return
    }

    setDownloadingResume(true)
    try {
      const response = await api.get(`/users/${profileKey}/resume`, { responseType: 'blob' })
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      const safeName = (user?.name || 'resume').replace(/[^a-z0-9_-]+/gi, '-')
      const headerName = getFilenameFromHeaders(response.headers)
      const fallbackExt = (selfProfile?.resume_filename || user?.resume_filename)?.split('.').pop()
      const fallbackName = fallbackExt ? `${safeName}-resume.${fallbackExt}` : `${safeName}-resume.pdf`
      link.href = blobUrl
      link.setAttribute('download', headerName || selfProfile?.resume_filename || user?.resume_filename || fallbackName)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(blobUrl)
    } catch (err) {
      const status = err?.response?.status
      if (status === 404) {
        toast.error(t('profile.resumeNotFound'))
      } else {
        toast.error(t('profile.resumeDownloadError'))
      }
    } finally {
      setDownloadingResume(false)
    }
  }

  const handleRemoveResume = async () => {
    const hasSavedResume = Boolean(
      selfProfile?.has_resume ??
        user?.has_resume ??
        selfProfile?.resume_path ??
        user?.resume_path ??
        selfProfile?.resume_filename ??
        user?.resume_filename
    )
    if (!hasSavedResume) return
    if (!confirm(t('profile.resumeRemoveConfirm'))) return

    setRemovingResume(true)
    try {
      await api.delete('/user/resume')
      await Promise.all([refreshUser(), refetchSelfProfile()])
      setResumeFile(null)
      if (resumeInputRef.current) resumeInputRef.current.value = ''
      toast.success(t('profile.resumeRemoved'))
    } catch (err) {
      toast.error(err?.response?.data?.message || t('profile.resumeRemoveError'))
    } finally {
      setRemovingResume(false)
    }
  }

  if (!user) return null

  const hasSavedResume = Boolean(
    selfProfile?.has_resume ??
      user?.has_resume ??
      selfProfile?.resume_path ??
      user?.resume_path ??
      selfProfile?.resume_filename ??
      user?.resume_filename
  )
  const currentResumeName = selfProfile?.resume_filename || user?.resume_filename
  const roleLabel = tOption('roles', user.role, user.role?.replace('_', ' '))

  const labelClass = 'mb-1 block text-sm font-medium text-slate-700 dark:text-gray-300'
  const sectionClass = 'border-t border-slate-200 pt-6 dark:border-gray-700'

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-5xl">
      <PageHeader
        title={t('profile.title')}
        description={t('profile.description')}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card className="lg:sticky lg:top-20">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <ProfileImage user={user} onUpload={(data) => refreshUser(data)} size="lg" />
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold text-slate-900 dark:text-gray-100">{user.name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="inline-flex items-center gap-1">
                      <User2 className="h-3.5 w-3.5" />
                      {roleLabel}
                    </Badge>
                    {user.role === 'admin' && (
                      <Badge variant="secondary" className="inline-flex items-center gap-1">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        {t('profile.roleAdmin')}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3 text-sm">
                <div className="flex items-start gap-2 text-slate-700 dark:text-gray-300">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <div className="min-w-0">
                    <p className="text-slate-500 dark:text-gray-400">{t('profile.email')}</p>
                    <p className="truncate font-medium">{user.email}</p>
                  </div>
                </div>

                {user.company && (
                  <div className="flex items-start gap-2 text-slate-700 dark:text-gray-300">
                    <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    <div className="min-w-0">
                      <p className="text-slate-500 dark:text-gray-400">{t('profile.company')}</p>
                      <p className="truncate font-medium">{user.company.name}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{t('profile.editProfile')}</CardTitle>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>{t('profile.name')}</label>
                    <Input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder={t('profile.namePlaceholder')}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>{t('profile.username')}</label>
                    <Input
                      name="username"
                      value={form.username}
                      onChange={handleChange}
                      placeholder={t('profile.usernamePlaceholder')}
                    />
                    <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">
                      {t('auth.usernameHint')}
                    </p>
                  </div>
                  <div>
                    <label className={labelClass}>{t('profile.phone')}</label>
                    <Input
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder={t('profile.phonePlaceholder')}
                    />
                  </div>
                </div>

                {user.role === 'job_seeker' && (
                  <div className={sectionClass}>
                    <p className="mb-3 text-sm font-semibold text-slate-900 dark:text-gray-100">
                      {t('profile.profileSection')}
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className={labelClass}>{t('profile.headline')}</label>
                        <Input
                          name="headline"
                          value={form.headline}
                          onChange={handleChange}
                          placeholder={t('profile.headlinePlaceholder')}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className={labelClass}>{t('profile.bio')}</label>
                        <Textarea
                          name="bio"
                          value={form.bio}
                          onChange={handleChange}
                          placeholder={t('profile.bioPlaceholder')}
                          rows={4}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>{t('profile.seniority')}</label>
                        <Input
                          name="seniority"
                          value={form.seniority}
                          onChange={handleChange}
                          placeholder={t('profile.seniorityPlaceholder')}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>{t('profile.availability')}</label>
                        <Input
                          name="availability"
                          value={form.availability}
                          onChange={handleChange}
                          placeholder={t('profile.availabilityPlaceholder')}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>{t('profile.preferredWorkMode')}</label>
                        <Select
                          name="preferred_work_mode"
                          value={form.preferred_work_mode}
                          onChange={handleChange}
                        >
                          <option value="">{t('profile.notSpecified')}</option>
                          {Object.entries(WORK_MODES).map(([value, label]) => (
                            <option key={value} value={value}>
                              {tOption('workModes', value, label)}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className={labelClass}>{t('profile.experienceDetails')}</label>
                        <Textarea
                          name="experience"
                          value={form.experience}
                          onChange={handleChange}
                          placeholder={t('profile.experiencePlaceholder')}
                          rows={3}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className={labelClass}>{t('profile.projects')}</label>
                        <Textarea
                          name="projects"
                          value={form.projects}
                          onChange={handleChange}
                          placeholder={t('profile.projectsPlaceholder')}
                          rows={3}
                        />
                        <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">
                          {t('profile.projectsHint')}
                        </p>
                      </div>
                      <div>
                        <label className={labelClass}>{t('profile.skills')}</label>
                        <Input
                          name="skills"
                          value={form.skills}
                          onChange={handleChange}
                          placeholder={t('profile.skillsPlaceholder')}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>{t('profile.skillsWithLevel')}</label>
                        <Input
                          name="skills_with_level"
                          value={form.skills_with_level}
                          onChange={handleChange}
                          placeholder={t('profile.skillsWithLevelPlaceholder')}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>{t('profile.location')}</label>
                        <Input
                          name="location"
                          value={form.location}
                          onChange={handleChange}
                          placeholder={t('profile.locationPlaceholder')}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>{t('profile.linkedin')}</label>
                        <Input
                          name="linkedin_url"
                          value={form.linkedin_url}
                          onChange={handleChange}
                          placeholder={t('profile.linkedinPlaceholder')}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>{t('profile.github')}</label>
                        <Input
                          name="github_url"
                          value={form.github_url}
                          onChange={handleChange}
                          placeholder={t('profile.githubPlaceholder')}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className={labelClass}>{t('profile.portfolio')}</label>
                        <Input
                          name="portfolio_url"
                          value={form.portfolio_url}
                          onChange={handleChange}
                          placeholder={t('profile.portfolioPlaceholder')}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className={labelClass}>{t('profile.resume')}</label>
                        <input
                          ref={resumeInputRef}
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                          className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-slate-900 hover:file:bg-slate-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:file:bg-gray-700 dark:file:text-gray-200"
                        />
                        {resumeFile && (
                          <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">
                            {t('profile.selected', { name: resumeFile.name })}
                          </p>
                        )}
                        {!resumeFile && (
                          <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-300">
                            {hasSavedResume ? (
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span>
                                  {t('profile.currentResume', {
                                    name: currentResumeName || t('profile.resumeOnFile'),
                                  })}
                                </span>
                                <div className="flex items-center gap-2">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={handleDownloadResume}
                                    disabled={downloadingResume}
                                    className="h-8"
                                  >
                                    <Download className="mr-1 h-3.5 w-3.5" />
                                    {downloadingResume ? t('profile.preparing') : t('profile.download')}
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="destructive"
                                    onClick={handleRemoveResume}
                                    disabled={removingResume}
                                    className="h-8"
                                  >
                                    {removingResume ? t('profile.removing') : t('profile.remove')}
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <span>{t('profile.noResume')}</span>
                            )}
                          </div>
                        )}
                        {resumeFile && (
                          <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                            {t('profile.clickSaveResume')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {user.role === 'company' && (
                  <div className={sectionClass}>
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-900 dark:text-gray-100">
                        {t('profile.companyInfo')}
                      </p>
                      <Badge variant="secondary">{t('profile.companyBadge')}</Badge>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className={labelClass}>{t('profile.companyName')}</label>
                        <Input
                          name="company_name"
                          value={form.company_name}
                          onChange={handleChange}
                          placeholder={t('profile.companyName')}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>{t('profile.website')}</label>
                        <Input
                          name="company_website"
                          value={form.company_website}
                          onChange={handleChange}
                          placeholder={t('profile.portfolioPlaceholder')}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>{t('profile.companyLocation')}</label>
                        <Input
                          name="company_location"
                          value={form.company_location}
                          onChange={handleChange}
                          placeholder={t('profile.locationPlaceholder')}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>{t('profile.companyIndustry')}</label>
                        <Input
                          name="company_industry"
                          value={form.company_industry}
                          onChange={handleChange}
                          placeholder={t('profile.companyIndustry')}
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className={labelClass}>{t('profile.companyDescription')}</label>
                      <Textarea
                        name="company_description"
                        value={form.company_description}
                        onChange={handleChange}
                        placeholder={t('profile.companyDescriptionPlaceholder')}
                        rows={4}
                      />
                    </div>
                  </div>
                )}

                <div className={sectionClass}>
                  <p className="mb-3 text-sm font-semibold text-slate-900 dark:text-gray-100">{t('profile.security')}</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className={labelClass}>{t('profile.currentPassword')}</label>
                      <PasswordInput
                        name="current_password"
                        value={form.current_password}
                        onChange={handleChange}
                        placeholder={t('profile.currentPasswordPlaceholder')}
                        showLabel={t('auth.showPassword')}
                        hideLabel={t('auth.hidePassword')}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>{t('profile.newPassword')}</label>
                      <PasswordInput
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        placeholder={t('profile.newPasswordPlaceholder')}
                        showLabel={t('auth.showPassword')}
                        hideLabel={t('auth.hidePassword')}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>{t('profile.confirmPassword')}</label>
                      <PasswordInput
                        name="password_confirmation"
                        value={form.password_confirmation}
                        onChange={handleChange}
                        placeholder={t('profile.confirmPasswordPlaceholder')}
                        showLabel={t('auth.showPassword')}
                        hideLabel={t('auth.hidePassword')}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? t('profile.saving') : t('profile.saveChanges')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  )
}
