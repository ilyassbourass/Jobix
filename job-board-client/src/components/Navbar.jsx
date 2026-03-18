import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useI18n } from '../context/I18nContext'
import { motion, AnimatePresence } from 'framer-motion'
import logo from '../assets/logo.png'
import {
  Briefcase,
  Info,
  LayoutDashboard,
  Shield,
  User,
  LogOut,
  Menu,
  X,
  Bookmark,
  Moon,
  Sun,
  Settings,
  Languages,
  Check,
} from 'lucide-react'
import { Button } from './ui/Button'
import NotificationMenu from './NotificationMenu'
import UserAvatar from './UserAvatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/DropdownMenu'
export default function Navbar() {
  const { user, logout } = useAuth()
  const { t, language, setLanguage, languageLabels, languageNames, supportedLanguages } = useI18n()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dark, setDark] = useState(() => {
    const v = localStorage.getItem('theme')
    return v ? v === 'dark' : false
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  const setTheme = (isDark) => {
    setDark(isDark)
    const root = document.documentElement
    if (isDark) {
      root.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      root.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
    setMobileOpen(false)
  }

  const navLinks = [
    { to: '/', label: t('nav.jobs'), icon: Briefcase },
    { to: '/about', label: t('nav.about'), icon: Info },
    ...(user?.role === 'job_seeker'
      ? [{ to: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard }]
      : []),
    ...(user?.role === 'job_seeker' ? [{ to: '/saved-jobs', label: t('nav.saved'), icon: Bookmark }] : []),
    ...(user?.role === 'company' ? [{ to: '/company', label: t('nav.dashboard'), icon: LayoutDashboard }] : []),
    ...(user?.role === 'admin' ? [{ to: '/admin', label: t('nav.admin'), icon: Shield }] : []),
  ]
  const publicProfilePath = user?.role === 'company' && (user?.company?.slug || user?.company?.id)
    ? `/companies/${user.company.slug || user.company.id}`
    : user?.username
      ? `/public-profile/${user.username}`
      : '/profile'

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:border-gray-700/70 dark:bg-gray-900/60 dark:supports-[backdrop-filter]:bg-gray-900/40">
      <nav className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 sm:px-6 md:h-16">
        <div className="flex min-w-0 items-center gap-3 md:gap-6">
          <Link
            to="/"
            className="group relative flex min-w-0 h-full items-center gap-2 rounded-xl px-1.5 py-1 transition-all duration-300 hover:-translate-y-[1px] md:gap-3 md:px-2"
          >
            <span className="pointer-events-none absolute inset-0 -z-10 rounded-xl bg-slate-100/70 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:bg-white/5" />
            <img
              src={logo}
              alt="Jobix Logo"
              className="h-9 w-auto shrink-0 transition-transform duration-300 group-hover:scale-105 sm:h-10 md:h-16 dark:brightness-150 dark:contrast-110 dark:saturate-150 dark:hue-rotate-[335deg]"
            />
            <span className="brand-text truncate text-[1.7rem] font-bold leading-none tracking-tight sm:text-[1.9rem] md:text-3xl">
              Jobix
            </span>
            <span className="pointer-events-none absolute -bottom-2 left-1/2 h-0.5 w-2/3 -translate-x-1/2 rounded-full bg-primary-500/40 opacity-0 transition-all duration-300 group-hover:w-full group-hover:opacity-100 dark:bg-primary-300/50" />
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-700 shadow-sm dark:bg-primary-500/20 dark:text-primary-300'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white',
                  ].join(' ')
                }
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </NavLink>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 md:gap-3">
          {user && <NotificationMenu user={user} />}
          <div className="hidden md:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700 hover:bg-slate-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                  aria-label={t('nav.language')}
                >
                  <Languages className="h-4 w-4" />
                  {languageLabels[language]}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {supportedLanguages.map((lang) => (
                  <DropdownMenuItem
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className="flex cursor-pointer items-center justify-between"
                  >
                    <span>{languageNames[lang] || lang}</span>
                    {language === lang && <Check className="h-4 w-4 text-primary-600 dark:text-primary-300" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <button
            onClick={() => setTheme(!dark)}
            className="hidden rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-gray-800 md:inline-flex"
            aria-label={t('nav.toggleTheme')}
          >
            {dark ? <Sun className="h-5 w-5 text-slate-700 dark:text-slate-200" /> : <Moon className="h-5 w-5 text-slate-700 dark:text-slate-200" />}
          </button>
          {user ? (
            <div className="hidden md:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
                    <UserAvatar user={user} size="md" />
                    <span className="hidden text-sm font-medium text-slate-700 dark:text-gray-200 lg:inline">
                      {user.name}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent forceMount align="end" className="w-56">
                  <div className="flex items-center gap-2 px-2 py-1.5">
                    <UserAvatar user={user} size="sm" fallbackDelayMs={180} />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{user.name}</span>
                      <span className="text-xs text-slate-500">{user.email}</span>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={publicProfilePath} className="flex cursor-pointer items-center gap-2">
                      <User className="h-4 w-4" />
                      {t('nav.viewProfile')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex cursor-pointer items-center gap-2">
                      <Settings className="h-4 w-4" />
                      {t('nav.editProfile')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-red-600 focus:text-red-600"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {t('nav.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Button variant="ghost" asChild>
                <Link to="/login">{t('nav.login')}</Link>
              </Button>
              <Button asChild>
                <Link to="/register">{t('nav.signup')}</Link>
              </Button>
            </div>
          )}

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-xl border border-slate-200/80 bg-white/70 p-2 shadow-sm transition hover:bg-slate-100 dark:border-gray-700/80 dark:bg-gray-900/70 dark:hover:bg-gray-800 md:hidden"
            aria-label={mobileOpen ? t('nav.closeMenu') : t('nav.openMenu')}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-slate-200 bg-white md:hidden dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="space-y-1 px-4 py-4">
              <div className="mb-4 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-gray-800 dark:bg-gray-800/60">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-gray-400">
                      {t('nav.language')}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {supportedLanguages.map((lang) => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => setLanguage(lang)}
                          className={[
                            'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                            language === lang
                              ? 'border-primary-500 bg-primary-600 text-white'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800',
                          ].join(' ')}
                        >
                          {languageLabels[lang]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTheme(!dark)}
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                    aria-label={t('nav.toggleTheme')}
                  >
                    {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    [
                      'flex items-center gap-2 rounded-lg px-3 py-2 transition-colors',
                      isActive
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                        : 'text-slate-700 hover:bg-slate-100 dark:text-gray-200 dark:hover:bg-gray-800',
                    ].join(' ')
                  }
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </NavLink>
              ))}
              {user && (
                <>
                  <Link
                    to={publicProfilePath}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    <User className="h-4 w-4" />
                    {t('nav.viewProfile')}
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    <Settings className="h-4 w-4" />
                    {t('nav.editProfile')}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    {t('nav.logout')}
                  </button>
                </>
              )}
              {!user && (
                <div className="mt-3 space-y-2 border-t border-slate-200 pt-3 dark:border-gray-800">
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    <User className="h-4 w-4" />
                    {t('nav.login')}
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 rounded-lg bg-primary-600 px-3 py-2 font-medium text-white hover:bg-primary-700"
                  >
                    <User className="h-4 w-4" />
                    {t('nav.signup')}
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
