import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { LEVELS } from '../data/levels'
import { getAdjacentLessons, getLesson } from '../content'
import { useProgress } from '../context/ProgressContext'
import CodeBlock from './CodeBlock'
import Callout from './Callout'
import Quiz from './Quiz'
import RichText from './RichText'
import OwnershipVisualizer from './OwnershipVisualizer'
import NotFound from '../pages/NotFound'

const WIDGETS = {
  ownership: OwnershipVisualizer,
}

function Section({ section }) {
  switch (section.type) {
    case 'h2':
      return <h2>{section.text}</h2>
    case 'p':
      return (
        <p>
          <RichText text={section.text} />
        </p>
      )
    case 'list':
      return (
        <ul>
          {section.items.map((item) => (
            <li key={item}>
              <RichText text={item} />
            </li>
          ))}
        </ul>
      )
    case 'code':
      return <CodeBlock {...section} />
    case 'callout':
      return <Callout {...section} />
    case 'quiz':
      return <Quiz {...section} />
    case 'widget': {
      const Widget = WIDGETS[section.name]
      return Widget ? <Widget /> : null
    }
    default:
      return null
  }
}

export default function LessonView() {
  const { slug } = useParams()
  const { isComplete, toggleComplete } = useProgress()
  const lesson = getLesson(slug)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [slug])

  if (!lesson) return <NotFound />

  const level = LEVELS.find((l) => l.id === lesson.level)
  const { prev, next } = getAdjacentLessons(slug)
  const done = isComplete(slug)

  return (
    <article className="lesson">
      <header className="lesson__header">
        <span className="level-badge" style={{ '--level-color': level.color }}>
          {level.label}
        </span>
        <h1>{lesson.title}</h1>
        <p className="lesson__summary">{lesson.summary}</p>
      </header>

      <div className="lesson__content">
        {lesson.sections.map((section, i) => (
          <Section key={`${slug}-${i}`} section={section} />
        ))}
      </div>

      <footer className="lesson__footer">
        <button
          type="button"
          className={`mark-complete ${done ? 'mark-complete--done' : ''}`}
          onClick={() => toggleComplete(slug)}
        >
          {done ? '✓ Completed' : 'Mark as complete'}
        </button>

        <nav className="pager">
          {prev ? (
            <Link className="pager__link" to={`/lesson/${prev.slug}`}>
              <span className="pager__label">← Previous</span>
              <span className="pager__title">{prev.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link className="pager__link pager__link--next" to={`/lesson/${next.slug}`}>
              <span className="pager__label">Next →</span>
              <span className="pager__title">{next.title}</span>
            </Link>
          ) : (
            <Link className="pager__link pager__link--next" to="/">
              <span className="pager__label">🦀 You finished the course!</span>
              <span className="pager__title">Back to home</span>
            </Link>
          )}
        </nav>
      </footer>
    </article>
  )
}
