import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FlagTags, PackageBadge, StageChip } from '../../components/ui'
import {
  EXIT_TEXT, STAGES, STUCK_DAYS, daysInStage, displayStage, displayStatus, flagsFor,
  isClosed, isDropped, isMoMPending, nextActionFor,
} from '../../domain/funnel'
import { useStore } from '../../domain/store'
import { ADVISORS, personName } from '../../domain/seed'
import type { Milestone, StageId } from '../../domain/types'
import { UpdateStatusDialog } from '../dialogs/UpdateStatusDialog'
import { DropDialog } from '../dialogs/DropDialog'
import { MoMDialog } from '../dialogs/MoMDialog'

type Dialog = 'status' | 'drop' | 'mom' | null

function Stepper({ m }: { m: Milestone }) {
  const cur = displayStage(m)
  const droppedAt = m.dropped_at_stage
  const ids: StageId[] = [1, 2, 3, 4, 5]
  return (
    <div className="stepper">
      {ids.map((id, i) => {
        const dropped = droppedAt === id
        const isCur = !dropped && id === cur
        const done = !dropped && id < cur
        const cls = dropped ? 'dropped' : isCur ? 'current' : done ? 'done' : 'todo'
        const style = isCur && cur === 5 ? { background: 'var(--stage-5)' } : undefined
        return (
          <span key={id} className="row gap6">
            <span className={`step ${cls}`} style={style}>
              {isCur ? '● ' : ''}{STAGES[id].name}
            </span>
            {i < ids.length - 1 ? <span className="step-sep">›</span> : null}
          </span>
        )
      })}
    </div>
  )
}

