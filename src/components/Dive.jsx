// Passing between layers.
// Long dive (map <-> inner layer): a golden slit opens at the core and floods the screen with light,
// then the next layer shows through as the light thins out.
// Short dive (between records): a dark iris closes on the click point and reopens on the new record.
export default function Dive({ x, y, label, short = false }) {
  return (
    <div className={`dive2 ${short ? 'dive2-short' : 'dive2-long'}`} style={{ '--x': `${x}px`, '--y': `${y}px` }} aria-hidden="true">
      {short ? (
        <>
          <span className="dive2-iris" />
          <span className="dive2-ring" />
        </>
      ) : (
        <>
          <span className="dive2-slit" />
          <span className="dive2-flash" />
          <span className="dive2-lines">{Array.from({ length: 9 }, (_, i) => <i key={i} style={{ '--i': i }} />)}</span>
        </>
      )}
      <span className="dive2-label">{label}</span>
    </div>
  )
}
