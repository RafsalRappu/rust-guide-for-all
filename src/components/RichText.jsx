// Renders lesson prose with a tiny inline syntax: `code` and **bold**.
const INLINE_RE = /(`[^`]+`|\*\*[^*]+\*\*)/g

export default function RichText({ text }) {
  return text.split(INLINE_RE).map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`')) return <code key={i}>{part.slice(1, -1)}</code>
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>
    return part
  })
}
