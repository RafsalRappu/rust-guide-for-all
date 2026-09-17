import { Link } from 'react-router-dom'
import { LEVELS } from '../data/levels'
import { LESSONS, lessonsByLevel } from '../content'
import { useProgress } from '../context/ProgressContext'

const PERSONAS = [
  {
    emoji: '🌱',
    title: "I've never programmed before",
    body: 'Rust is a demanding first language, but a rewarding one. Start at lesson 1 and take every quiz. Nothing is skipped or assumed.',
    to: '/lesson/getting-started',
    cta: 'Start at lesson 1',
  },
  {
    emoji: '🐍',
    title: 'I know Python, JavaScript, or Go',
    body: "Skim the syntax lessons, then slow down at Ownership. It's the idea with no equivalent in garbage-collected languages.",
    to: '/lesson/ownership',
    cta: 'Jump to Ownership',
  },
  {
    emoji: '⚙️',
    title: 'I come from C or C++',
    body: 'You already understand stacks, heaps, and pointers. Rust makes the compiler enforce what you do by discipline. Begin with borrowing and lifetimes.',
    to: '/lesson/borrowing',
    cta: 'Jump to Borrowing',
  },
  {
    emoji: '🚀',
    title: 'I know the basics and want the deep end',
    body: 'Head straight for traits, lifetimes, smart pointers, fearless concurrency, async, and unsafe.',
    to: '/lesson/traits',
    cta: 'Jump to Advanced',
  },
  {
    emoji: '🛠️',
    title: 'I want to build a real project',
    body: 'Set up your machine and configure Cargo, then build, test, mock, and ship a task manager REST API step by step.',
    to: '/lesson/setup',
    cta: 'Jump to Projects',
  },
]

export default function Home() {
  const { completedCount, totalCount, resetProgress } = useProgress()
  const nextLesson = LESSONS[0]

  return (
    <div className="home">
      <section className="hero">
        <div className="hero__crab" aria-hidden="true">
          🦀
        </div>
        <h1>Rust, for Everyone</h1>
        <p>
          A complete, hands-on Rust course that takes you from your first <code>println!</code>{' '}
          to async and unsafe code, and then to building, testing, and shipping a real web API.
          Every lesson explains the concept in plain language and
          includes runnable examples that open in the official Rust Playground, plus a quiz to
          check what you learned. No installation is needed to begin.
        </p>
        <div className="hero__actions">
          <Link className="btn btn--primary" to={`/lesson/${nextLesson.slug}`}>
            Start learning
          </Link>
          <span className="hero__stats">
            {totalCount} lessons · {LEVELS.length} levels · {completedCount}/{totalCount} completed
          </span>
          {completedCount > 0 && (
            <button type="button" className="btn btn--ghost" onClick={resetProgress}>
              Reset progress
            </button>
          )}
        </div>
      </section>

      <section>
        <h2>Where should you start?</h2>
        <div className="persona-grid">
          {PERSONAS.map((p) => (
            <Link to={p.to} className="persona-card" key={p.title}>
              <div className="persona-card__emoji" aria-hidden="true">
                {p.emoji}
              </div>
              <h3>{p.title}</h3>
              <p>{p.body}</p>
              <span className="persona-card__cta">{p.cta} →</span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2>Full curriculum</h2>
        {LEVELS.map((level) => (
          <div className="curriculum-level" key={level.id}>
            <h3 style={{ '--level-color': level.color }}>
              <span className="curriculum-level__dot" /> {level.label}
              <span className="curriculum-level__tagline">{level.tagline}</span>
            </h3>
            <ol className="curriculum-list">
              {lessonsByLevel(level.id).map((lesson) => (
                <li key={lesson.slug}>
                  <Link to={`/lesson/${lesson.slug}`}>{lesson.title}</Link>
                  <p>{lesson.summary}</p>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </section>
    </div>
  )
}
