const normalizeEnvValue = (value) => {
  if (typeof value !== 'string') return ''
  const trimmed = value.trim()
  return trimmed || ''
}

export const siteConfig = {
  contactEmail: normalizeEnvValue(import.meta.env.VITE_CONTACT_EMAIL),
  linkedinUrl: normalizeEnvValue(import.meta.env.VITE_LINKEDIN_URL),
  githubUrl: normalizeEnvValue(import.meta.env.VITE_GITHUB_URL),
  portfolioUrl: normalizeEnvValue(import.meta.env.VITE_PORTFOLIO_URL),
}

