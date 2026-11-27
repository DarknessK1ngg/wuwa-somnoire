export const DISCORD = 'https://discord.gg/adaHTfDjW'

// Thin outline chat glyph, drawn for this site (not the Discord logo).
export function ChatGlyph({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
      <path d="M4 5.5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H10l-4.5 3.5V16.5H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1Z" />
      <circle cx="9" cy="11" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="11" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export default function DiscordLink({ className = '' }) {
  return (
    <a className={`dc-link ${className}`} href={DISCORD} target="_blank" rel="noopener noreferrer" aria-label="Discord">
      <ChatGlyph />
      <span>Discord</span>
      <i aria-hidden="true">↗</i>
    </a>
  )
}
