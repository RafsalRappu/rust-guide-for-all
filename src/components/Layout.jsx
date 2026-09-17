import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useTheme } from '../context/ThemeContext'
import { useProgress } from '../context/ProgressContext'

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const { completedCount, totalCount } = useProgress()
  const pct = Math.round((completedCount / totalCount) * 100)

  return (
    <div className="app-shell">
      <Sidebar open={menuOpen} onNavigate={() => setMenuOpen(false)} />
      {menuOpen && <div className="scrim" onClick={() => setMenuOpen(false)} aria-hidden="true" />}

      <div className="app-shell__main">
        <header className="topbar">
          <button
            type="button"
            className="topbar__icon-btn topbar__menu-btn"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle lesson menu"
          >
            ☰
          </button>
          <div className="topbar__progress" title={`${completedCount} of ${totalCount} lessons complete`}>
            <div className="topbar__track">
              <div className="topbar__fill" style={{ width: `${pct}%` }} />
            </div>
            <span>{pct}% complete</span>
          </div>
          <button
            type="button"
            className="topbar__icon-btn"
            onClick={toggleTheme}
            aria-label="Toggle color theme"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </header>

        <main className="app-shell__content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
