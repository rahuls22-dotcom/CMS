import type { ReactNode } from 'react'

export const Icon = {
  chart: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 20V4M4 20h16M8 15l4-4 3 3 5-6" />
    </svg>
  ),
  cal: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  ),
  doc: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 3h8l4 4v14H6z" />
    </svg>
  ),
  arrow: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  warn: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3l10 18H2z M12 10v5M12 18v.5" />
    </svg>
  ),
}

export function StatCards({ items }: { items: [string, number, string][] }) {
  return (
    <div className="grid3">
      {items.map(([label, value, color]) => (
        <div className="card stat" key={label}>
          <span className="eyebrow"><span className="dot" style={{ background: color }} />{label}</span>
          <b>{value}</b>
        </div>
      ))}
    </div>
  )
}

export interface MilestoneWidget {
  title: string
  big: number
  unit: string
  subs: [number, string, string][]
  tileBg: string
  tileFg: string
  icon: ReactNode
  wealth?: boolean
  isNew?: boolean
  onClick?: () => void
}

/** Tax widgets are the existing CMS ones, carried over unchanged from the
 *  prototype so the strip reads the same. */
export const TAX_WIDGETS: MilestoneWidget[] = [
  { title: 'Tax Planning', big: 19, unit: 'pending', subs: [[7, 'not started', '#1f2937'], [12, 'completed', '#15803d']], tileBg: '#efeafd', tileFg: '#7c3aed', icon: Icon.cal },
  { title: 'Declaration & Proof', big: 5, unit: 'pending', subs: [[2, 'not started', '#1f2937'], [9, 'completed', '#15803d']], tileBg: '#efeafd', tileFg: '#7c3aed', icon: Icon.doc },
  { title: 'Year End Tax Review', big: 10, unit: 'pending', subs: [[6, 'not started', '#1f2937'], [3, 'completed', '#15803d']], tileBg: '#efeafd', tileFg: '#7c3aed', icon: Icon.doc },
  { title: 'Advance Tax', big: 18, unit: 'pending', subs: [[11, 'not started', '#1f2937'], [4, 'completed', '#15803d']], tileBg: '#efeafd', tileFg: '#7c3aed', icon: Icon.chart },
]

export function MilestoneCard({ w }: { w: MilestoneWidget }) {
  return (
    <div className={`mcard ${w.wealth ? 'wealth' : ''}`} onClick={w.onClick}>
      <div className="l1">
        <span className="tile" style={{ background: w.tileBg, color: w.tileFg }}>{w.icon}</span>
        <span className="ttl">{w.title}</span>
        {w.isNew ? <span className="badge-new">NEW</span> : null}
        <span className="spacer" />
        <span style={{ color: 'var(--primary)', display: 'inline-flex' }}>{Icon.arrow}</span>
      </div>
      <div className="l2">
        <span className="big">{w.big}</span>
        <span className="unit">{w.unit}</span>
      </div>
      <div className="l3">
        {w.subs.map(([n, label, color]) => (
          <span key={label}><b style={{ color }}>{n}</b> {label}</span>
        ))}
      </div>
    </div>
  )
}

export function Bar({
  label, value, max, color, right,
}: {
  label: string; value: number; max: number; color: string; right?: ReactNode
}) {
  const pct = max > 0 ? Math.max(6, (value / max) * 100) : 0
  return (
    <div className="bar-row">
      <span className="bar-label">{label}</span>
      <span className="bar-track">
        <span className="bar-fill" style={{ width: `${pct}%`, background: color }}>{value}</span>
      </span>
      {right}
    </div>
  )
}
