import RichText from './RichText'

const ICONS = { tip: '💡', warning: '⚠️', challenge: '🧪', note: '📘' }

export default function Callout({ variant = 'tip', title, text }) {
  return (
    <div className={`callout callout--${variant}`}>
      <div className="callout__title">
        <span aria-hidden="true">{ICONS[variant] ?? '💡'}</span> {title}
      </div>
      <p className="callout__body">
        <RichText text={text} />
      </p>
    </div>
  )
}
