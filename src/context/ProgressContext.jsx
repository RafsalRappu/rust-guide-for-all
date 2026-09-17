import { createContext, useContext, useEffect, useState } from 'react'
import { LESSONS } from '../content'

const STORAGE_KEY = 'rust-tutorials:completed-lessons'
const ProgressContext = createContext(null)

function readStoredProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

export function ProgressProvider({ children }) {
  const [completed, setCompleted] = useState(readStoredProgress)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...completed]))
    } catch {
      // Storage unavailable (e.g. private browsing): progress simply won't persist.
    }
  }, [completed])

  function toggleComplete(slug) {
    setCompleted((prev) => {
      const next = new Set(prev)
      if (next.has(slug)) next.delete(slug)
      else next.add(slug)
      return next
    })
  }

  const value = {
    isComplete: (slug) => completed.has(slug),
    toggleComplete,
    resetProgress: () => setCompleted(new Set()),
    completedCount: completed.size,
    totalCount: LESSONS.length,
  }

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}

export function useProgress() {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error('useProgress must be used inside <ProgressProvider>')
  return ctx
}
