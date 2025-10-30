import { useEffect, useState } from 'react'

const THEMES = ['dark','dracula','halloween --default','retro','light']

export const ThemeToggle = () => {
  const [theme, setTheme] = useState('dark')

  useEffect(() => {
    const stored = localStorage.getItem('theme')
    const initial = stored && THEMES.includes(stored) ? stored : 'dark'
    setTheme(initial)
    document.documentElement.setAttribute('data-theme', initial)
    if (initial === 'dark' || initial === 'dracula' || initial === 'halloween') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  const nextTheme = () => {
    const idx = THEMES.indexOf(theme)
    return THEMES[(idx + 1) % THEMES.length]
  }

  const handleClick = () => {
    const t = nextTheme()
    setTheme(t)
    localStorage.setItem('theme', t)
    document.documentElement.setAttribute('data-theme', t)
    if (t === 'dark' || t === 'dracula' || t === 'halloween') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  return (
    <button
      type="button"
      className="btn btn-ghost btn-sm normal-case"
      onClick={handleClick}
      title={`Theme: ${theme}`}
    >
      <span className="hidden sm:inline">Theme: {theme}</span>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 sm:ml-2">
        <path d="M21.752 15.002A9.718 9.718 0 0 1 12 21.75a9.75 9.75 0 0 1 0-19.5 9.718 9.718 0 0 1 9.752 6.748 7.5 7.5 0 0 0 0 5.004z" />
      </svg>
    </button>
  )
}


