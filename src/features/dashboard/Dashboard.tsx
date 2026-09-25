import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '../../components/ui'
import {
  STAGES, displayStage, flagsFor, isAtRisk, isClosed, isConverted, isDropped, isMoMPending,
} from '../../domain/funnel'
import { useStore } from '../../domain/store'
import { personName } from '../../domain/seed'
import type { Client, Milestone } from '../../domain/types'
import { AdminFunnel } from './AdminFunnel'
import { Icon, MilestoneCard, StatCards, TAX_WIDGETS, type MilestoneWidget } from './widgets'

const today = () =>
  new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'short', year: 'numeric',
  }).toUpperCase()

function Strip({ wealth }: { wealth: MilestoneWidget }) {
  const ref = useRef<HTMLDivElement>(null)
  const scroll = (dir: number) => ref.current?.scrollBy({ left: dir * 272, behavior: 'smooth' })
  const all = [wealth, ...TAX_WIDGETS]
  return (
    <>
      <div className="sec">
        <span className="eyebrow" style={{ color: 'var(--ink-2)' }}>
          Active milestone ({all.length})
        </span>
        <div className="sarr">
          <button title="Scroll left" onClick={() => scroll(-1)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M15 6l-6 6 6 6" /></svg>
          </button>
          <button title="Scroll right" onClick={() => scroll(1)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M9 6l6 6-6 6" /></svg>
          </button>
        </div>
      </div>
      <div className="strip" ref={ref}>
        {all.map((w) => <MilestoneCard key={w.title} w={w} />)}
      </div>
    </>
  )
}

/** An RM sees their own book; an advisor sees clients assigned to them. The
 *  admin funnel is the only all-up view. */
function useRows(scope: 'rm' | 'advisor') {
  const { state } = useStore()
  const mine = state.milestones.filter((m) =>
    scope === 'rm' ? m.rm_id === state.actorId : m.advisor_id === state.actorId,
  )
  const clientOf = (m: Milestone) => state.clients.find((c) => c.id === m.client_id) as Client
  return { mine, clientOf }
}

function RMDash() {
  const { mine, clientOf } = useRows('rm')
  const navigate = useNavigate()

  const open = mine.filter((m) => !isClosed(m))
  const notStarted = mine.filter((m) => !isDropped(m) && displayStage(m) === 1)
  const converted = mine.filter((m) => isConverted(m))
  const atRisk = open.filter((m) => isAtRisk(m))
  const upcoming = mine.filter(
    (m) => m.stage === 3 && (m.status === 'Scheduled' || m.status === 'Rescheduled'),
  )

  const wealth: MilestoneWidget = {
    title: 'Wealth Onboarding', big: open.length, unit: 'open',
    subs: [[notStarted.length, 'not started', '#1f2937'], [converted.length, 'converted', '#15803d']],
    tileBg: '#e6f4ea', tileFg: '#15803d', icon: Icon.chart,
    wealth: true, isNew: true, onClick: () => navigate('/clients'),
  }

  return (
    <div className="page">
      <div className="eyebrow">{today()}</div>
      <h1>Dashboard</h1>
      <StatCards items={[['Open sessions', 2, '#f59e0b'], ['Action pending', atRisk.length, '#dc2626'], ['Open tasks', 25, '#1f5fd9']]} />
      <Strip wealth={wealth} />

      <div className="two-col" style={{ marginTop: 14 }}>
        <div className="card">
          <div className="row gap8" style={{ marginBottom: 6 }}>
            <span style={{ color: 'var(--tag-red-fg)', display: 'inline-flex' }}>{Icon.warn}</span>
            <span className="eyebrow" style={{ color: 'var(--ink-2)' }}>At risk · Wealth</span>
            <span className="spacer" />
            <span className="tag red">{atRisk.length}</span>
            <button className="btn" style={{ padding: '4px 8px' }} onClick={() => navigate('/clients?tab=At risk')}>
              Open all
            </button>
          </div>
          {atRisk.slice(0, 5).map((m) => {
            const c = clientOf(m)
            const flag = flagsFor(m)[0]
            return (
              <div className="qrow" key={m.id}>
                <Avatar name={c.name} />
                <div style={{ minWidth: 0 }}>
                  <div className="row gap6">
                    <span style={{ fontWeight: 700 }}>{c.name}</span>
                    <span className="tag red">AT RISK</span>
                  </div>
                  <div className="muted" style={{ fontSize: 11.5 }}>
                    {STAGES[displayStage(m)].name} · {m.status}
                  </div>
                </div>
                <span className="spacer" />
                {flag ? <span className={`tag ${flag.tone}`}>{flag.label}</span> : null}
                <button className="btn primary" onClick={() => navigate(`/clients/${c.id}`)}>Open</button>
              </div>
            )
          })}
          {atRisk.length === 0 ? <div className="muted" style={{ padding: '14px 0' }}>Nothing at risk.</div> : null}
        </div>

        <div className="card">
          <div className="row gap8" style={{ marginBottom: 6 }}>
            <span style={{ color: 'var(--primary)', display: 'inline-flex' }}>{Icon.cal}</span>
            <span className="eyebrow" style={{ color: 'var(--ink-2)' }}>Upcoming wealth calls</span>
            <span className="spacer" />
            <span className="tag blue">{upcoming.length}</span>
          </div>
          {upcoming.slice(0, 5).map((m) => {
            const c = clientOf(m)
            return (
              <div className="qrow" key={m.id}>
                <span className="timeblock">11:00<br />am</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700 }}>Wealth Call with {c.name}</div>
                  <div className="muted" style={{ fontSize: 11.5 }}>
                    Fri 26 Sep · 11:00 – 11:45 am · Adv: {personName(m.advisor_id)}
                  </div>
                </div>
                <span className="spacer" />
                <button className="btn" onClick={() => navigate(`/clients/${c.id}`)}>Open</button>
              </div>
            )
          })}
          {upcoming.length === 0 ? <div className="muted" style={{ padding: '14px 0' }}>No upcoming wealth calls.</div> : null}
        </div>
      </div>
    </div>
  )
}

