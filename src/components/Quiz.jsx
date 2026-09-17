import { useState } from 'react'
import RichText from './RichText'

export default function Quiz({ question, options, answer, explanation }) {
  const [selected, setSelected] = useState(null)
  const answered = selected !== null
  const correct = selected === answer

  return (
    <div className="quiz">
      <div className="quiz__label">Check your understanding</div>
      <p className="quiz__question">
        <RichText text={question} />
      </p>
      <div className="quiz__options">
        {options.map((option, i) => {
          let state = ''
          if (answered && i === answer) state = 'quiz__option--correct'
          else if (answered && i === selected) state = 'quiz__option--wrong'
          return (
            <button
              key={option}
              type="button"
              className={`quiz__option ${state}`}
              onClick={() => setSelected(i)}
              disabled={answered}
            >
              <RichText text={option} />
            </button>
          )
        })}
      </div>
      {answered && (
        <div className={`quiz__feedback ${correct ? 'is-correct' : 'is-wrong'}`}>
          <strong>{correct ? 'Correct!' : 'Not quite.'}</strong> <RichText text={explanation} />
          <button type="button" className="quiz__retry" onClick={() => setSelected(null)}>
            Try again
          </button>
        </div>
      )}
    </div>
  )
}
