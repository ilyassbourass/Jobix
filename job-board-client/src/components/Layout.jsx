import { Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from './Navbar'
import { useI18n } from '../context/I18nContext'
import { siteConfig } from '../config/site'

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}

export default function Layout() {
  const location = useLocation()
  const { t } = useI18n()
  const contactLinks = [
    siteConfig.contactEmail
      ? { label: t('footer.contactEmail'), href: `mailto:${siteConfig.contactEmail}` }
      : null,
    siteConfig.linkedinUrl
      ? { label: t('footer.contactLinkedIn'), href: siteConfig.linkedinUrl }
      : null,
    siteConfig.githubUrl
      ? { label: t('footer.contactGitHub'), href: siteConfig.githubUrl }
      : null,
    siteConfig.portfolioUrl
      ? { label: t('footer.contactPortfolio'), href: siteConfig.portfolioUrl }
      : null,
  ].filter(Boolean)

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.2 }}
          className="mx-auto flex-1 w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>
      <footer className="border-t border-slate-200 bg-white py-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 text-sm text-slate-500 dark:text-gray-400 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-center sm:text-left">
            &copy; {new Date().getFullYear()} Jobix. {t('footer.rights')}
            <p className="mt-1 text-xs text-slate-400 dark:text-gray-500">{t('footer.productNote')}</p>
          </div>
          {contactLinks.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs sm:justify-end">
              <span className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-gray-500">
                {t('footer.contactTitle')}
              </span>
              {contactLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target={link.href.startsWith('mailto:') ? undefined : '_blank'}
                  rel={link.href.startsWith('mailto:') ? undefined : 'noreferrer'}
                  className="rounded-full border border-transparent px-2 py-1 text-slate-500 transition-colors hover:border-slate-200 hover:text-slate-900 dark:text-gray-400 dark:hover:border-gray-700 dark:hover:text-gray-100"
                >
                  {link.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </footer>
    </div>
  )
}
