import { useState } from 'react'
import { Modal, RadioRow } from '../../components/ui'
import { EXIT_TEXT, STAGES, statusesFor } from '../../domain/funnel'
import { actorLabel, useStore } from '../../domain/store'
import type { Milestone, Status } from '../../domain/types'
import { personName } from '../../domain/seed'

/** Contextual explanation of what picking each status will actually do, so the
 *  RM is never surprised by a stage jump. */
function outcomeNote(m: Milestone, next: Status, isAdvisor: boolean): string | null {
  if (m.stage === 1 && next === 'Interested')
    return 'Meets the exit criterion — the client moves to Intent · Awaiting docs.'
  if (m.stage === 3 && next === 'Completed')
    return isAdvisor
      ? 'A MoM is required. Saving closes Wealth call and moves the client to Onboarding / KYC pending.'
      : 'Without a MoM the client stays in Wealth call with a MoM pending flag until the advisor logs one.'
  if (m.stage === 3 && next === 'No-show')
    return `No-show count becomes ${m.noshow_count + 1}. Reschedule the call or drop the client.`
  if (m.stage === 3 && next === 'Skipped')
    return 'Skipping the wealth call moves the client to Onboarding / KYC pending.'
  if (m.stage === 4 && next === 'Converted')
    return 'Closes the milestone as Converted.'
  if (m.stage === 4 && next === 'Not converted')
    return 'Opens the Drop dialog — a reason is required.'
  return null
}

export function UpdateStatusDialog({
  milestone, onClose, onRequestDrop,
}: {
  milestone: Milestone
  onClose: () => void
  onRequestDrop: () => void
}) {
  const { state, dispatch, toast } = useStore()
  const isAdvisor = state.role === 'WEALTH_ADVISOR'
  const [next, setNext] = useState<Status | null>(null)
  const [mom, setMom] = useState('')
  const [date, setDate] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')

  const stage = STAGES[milestone.stage]
  const options = statusesFor(milestone.stage)
  const needsSlot = next === 'Scheduled' || next === 'Rescheduled'
  const needsMom = next === 'Completed'
  const momRequired = needsMom && isAdvisor

  const slotOk = !needsSlot || (date && start && end)
  const momOk = !momRequired || mom.trim().length > 0
  const canSave = next !== null && next !== milestone.status && slotOk && momOk

  const save = () => {
    if (!next) return
    if (next === 'Not converted') { onClose(); onRequestDrop(); return }
    dispatch({
      type: 'setStatus',
      milestoneId: milestone.id,
      status: next,
      momText: needsMom ? mom : undefined,
      when: needsSlot ? { date, start, end } : undefined,
    })
    toast(`Status updated — ${next}`)
    onClose()
  }

  const actor = { id: state.actorId, name: personName(state.actorId), role: state.role }
  const note = next ? outcomeNote(milestone, next, isAdvisor) : null

  return (
    <Modal
      title="Update status"
      onClose={onClose}
      footerLeft={`Logged as ${actorLabel(actor)} · ${new Date().toLocaleString('en-IN')}`}
      actions={<button className="btn primary" disabled={!canSave} onClick={save}>Save</button>}
    >
      <div className="eyebrow" style={{ marginBottom: 8 }}>{stage.name} statuses</div>
      {options.map((s) => (
        <RadioRow
          key={s}
          checked={next === s}
          onSelect={() => setNext(s)}
          label={
            <span>
              {s}
              {s === milestone.status ? <span className="muted"> (current)</span> : null}
            </span>
          }
          right={
            s === stage.exit ? <span className="tag green">Exit criterion</span>
            : s === 'Not converted' ? <span className="tag red">Drops client</span>
            : null
          }
        />
      ))}

      {stage.exit ? (
        <div className="muted" style={{ fontSize: 11.5, marginTop: 6 }}>
          Exit criterion: {EXIT_TEXT[milestone.stage as 1 | 2 | 3 | 4]}
        </div>
      ) : null}

      {needsSlot ? (
        <div className="row gap8" style={{ marginTop: 12, flexWrap: 'wrap' }}>
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <input className="input" type="time" value={start} onChange={(e) => setStart(e.target.value)} />
          <span className="muted">–</span>
          <input className="input" type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
      ) : null}

      {needsMom ? (
        <div style={{ marginTop: 12 }}>
          <div className="eyebrow" style={{ marginBottom: 6 }}>
            Minutes of meeting {momRequired ? '(required)' : '(optional)'}
          </div>
          <textarea className="ta" value={mom} onChange={(e) => setMom(e.target.value)} />
        </div>
      ) : null}

      {note ? <div className="note blue" style={{ marginTop: 12 }}>{note}</div> : null}
    </Modal>
  )
}
