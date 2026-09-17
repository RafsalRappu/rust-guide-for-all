import { useState } from 'react'

const CODE_LINES = [
  'fn main() {',
  '    let s1 = String::from("hello");',
  '    let s2 = s1;',
  '    let s3 = s2.clone();',
  '    // println!("{s1}"); // ❌ error[E0382]',
  '}',
]

const STEPS = [
  {
    line: 1,
    vars: [{ name: 's1', heap: 'A', moved: false }],
    heap: [{ id: 'A', value: '"hello"', freed: false }],
    note: '`s1` is created on the stack. It owns a heap allocation holding "hello".',
  },
  {
    line: 2,
    vars: [
      { name: 's1', heap: 'A', moved: true },
      { name: 's2', heap: 'A', moved: false },
    ],
    heap: [{ id: 'A', value: '"hello"', freed: false }],
    note: 'Ownership MOVES to `s2`. The heap data is not copied, and `s1` is no longer usable.',
  },
  {
    line: 3,
    vars: [
      { name: 's1', heap: 'A', moved: true },
      { name: 's2', heap: 'A', moved: false },
      { name: 's3', heap: 'B', moved: false },
    ],
    heap: [
      { id: 'A', value: '"hello"', freed: false },
      { id: 'B', value: '"hello"', freed: false },
    ],
    note: '`.clone()` makes a deep copy: a brand-new heap allocation that `s3` owns.',
  },
  {
    line: 4,
    vars: [
      { name: 's1', heap: 'A', moved: true },
      { name: 's2', heap: 'A', moved: false },
      { name: 's3', heap: 'B', moved: false },
    ],
    heap: [
      { id: 'A', value: '"hello"', freed: false },
      { id: 'B', value: '"hello"', freed: false },
    ],
    note: 'Using `s1` here would be a compile-time error: "borrow of moved value". Rust catches this before your program ever runs.',
  },
  {
    line: 5,
    vars: [],
    heap: [
      { id: 'A', value: '"hello"', freed: true },
      { id: 'B', value: '"hello"', freed: true },
    ],
    note: 'End of scope: each owner is dropped, and its heap memory is freed exactly once. No garbage collector, no double-free.',
  },
]

export default function OwnershipVisualizer() {
  const [step, setStep] = useState(0)
  const current = STEPS[step]

  return (
    <div className="ownership-viz">
      <div className="ownership-viz__code">
        {CODE_LINES.map((line, i) => (
          <div
            key={i}
            className={`ownership-viz__line ${i === current.line ? 'ownership-viz__line--active' : ''}`}
          >
            <span className="ownership-viz__lineno">{i + 1}</span>
            <code>{line}</code>
          </div>
        ))}
      </div>

      <div className="ownership-viz__memory">
        <div className="ownership-viz__column">
          <div className="ownership-viz__heading">Stack</div>
          {current.vars.length === 0 && <div className="ownership-viz__empty">(empty)</div>}
          {current.vars.map((v) => (
            <div key={v.name} className={`ownership-viz__cell ${v.moved ? 'is-moved' : ''}`}>
              <strong>{v.name}</strong>
              <span>{v.moved ? 'moved ✗' : `→ heap ${v.heap}`}</span>
            </div>
          ))}
        </div>
        <div className="ownership-viz__column">
          <div className="ownership-viz__heading">Heap</div>
          {current.heap.map((h) => (
            <div key={h.id} className={`ownership-viz__cell ${h.freed ? 'is-freed' : ''}`}>
              <strong>{h.id}</strong>
              <span>{h.freed ? 'freed' : h.value}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="ownership-viz__note">{current.note.replace(/`/g, '')}</p>

      <div className="ownership-viz__controls">
        <button type="button" onClick={() => setStep((s) => s - 1)} disabled={step === 0}>
          ← Back
        </button>
        <span>
          Step {step + 1} / {STEPS.length}
        </span>
        <button
          type="button"
          onClick={() => setStep((s) => s + 1)}
          disabled={step === STEPS.length - 1}
        >
          Next →
        </button>
      </div>
    </div>
  )
}
