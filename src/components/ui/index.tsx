import { useState, type ReactNode } from 'react'
import type { Flag, PackageName, StageId } from '../../domain/types'
import { STAGES } from '../../domain/funnel'

export function StageChip({ stage }: { stage: StageId }) {
  return (
    <span className="chip" style={{ background: STAGES[stage].hex }}>
      {STAGES[stage].name}
    </span>
  )
}

export function DroppedChip() {
  return <span className="chip" style={{ background: 'var(--dropped)' }}>Dropped</span>
}

export function FlagTags({ flags }: { flags: Flag[] }) {
  if (!flags.length) return <span className="muted">-</span>
  return (
    <span className="row gap6" style={{ flexWrap: 'wrap' }}>
      {flags.map((f) => (
        <span key={f.kind} className={`tag ${f.tone}`}>{f.label}</span>
      ))}
    </span>
  )
}

export function PackageBadge({ pkg }: { pkg: PackageName }) {
  return <span className={`pkg ${pkg.toLowerCase()}`}>{pkg}</span>
}

export function CopyButton({ value, onCopied }: { value: string; onCopied: (v: string) => void }) {
  return (
    <button
      className="copy-btn"
      title={`Copy ${value}`}
      onClick={(e) => {
        e.stopPropagation()
        navigator.clipboard?.writeText(value).then(
          () => onCopied(value),
          () => onCopied(value),
        )
      }}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="9" y="9" width="12" height="12" rx="2" />
        <path d="M5 15V5a2 2 0 0 1 2-2h8" />
      </svg>
    </button>
  )
}

export function Modal({
  title, children, footerLeft, onClose, actions,
}: {
  title: string
  children: ReactNode
  footerLeft?: ReactNode
  onClose: () => void
  actions: ReactNode
}) {
  return (
    <div className="overlay" onClick={onClose} role="presentation">
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="modal-head">{title}</div>
        <div className="modal-body">{children}</div>
        <div className="modal-foot">
          {footerLeft ? <span className="muted" style={{ fontSize: 11 }}>{footerLeft}</span> : null}
          <span className="spacer" />
          <button className="btn" onClick={onClose}>Cancel</button>
          {actions}
        </div>
      </div>
    </div>
  )
}

export function RadioRow({
  checked, onSelect, label, right,
}: {
  checked: boolean
  onSelect: () => void
  label: ReactNode
  right?: ReactNode
}) {
  return (
    <label className={`radio-row ${checked ? 'on' : ''}`}>
      <input type="radio" checked={checked} onChange={onSelect} />
      <span style={{ flex: 1 }}>{label}</span>
      {right}
    </label>
  )
}

export function Avatar({ name, size = 30 }: { name: string; size?: number }) {
  const initials = name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
  return (
    <span
      style={{
        width: size, height: size, borderRadius: '50%', background: 'var(--primary-tint)',
        color: 'var(--primary)', fontWeight: 700, fontSize: size * 0.38,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto',
      }}
    >
      {initials}
    </span>
  )
}

/** Small helper for the list's copyable phone/email/PAN stack. */
export function CopyLine({ value, onCopied }: { value: string; onCopied: (v: string) => void }) {
  return (
    <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
      {value}
      <CopyButton value={value} onCopied={onCopied} />
    </div>
  )
}

export function useToasts() {
  const [items, setItems] = useState<{ id: number; msg: string }[]>([])
  const toast = (msg: string) => {
    const id = Date.now() + Math.random()
    setItems((x) => [...x, { id, msg }])
    window.setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), 2400)
  }
  const host = (
    <div className="toast-host">
      {items.map((i) => <div key={i.id} className="toast">{i.msg}</div>)}
    </div>
  )
  return { toast, host }
}
