import { NavLink } from 'react-router-dom'
import { LEVELS } from '../data/levels'
import { lessonsByLevel } from '../content'
import { useProgress } from '../context/ProgressContext'

export default function Sidebar({ open, onNavigate }) {
  const { isComplete } = useProgress()

  return (
    <aside className={`sidebar ${open ? 'sidebar--open' : ''}`}>
      <NavLink to="/" className="sidebar__brand" onClick={onNavigate}>
        <span aria-hidden="true">🦀</span> Rust, for Everyone
      </NavLink>
      <div className="sidebar__author">Made by Rafsal VB</div>

      <nav>
        {LEVELS.map((level) => {
          const lessons = lessonsByLevel(level.id)
          const doneCount = lessons.filter((l) => isComplete(l.slug)).length
          return (
            <div className="sidebar__group" key={level.id}>
              <div className="sidebar__group-title" style={{ '--level-color': level.color }}>
                <span>{level.label}</span>
                <span className="sidebar__count">
                  {doneCount}/{lessons.length}
                </span>
              </div>
              <ul>
                {lessons.map((lesson) => (
                  <li key={lesson.slug}>
                    <NavLink
                      to={`/lesson/${lesson.slug}`}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
                      }
                    >
                      <span
                        className={`sidebar__dot ${isComplete(lesson.slug) ? 'sidebar__dot--done' : ''}`}
                        aria-hidden="true"
                      />
                      {lesson.title}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </nav>
    </aside>
  )
}
