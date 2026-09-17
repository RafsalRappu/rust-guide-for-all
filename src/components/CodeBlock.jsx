import { useState } from 'react'

const KEYWORDS = new Set([
  'as', 'async', 'await', 'break', 'const', 'continue', 'crate', 'dyn', 'else', 'enum',
  'extern', 'false', 'fn', 'for', 'if', 'impl', 'in', 'let', 'loop', 'match', 'mod', 'move',
  'mut', 'pub', 'ref', 'return', 'self', 'Self', 'static', 'struct', 'super', 'trait', 'true',
  'type', 'unsafe', 'use', 'where', 'while',
])

const PRIMITIVES = new Set([
  'i8', 'i16', 'i32', 'i64', 'i128', 'isize', 'u8', 'u16', 'u32', 'u64', 'u128', 'usize',
  'f32', 'f64', 'bool', 'char', 'str',
])

// comment | string | char literal | lifetime | number | macro call | identifier
const TOKEN_RE =
  /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*")|('(?:\\.|[^'\\])')|('[a-zA-Z_]\w*)|(\b\d[\d_]*(?:\.\d+)?(?:[iuf](?:8|16|32|64|128|size))?\b)|([a-zA-Z_]\w*!)|([a-zA-Z_]\w*)/g

function highlightRust(source) {
  const out = []
  let last = 0
  for (const m of source.matchAll(TOKEN_RE)) {
    if (m.index > last) out.push(source.slice(last, m.index))
    const [text, comment, str, chr, lifetime, num, macro, ident] = m
    let cls
    if (comment) cls = 'tok-comment'
    else if (str || chr) cls = 'tok-string'
    else if (lifetime) cls = 'tok-lifetime'
    else if (num) cls = 'tok-number'
    else if (macro) cls = 'tok-macro'
    else if (ident) {
      if (KEYWORDS.has(ident)) cls = 'tok-keyword'
      else if (PRIMITIVES.has(ident) || /^[A-Z]/.test(ident)) cls = 'tok-type'
      else if (source[m.index + ident.length] === '(') cls = 'tok-fn'
    }
    out.push(cls ? <span key={m.index} className={cls}>{text}</span> : text)
    last = m.index + text.length
  }
  if (last < source.length) out.push(source.slice(last))
  return out
}

function playgroundUrl(code) {
  return `https://play.rust-lang.org/?version=stable&mode=debug&edition=2021&code=${encodeURIComponent(code)}`
}

export default function CodeBlock({ code, language = 'rust', title, runnable = false, output }) {
  const [copied, setCopied] = useState(false)
  const source = code.trim()

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(source)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard API unavailable; nothing to do.
    }
  }

  return (
    <div className="code-block">
      <div className="code-block__bar">
        <span className="code-block__lang">{title || language}</span>
        <div className="code-block__actions">
          {runnable && (
            <a
              className="code-block__btn code-block__btn--run"
              href={playgroundUrl(source)}
              target="_blank"
              rel="noreferrer"
            >
              ▶ Run in Playground
            </a>
          )}
          <button type="button" className="code-block__btn" onClick={handleCopy}>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
      <pre className="code-block__pre">
        <code>{language === 'rust' ? highlightRust(source) : source}</code>
      </pre>
      {output !== undefined && (
        <div className="code-block__output">
          <span className="code-block__output-label">Output</span>
          <pre>{output.trim()}</pre>
        </div>
      )}
    </div>
  )
}
