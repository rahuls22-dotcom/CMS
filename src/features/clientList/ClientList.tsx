import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CopyLine, FlagTags, PackageBadge, StageChip,
} from '../../components/ui'
import {
  PAGE_SIZE, STAGES, displayStage, displayStatus, flagsFor, isClosed, isConverted,
  isDropped, nextActionFor, rowTint, statusesFor,
} from '../../domain/funnel'
import { useStore } from '../../domain/store'
import { ADVISORS, RMS, personName } from '../../domain/seed'
import type { Milestone, StageId, Status } from '../../domain/types'

type TabKey = 'All' | 'Not started' | 'Intent' | 'Wealth call' | 'Onboarding'
  | 'Converted' | 'Transacting' | 'Dropped' | 'At risk'

const TAB_ORDER: TabKey[] = [
  'All', 'Not started', 'Intent', 'Wealth call', 'Onboarding',
  'Converted', 'Transacting', 'Dropped',
]

const STAGE_OF_TAB: Partial<Record<TabKey, StageId>> = {
  'Not started': 1, 'Intent': 2, 'Wealth call': 3, 'Onboarding': 4, 'Transacting': 5,
}

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, '')

export function ClientList({ initialTab = 'All' }: { initialTab?: TabKey }) {
  const { state, toast } = useStore()
  const navigate = useNavigate()
  const [tab, setTab] = useState<TabKey>(initialTab)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<'all' | Status>('all')
  const [pkg, setPkg] = useState<'all' | 'Elite' | 'Premium'>('all')
  const [advisor, setAdvisor] = useState('all')
  const [rm, setRm] = useState('all')
  const [page, setPage] = useState(1)

  const isAdmin = state.role === 'WEALTH_ADMIN'
  const clientOf = (m: Milestone) => state.clients.find((c) => c.id === m.client_id)!

  const matchesTab = (m: Milestone, t: TabKey): boolean => {
    if (t === 'All') return !isClosed(m)
    if (t === 'Dropped') return isDropped(m)
    if (t === 'Converted') return isConverted(m) && displayStage(m) !== 5
    if (t === 'At risk') return rowTint(m) === 'red'
    const want = STAGE_OF_TAB[t]
    if (!want) return true
    return !isDropped(m) && displayStage(m) === want
  }

  const counts = useMemo(() => {
    const out = {} as Record<TabKey, number>
    for (const t of TAB_ORDER) out[t] = state.milestones.filter((m) => matchesTab(m, t)).length
    out['At risk'] = state.milestones.filter((m) => matchesTab(m, 'At risk')).length
    return out
  }, [state.milestones])

  const rows = useMemo(() => {
    const needle = norm(q)
    return state.milestones
      .filter((m) => matchesTab(m, tab))
      .filter((m) => (status === 'all' ? true : m.status === status))
      .filter((m) => (pkg === 'all' ? true : m.package === pkg))
      .filter((m) => (advisor === 'all' ? true : m.advisor_id === advisor))
      .filter((m) => (rm === 'all' ? true : m.rm_id === rm))
      .filter((m) => {
        if (!needle) return true
        const c = clientOf(m)
        return [c.name, c.phone, c.email, c.pan].some((f) => norm(f).includes(needle))
      })
      .sort((a, b) => b.last_activity_at.localeCompare(a.last_activity_at))
  }, [state.milestones, state.clients, tab, q, status, pkg, advisor, rm])

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const current = Math.min(page, pages)
  const slice = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  const reset = <T,>(setter: (v: T) => void) => (v: T) => { setter(v); setPage(1) }
  const singleStageTab = STAGE_OF_TAB[tab] !== undefined
  const inProgress = state.milestones.filter((m) => !isClosed(m)).length
  const convertedCount = state.milestones.filter((m) => isConverted(m)).length

  return (
    <div className="page">
      <div className="row gap12" style={{ marginBottom: 12, flexWrap: 'wrap' }}>
        <select className="select" defaultValue="Wealth Onboarding">
          <option>Wealth Onboarding</option>
          <option>Tax planning</option>
          <option>Advance tax</option>
          <option>Declaration &amp; Proof Submission</option>
          <option>Year End Tax Review</option>
          <option>ITR</option>
        </select>
        <span className="tag blue">FY 2026-27</span>
        <span className="spacer" />
        <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--converted)' }}>{inProgress}</span>
        <span className="muted">In progress</span>
        <span className="muted">|</span>
        <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary)' }}>{convertedCount}</span>
        <span className="muted">Converted</span>
      </div>

      <div className="tabs">
        {(tab === 'At risk' ? [...TAB_ORDER, 'At risk' as TabKey] : TAB_ORDER).map((t) => (
          <button
            key={t}
            className={`tab ${tab === t ? 'active' : ''}`}
            onClick={() => { setTab(t); setPage(1); setStatus('all') }}
          >
            {t}<span className="count">{counts[t] ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="row gap8" style={{ marginBottom: 10, flexWrap: 'wrap' }}>
        <input
          className="input" style={{ minWidth: 260 }}
          placeholder="Search name, phone, email or PAN"
          value={q} onChange={(e) => reset(setQ)(e.target.value)}
        />
        <select
          className="select" value={status} disabled={!singleStageTab}
          onChange={(e) => reset(setStatus)(e.target.value as 'all' | Status)}
        >
          <option value="all">Select status</option>
          {singleStageTab
            ? statusesFor(STAGE_OF_TAB[tab] as StageId).map((s) => <option key={s} value={s}>{s}</option>)
            : null}
        </select>
        <select className="select" value={pkg} onChange={(e) => reset(setPkg)(e.target.value as typeof pkg)}>
          <option value="all">All packages</option>
          <option value="Elite">Elite</option>
          <option value="Premium">Premium</option>
        </select>
        <select className="select" value={advisor} onChange={(e) => reset(setAdvisor)(e.target.value)}>
          <option value="all">All wealth advisors</option>
          {ADVISORS.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        {isAdmin ? (
          <select className="select" value={rm} onChange={(e) => reset(setRm)(e.target.value)}>
            <option value="all">All RMs</option>
            {RMS.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        ) : null}
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>User details</th><th>Details</th><th>Stage</th><th>Status</th>
                <th>Next action</th><th>Last action</th><th>Wealth advisor</th>
                <th>Flags</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {slice.map((m) => {
                const c = clientOf(m)
                const tint = rowTint(m)
                const st = displayStage(m)
                const last = [...state.history]
                  .filter((h) => h.milestone_id === m.id)
                  .sort((a, b) => b.at.localeCompare(a.at))[0]
                return (
                  <tr
                    key={m.id}
                    className={`clickable ${tint ? `tint-${tint}` : ''}`}
                    onClick={() => navigate(`/clients/${c.id}`)}
                  >
                    <td>
                      <div style={{ fontWeight: 700 }}>{c.name}</div>
                      <PackageBadge pkg={c.package} />
                    </td>
                    <td>
                      <CopyLine value={c.phone} onCopied={(v) => toast(`Copied ${v}`)} />
                      <CopyLine value={c.email} onCopied={(v) => toast(`Copied ${v}`)} />
                      <CopyLine value={c.pan} onCopied={(v) => toast(`Copied ${v}`)} />
                    </td>
                    <td><StageChip stage={st} /></td>
                    <td>
                      <span style={{ color: STAGES[st].hex, fontWeight: 600 }}>
                        {displayStatus(m)}
                      </span>
                      {isDropped(m) && m.drop_reason ? (
                        <div className="muted" style={{ fontSize: 11 }}>{m.drop_reason}</div>
                      ) : null}
                    </td>
                    <td className="wrap" style={{ maxWidth: 160 }}>{nextActionFor(m)}</td>
                    <td>
                      <div className="ellipsis" style={{ maxWidth: 180 }}>{last?.event ?? '—'}</div>
                      <div className="muted" style={{ fontSize: 11 }}>
                        {last
                          ? `${last.actor_role === 'System' ? 'System' : personName(last.actor_id)} · ${new Date(last.at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}`
                          : ''}
                      </div>
                    </td>
                    <td>{personName(m.advisor_id)}</td>
                    <td><FlagTags flags={flagsFor(m)} /></td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="row gap6">
                        <button className="icon-btn" title="Chat" onClick={() => toast('Chat drawer — placeholder UI')}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16v12H8l-4 4z" /></svg>
                        </button>
                        <button
                          className="icon-btn" title="Schedule" disabled={isClosed(m)}
                          onClick={() => toast('Book call dialog — placeholder UI')}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {slice.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '26px 14px', textAlign: 'center' }}>
                    <div style={{ fontWeight: 700 }}>No clients here</div>
                    <div className="muted" style={{ marginTop: 4 }}>
                      {q || status !== 'all' || pkg !== 'all' || advisor !== 'all'
                        ? 'No client matches these filters.'
                        : `No client is currently at ${tab}.`}
                    </div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="row gap12" style={{ padding: '10px 14px', borderTop: '1px solid var(--divider)', flexWrap: 'wrap' }}>
          <span className="tag red">⚡ Red = Your action needed</span>
          <span className="tag amber">⏳ Amber = Waiting</span>
          <span className="spacer" />
          <span className="muted">Page {current} of {pages} ({rows.length} total)</span>
          <button className="btn" disabled={current <= 1} onClick={() => setPage(current - 1)}>Prev</button>
          <button className="btn" disabled={current >= pages} onClick={() => setPage(current + 1)}>Next</button>
        </div>
      </div>
    </div>
  )
}
