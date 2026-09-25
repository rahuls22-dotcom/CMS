import { useState, type ReactElement } from 'react'
import { STAGES, displayStage, nextActionFor } from '../../domain/funnel'
import { useStore } from '../../domain/store'
import type { Client, Milestone } from '../../domain/types'

type PanelKey = 'Milestone' | 'Chat' | 'Documents' | 'Meetings'

const RAIL_ICONS: Record<PanelKey, ReactElement> = {
  Milestone: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3l9 5-9 5-9-5z M3 13l9 5 9-5" /></svg>,
  Chat: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16v12H8l-4 4z" /></svg>,
  Documents: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h6l2 2h10v11H3z" /></svg>,
  Meetings: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>,
}

/** Existing tax milestones, carried from the prototype so the panel matches. */
const TAX_MILESTONES = [
  { name: 'Year End Tax Review', tag: 'Not Started', tone: 'grey', updated: '6 Sept 2026' },
  { name: 'Declaration & Proof Submission', tag: 'Declaration Proof Submission', tone: 'green', updated: '6 Sept 2026' },
  { name: 'Advance tax', tag: 'Not Started', tone: 'grey', updated: '6 Sept 2026' },
  { name: 'Tax planning', tag: 'Declaration Submission', tone: 'amber', updated: '6 Sept 2026' },
]

function MilestonePanel({ m }: { m: Milestone }) {
  const stage = displayStage(m)
  return (
    <>
      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Milestones</div>
      <div className="ms-card on">
        <div className="row gap6" style={{ marginBottom: 6 }}>
          <span style={{ fontWeight: 700 }}>Wealth Onboarding</span>
          <span className="badge-new">NEW</span>
        </div>
        <div className="row gap6" style={{ marginBottom: 8 }}>
          <span className="chip" style={{ background: STAGES[stage].hex }}>{STAGES[stage].name}</span>
          <span style={{ color: STAGES[stage].hex, fontWeight: 600, fontSize: 12 }}>{m.status}</span>
        </div>
        <div className="row" style={{ fontSize: 11.5 }}>
          <span className="muted">Next action</span>
          <span className="spacer" />
          <span>{nextActionFor(m)}</span>
        </div>
        <div className="row" style={{ fontSize: 11.5, marginTop: 3 }}>
          <span className="muted">Last updated</span>
          <span className="spacer" />
          <span className="muted">
            {new Date(m.last_activity_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
      </div>
      {TAX_MILESTONES.map((t) => (
        <div className="ms-card" key={t.name}>
          <div style={{ fontWeight: 700, marginBottom: 7 }}>{t.name}</div>
          <span className={`tag ${t.tone === 'green' ? 'green' : t.tone === 'amber' ? 'amber' : ''}`}
            style={t.tone === 'grey' ? { background: 'var(--ink-2)', color: '#fff' } : undefined}>
            {t.tag}
          </span>
          <div className="row" style={{ fontSize: 11.5, marginTop: 8 }}>
            <span className="muted">Last updated</span>
            <span className="spacer" />
            <span className="muted">{t.updated}</span>
          </div>
        </div>
      ))}
    </>
  )
}

/** Placeholder UI — the product owner supplies the final chat design. */
function ChatPanel({ m, client }: { m: Milestone; client: Client }) {
  const { dispatch, toast } = useStore()
  const [draft, setDraft] = useState('')
  const stage = displayStage(m)
  const started = m.stage > 1

  const send = () => {
    if (!draft.trim()) return
    if (m.stage === 1) {
      dispatch({ type: 'firstMessage', milestoneId: m.id })
      toast('Message sent — moved to Intent')
    } else {
      toast('Message sent')
    }
    setDraft('')
  }

  return (
    <>
      <div className="row gap6" style={{ marginBottom: 12 }}>
        <span style={{ fontSize: 15, fontWeight: 700 }}>Chat</span>
        <span className="spacer" />
        <span className="tag green">{started ? 'OPEN SESSION' : 'NEW'}</span>
        <span className="chip" style={{ background: STAGES[stage].hex }}>{STAGES[stage].name}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        {started ? (
          <>
            <div className="bubble them">Hi, I got the Elite plan. What does the wealth session cover?</div>
            <div className="bubble me">Hi {client.name.split(' ')[0]} — it's a 45-minute review of goals, risk and allocation. Shall I book a slot?</div>
          </>
        ) : (
          <div className="muted" style={{ fontSize: 12, lineHeight: 1.6 }}>
            <b>No wealth conversation yet</b><br />
            Sending the first message moves {client.name} to Intent.
          </div>
        )}
      </div>
      <div className="row gap6">
        <input
          className="input" style={{ flex: 1 }} placeholder="Type a message"
          value={draft} onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send() }}
        />
        <button className="btn primary" onClick={send} disabled={!draft.trim()}>Send</button>
      </div>
      <div className="muted" style={{ fontSize: 10.5, marginTop: 10 }}>Placeholder UI — final design pending.</div>
    </>
  )
}

