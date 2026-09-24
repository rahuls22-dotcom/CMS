import { useState } from 'react'
import { Modal, RadioRow } from '../../components/ui'
import { DROP_REASONS, STAGES } from '../../domain/funnel'
import { useStore } from '../../domain/store'
import type { DropReason, Milestone } from '../../domain/types'

export function DropDialog({
  milestone, clientName, onClose,
}: {
  milestone: Milestone
  clientName: string
  onClose: () => void
}) {
  const { dispatch, toast } = useStore()
  const [reason, setReason] = useState<DropReason | null>(null)
  const [note, setNote] = useState('')
  const [n, setN] = useState(String(Math.max(1, milestone.noshow_count)))

  const isNoShow = reason === 'Unreachable / no-show ×N'
  const isOther = reason === 'Other'
  const valid =
    reason !== null &&
    (!isOther || note.trim().length > 0) &&
    (!isNoShow || Number(n) > 0)

  const drop = () => {
    if (!reason) return
    dispatch({
      type: 'drop',
      milestoneId: milestone.id,
      reason,
      note: isOther ? note : undefined,
      noshowCount: isNoShow ? Number(n) : undefined,
    })
    toast(`${clientName} dropped — ${reason}`)
    onClose()
  }

  return (
    <Modal
      title="Mark as dropped"
      onClose={onClose}
      actions={<button className="btn danger" disabled={!valid} onClick={drop}>Drop client</button>}
    >
      <div className="note amber" style={{ marginBottom: 12 }}>
        Dropped at {STAGES[milestone.stage].name} · {milestone.status}. The milestone closes
        and {clientName} leaves active queues.
      </div>
      <div className="eyebrow" style={{ marginBottom: 8 }}>Reason</div>
      {DROP_REASONS.map((r) => (
        <RadioRow key={r} checked={reason === r} onSelect={() => setReason(r)} label={r} />
      ))}
      {isNoShow ? (
        <div className="row gap8" style={{ marginTop: 10 }}>
          <span className="muted">Number of no-shows</span>
          <input
            className="input" type="number" min={1} style={{ width: 80 }}
            value={n} onChange={(e) => setN(e.target.value)}
          />
        </div>
      ) : null}
      {isOther ? (
        <div style={{ marginTop: 10 }}>
          <div className="eyebrow" style={{ marginBottom: 6 }}>Details (required)</div>
          <textarea className="ta" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
      ) : null}
    </Modal>
  )
}