function AdvisorDash() {
  const { mine, clientOf } = useRows('advisor')
  const navigate = useNavigate()

  const calls = mine.filter(
    (m) => m.stage === 3 && ['Scheduled', 'Rescheduled', 'No-show'].includes(m.status),
  )
  const moms = mine.filter((m) => isMoMPending(m))

  const wealth: MilestoneWidget = {
    title: 'Wealth Onboarding', big: calls.length + moms.length, unit: 'wealth calls & MoMs',
    subs: [], tileBg: '#e6f4ea', tileFg: '#15803d', icon: Icon.chart,
    wealth: true, isNew: true, onClick: () => navigate('/clients'),
  }

  return (
    <div className="page">
      <div className="eyebrow">{today()}</div>
      <h1>Dashboard</h1>
      <StatCards items={[['Open sessions', 2, '#f59e0b'], ['Action pending', moms.length, '#dc2626'], ['Open tasks', 25, '#1f5fd9']]} />
      <Strip wealth={wealth} />

      <div className="two-col" style={{ marginTop: 14 }}>
        <div className="card">
          <div className="row gap8" style={{ marginBottom: 6 }}>
            <span style={{ color: 'var(--primary)', display: 'inline-flex' }}>{Icon.cal}</span>
            <span className="eyebrow" style={{ color: 'var(--ink-2)' }}>Wealth calls</span>
            <span className="spacer" />
            <span className="tag blue">{calls.length}</span>
          </div>
          {calls.slice(0, 6).map((m) => {
            const c = clientOf(m)
            return (
              <div className="qrow" key={m.id}>
                <Avatar name={c.name} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700 }}>Wealth Call with {c.name}</div>
                  <div className="muted" style={{ fontSize: 11.5 }}>
                    {m.status === 'No-show'
                      ? `No-show ×${m.noshow_count} · reschedule pending · RM ${personName(m.rm_id)}`
                      : `Fri 26 Sep · 11:00 – 11:45 am · RM ${personName(m.rm_id)}`}
                  </div>
                </div>
                <span className="spacer" />
                {m.noshow_count > 0 ? <span className="tag red">No-show ×{m.noshow_count}</span> : null}
                <button className="btn" onClick={() => navigate(`/clients/${c.id}`)}>Update</button>
              </div>
            )
          })}
        </div>

        <div className="card">
          <div className="row gap8" style={{ marginBottom: 6 }}>
            <span style={{ color: 'var(--tag-amber-fg)', display: 'inline-flex' }}>{Icon.doc}</span>
            <span className="eyebrow" style={{ color: 'var(--ink-2)' }}>MoM pending</span>
            <span className="spacer" />
            <span className="tag amber">{moms.length}</span>
          </div>
          {moms.slice(0, 6).map((m) => {
            const c = clientOf(m)
            return (
              <div className="qrow" key={m.id}>
                <span className="timeblock">11:00<br />am</span>
                <div style={{ minWidth: 0 }}>
                  <div className="row gap6">
                    <span style={{ fontWeight: 700 }}>Wealth Call with {c.name}</span>
                    <span className="tag green">WEALTH</span>
                  </div>
                  <div className="muted" style={{ fontSize: 11.5 }}>
                    23 Sept 2026 · 11:00 – 11:45 am · Wealth call exit blocked
                  </div>
                </div>
                <span className="spacer" />
                <button className="btn primary" onClick={() => navigate(`/clients/${c.id}`)}>Add MOM</button>
              </div>
            )
          })}
          {moms.length === 0 ? <div className="muted" style={{ padding: '14px 0' }}>No MoMs pending.</div> : null}
        </div>
      </div>
    </div>
  )
}

export function Dashboard() {
  const { state } = useStore()
  if (state.role === 'WEALTH_ADMIN') return <AdminFunnel />
  if (state.role === 'WEALTH_ADVISOR') return <AdvisorDash />
  return <RMDash />
}