function DocumentsPanel({ m }: { m: Milestone }) {
  const { toast } = useStore()
  const docs = [
    { name: 'PAN', status: 'Approved', tone: 'green' },
    { name: 'Form 16', status: 'Received', tone: 'green' },
    ...(m.stage >= 2 ? [{ name: 'CAS statement', status: 'Requested', tone: 'amber' }] : []),
    ...(m.stage >= 4 ? [{ name: 'KYC documents', status: 'Requested', tone: 'amber' }] : []),
  ]
  return (
    <>
      <div className="row" style={{ marginBottom: 12 }}>
        <span style={{ fontSize: 15, fontWeight: 700 }}>Documents</span>
        <span className="spacer" />
        <button className="btn" onClick={() => toast('Document requested')}>Request document</button>
      </div>
      {docs.map((d) => (
        <div className="qrow" key={d.name}>
          <span style={{ color: 'var(--muted)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 3h8l4 4v14H6z" /></svg>
          </span>
          <span>{d.name}</span>
          <span className="spacer" />
          <span className={`tag ${d.tone}`}>{d.status}</span>
        </div>
      ))}
    </>
  )
}

function MeetingsPanel({ m, onBook }: { m: Milestone; onBook: () => void }) {
  const [tab, setTab] = useState<'Upcoming' | 'Past' | 'Unmarked'>('Upcoming')
  const upcoming = m.stage === 3 && (m.status === 'Scheduled' || m.status === 'Rescheduled') ? 1 : 0
  const past = m.stage > 3 || m.status === 'Completed' ? 1 : 0
  const counts = { Upcoming: upcoming, Past: past, Unmarked: m.status === 'No-show' ? 1 : 0 }

  return (
    <>
      <div className="row" style={{ marginBottom: 12 }}>
        <span style={{ fontSize: 15, fontWeight: 700 }}>Meetings</span>
        <span className="spacer" />
        <button className="btn primary" onClick={onBook}>+ Book Call</button>
      </div>
      <div className="row gap6" style={{ marginBottom: 12 }}>
        {(['Upcoming', 'Past', 'Unmarked'] as const).map((t) => (
          <button key={t} className={`btn ${tab === t ? 'primary' : ''}`} onClick={() => setTab(t)}>
            {t} ({counts[t]})
          </button>
        ))}
      </div>
      {counts[tab] > 0 ? (
        <div className="ms-card">
          <div style={{ fontWeight: 700 }}>Wealth call</div>
          <div className="muted" style={{ fontSize: 11.5, marginTop: 4 }}>
            Fri 26 Sep 2026 · 11:00 – 11:45 am
          </div>
          <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>Status: {m.status}</div>
        </div>
      ) : (
        <div className="muted" style={{ fontSize: 12 }}>No {tab.toLowerCase()} meetings found.</div>
      )}
    </>
  )
}

export function RightRail({
  milestone, client, onBook,
}: {
  milestone: Milestone
  client: Client
  onBook: () => void
}) {
  const [open, setOpen] = useState<PanelKey | null>('Milestone')
  const keys: PanelKey[] = ['Milestone', 'Chat', 'Documents', 'Meetings']

  return (
    <>
      {open ? (
        <div className="panel">
          {open === 'Milestone' ? <MilestonePanel m={milestone} /> : null}
          {open === 'Chat' ? <ChatPanel m={milestone} client={client} /> : null}
          {open === 'Documents' ? <DocumentsPanel m={milestone} /> : null}
          {open === 'Meetings' ? <MeetingsPanel m={milestone} onBook={onBook} /> : null}
        </div>
      ) : null}
      <div className="rail">
        {keys.map((k) => (
          <button
            key={k}
            className={open === k ? 'on' : ''}
            onClick={() => setOpen(open === k ? null : k)}
          >
            <span className="ric">{RAIL_ICONS[k]}</span>
            {k}
          </button>
        ))}
      </div>
    </>
  )
}
