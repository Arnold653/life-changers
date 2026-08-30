'use client'

import { useEffect, useState } from 'react'

export default function ThemeToggle({ className = '' }) {
  const [theme, setTheme] = useState('light')

  useEffect(() => {
    setTheme(document.documentElement.getAttribute('data-theme') || 'light')
  }, [])

  function basculer() {
    const suivant = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', suivant)
    localStorage.setItem('theme', suivant)
    setTheme(suivant)
  }

  return (
    <button
      onClick={basculer}
      aria-label={theme === 'dark' ? 'Passer au thème clair' : 'Passer au thème sombre'}
      className={`p-1.5 text-papier/70 hover:text-or transition-colors ${className}`}
    >
      {theme === 'dark' ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="4.5" />
          <path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8l1.8-1.8M18 6l1.8-1.8" strokeLinecap="round" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  )
}
