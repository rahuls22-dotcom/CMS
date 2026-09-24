import { useState } from 'react'
import { Modal } from '../../components/ui'
import { useStore } from '../../domain/store'
import { personName } from '../../domain/seed'
import type { Milestone } from '../../domain/types'

export function MoMDialog({
  milestone, clientName, onClose,
}: {
  milestone: Milestone
  clientName: string
  onClose: () => void
}) {
  const { dispatch, toast } = useStore()
  const [text, setText] = useState('')

  const save = () => {
    dispatch({ type: 'addMoM', milestoneId: milestone.id, text })
    toast('MoM saved — moved to Onboarding / KYC pending')
    onClose()
  }

  const when = new Date(milestone.stage_entered_at)

  return (
    <Modal
      title="Add MoM"
      onClose={onClose}
      actions={
        <button className="btn primary" disabled={!text.trim()} onClick={save}>Save MoM</button>
      }
    >
      <div className="muted" style={{ fontSize: 11.5, marginBottom: 10 }}>
        {clientName} · {when.toLocaleDateString('en-IN')} · {when.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} · RM {personName(milestone.rm_id)}
      </div>
      <div className="eyebrow" style={{ marginBottom: 6 }}>Minutes of meeting (required)</div>
      <textarea className="ta" value={text} onChange={(e) => setText(e.target.value)} autoFocus />
      <div className="note blue" style={{ marginTop: 12 }}>
        Saving closes Wealth call and moves the client to Onboarding / KYC pending.
      </div>
    </Modal>
  )
}