export function ClientPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { state, dispatch, toast } = useStore()
  const [dialog, setDialog] = useState<Dialog>(null)

  const client = state.clients.find((c) => c.id === id)
  const milestone = state.milestones.find((m) => m.client_id === id)
  if (!client || !milestone) {
    return (
      <div className="page">
        <button className="btn" onClick={() => navigate('/clients')}>← Back</button>
        <div className="card" style={{ marginTop: 12 }}>Client not found.</div>
      </div>
    )
  }

  const m = milestone
  const stage = displayStage(m)
  const days = daysInStage(m)
  const closed = isClosed(m)
  const isAdvisor = state.role === 'WEALTH_ADVISOR'
  const isAdmin = state.role === 'WEALTH_ADMIN'
  const momPending = isMoMPending(m)

  const timeline = [...state.history]
    .filter((h) => h.milestone_id === m.id)
    .sort((a, b) => b.at.localeCompare(a.at))

  const bookCall = () => {
    dispatch({
      type: 'scheduleCall',
      milestoneId: m.id,
      when: { date: new Date().toISOString().slice(0, 10), start: '15:00', end: '15:45' },
      advisorId: m.advisor_id || (ADVISORS[0] as { id: string }).id,
      reschedule: m.status === 'No-show',
    })
    toast('Wealth call booked')
  }

  const sendFirstMessage = () => {
    dispatch({ type: 'firstMessage', milestoneId: m.id })
    toast('Message sent — moved to Intent')
  }

  const Actions = () => {
    if (isAdmin) return <button className="action-card" disabled><span className="t">View only</span><span className="s">Admins do not act on individual milestones.</span></button>
    if (closed) return <button className="action-card" disabled><span className="t">Milestone closed</span><span className="s">{isDropped(m) ? `Dropped · ${m.drop_reason}` : 'Converted'}</span></button>

    if (isAdvisor) {
      if (m.stage !== 3) {
        return <button className="action-card" disabled><span className="t">No advisor actions at this stage</span><span className="s">This client is at {STAGES[stage].name}.</span></button>
      }
      return (
        <>
          <button className="action-card" onClick={() => setDialog('status')}>
            <span className="t">Update call status</span>
            <span className="s">Wealth call statuses only.</span>
          </button>
          {momPending ? (
            <button className="action-card" onClick={() => setDialog('mom')}>
              <span className="t">Add MoM</span>
              <span className="s">Wealth call exit blocked until the MoM is logged.</span>
            </button>
          ) : null}
        </>
      )
    }

    // RM
    return (
      <>
        {m.stage === 1 || m.stage === 2 ? (
          <>
            <button className="action-card" onClick={bookCall}>
              <span className="t">Schedule a meeting</span>
              <span className="s">
                {m.stage === 1
                  ? 'Books the wealth call directly — skips Intent.'
                  : 'Books the wealth call and moves to Wealth call · Scheduled.'}
              </span>
            </button>
            <button className="action-card" onClick={m.stage === 1 ? sendFirstMessage : () => toast('Chat panel — placeholder UI')}>
              <span className="t">Send a message</span>
              <span className="s">
                {m.stage === 1
                  ? `Sending the first message moves ${client.name} to Intent · Awaiting docs.`
                  : 'Opens the wealth chat panel.'}
              </span>
            </button>
          </>
        ) : null}
        {m.stage >= 2 ? (
          <button className="action-card" onClick={() => setDialog('status')}>
            <span className="t">Update status</span>
            <span className="s">{STAGES[m.stage].name} statuses.</span>
          </button>
        ) : (
          <button className="action-card" onClick={() => setDialog('status')}>
            <span className="t">Update status</span>
            <span className="s">Not started statuses.</span>
          </button>
        )}
        {m.stage === 3 && m.status === 'No-show' ? (
          <button className="action-card" onClick={bookCall}>
            <span className="t">Reschedule call</span>
            <span className="s">Books a new slot and sets Rescheduled.</span>
          </button>
        ) : null}
        {momPending ? (
          <button className="action-card" disabled>
            <span className="t">MoM awaited from advisor</span>
            <span className="s">{personName(m.advisor_id)} must log the MoM to close Wealth call.</span>
          </button>
        ) : null}
        <button className="action-card destructive" onClick={() => setDialog('drop')}>
          <span className="t">Mark as dropped</span>
          <span className="s">Requires a reason. Closes the milestone.</span>
        </button>
      </>
    )
  }

  return (
    <div className="page">
      <div className="row gap12" style={{ marginBottom: 10, flexWrap: 'wrap' }}>
        <button className="btn" onClick={() => navigate('/clients')}>← Back</button>
        <span style={{ fontSize: 17, fontWeight: 700 }}>{client.name}</span>
        <PackageBadge pkg={client.package} />
        <span className="muted">
          RM: {personName(m.rm_id)} · Wealth advisor: {personName(m.advisor_id)}
        </span>
        <span className="spacer" />
        <StageChip stage={stage} />
      </div>

      <Stepper m={m} />

      <div
        className="two-col"
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}
      >
        <div>
          <div className="card" style={{ marginBottom: 12 }}>
            <div className="row">
              <div>
                <div className="eyebrow">Stage</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{STAGES[stage].name}</div>
                <div style={{ color: STAGES[stage].hex, fontWeight: 600, marginTop: 2 }}>
                  {displayStatus(m)}
                </div>
              </div>
              <span className="spacer" />
              <div style={{ textAlign: 'right' }}>
                <div className="eyebrow">Days in stage</div>
                <div
                  style={{
                    fontSize: 26, fontWeight: 700,
                    color: days >= STUCK_DAYS ? 'var(--tag-red-fg)' : 'var(--ink)',
                  }}
                >
                  {days}
                </div>
              </div>
            </div>
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--divider)' }}>
              {flagsFor(m).length ? <FlagTags flags={flagsFor(m)} /> : null}
              <div className="muted" style={{ fontSize: 11.5, marginTop: 8 }}>
                Next action: {nextActionFor(m)}
                {stage <= 4 && !closed ? ` · Exit: ${EXIT_TEXT[stage as 1 | 2 | 3 | 4]}` : ''}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="eyebrow" style={{ marginBottom: 12 }}>Stage timeline</div>
            <div className="timeline">
              {timeline.map((h) => (
                <div className="tl-item" key={h.id}>
                  <span className={`tl-dot ${h.to_stage !== h.from_stage ? 'filled' : ''}`} />
                  <div className="tl-event">{h.event}</div>
                  <div className="tl-meta">
                    {h.actor_role === 'System' ? 'System' : `${personName(h.actor_id)} (${h.actor_role === 'WEALTH_ADVISOR' ? 'Advisor' : h.actor_role === 'RM' ? 'RM' : 'Admin'})`}
                    {' · '}
                    {new Date(h.at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ background: '#f7f8fa', borderRadius: 'var(--r-card)', padding: 14 }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Actions</div>
          <Actions />
          {m.mom_text ? (
            <div className="card" style={{ marginTop: 12 }}>
              <div className="eyebrow" style={{ marginBottom: 6 }}>Minutes of meeting</div>
              <div style={{ fontSize: 12.5, lineHeight: 1.55 }}>{m.mom_text}</div>
            </div>
          ) : null}
        </div>
      </div>

      {dialog === 'status' ? (
        <UpdateStatusDialog
          milestone={m}
          onClose={() => setDialog(null)}
          onRequestDrop={() => setDialog('drop')}
        />
      ) : null}
      {dialog === 'drop' ? (
        <DropDialog milestone={m} clientName={client.name} onClose={() => setDialog(null)} />
      ) : null}
      {dialog === 'mom' ? (
        <MoMDialog milestone={m} clientName={client.name} onClose={() => setDialog(null)} />
      ) : null}
    </div>
  )
}
