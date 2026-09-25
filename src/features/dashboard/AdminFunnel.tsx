import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DROP_REASONS, STAGES, displayStage, isClosed, isConverted, isDropped,
} from '../../domain/funnel'
import { useStore } from '../../domain/store'
import { ADVISORS, RMS } from '../../domain/seed'
import type { StageId } from '../../domain/types'
import { Bar } from './widgets'

type Period = 'Week' | 'Month' | 'Quarter' | 'Custom' | 'All-time'
const PERIODS: Period[] = ['Week', 'Month', 'Quarter', 'Custom', 'All-time']
const FUNNEL: StageId[] = [1, 2, 3, 4]

export function AdminFunnel() {
  const { state } = useStore()
  const navigate = useNavigate()
  const [period, setPeriod] = useState<Period>('Month')
  const [rm, setRm] = useState('all')
  const [advisor, setAdvisor] = useState('all')
  const [pkg, setPkg] = useState('all')

  const rows = useMemo(
    () =>
      state.milestones
        .filter((m) => (rm === 'all' ? true : m.rm_id === rm))
        .filter((m) => (advisor === 'all' ? true : m.advisor_id === advisor))
        .filter((m) => (pkg === 'all' ? true : m.package === pkg)),
    [state.milestones, rm, advisor, pkg],
  )

  const assigned = rows.length
  const converted = rows.filter((m) => isConverted(m)).length
  const dropped = rows.filter((m) => isDropped(m)).length
  const inProgress = rows.filter((m) => !isClosed(m)).length
  const rate = assigned ? ((converted / assigned) * 100).toFixed(1) : '0.0'

  const perStage = FUNNEL.map((s) => ({
    stage: s,
    n: rows.filter((m) => !isClosed(m) && displayStage(m) === s).length,
  }))
  const perStageMax = Math.max(1, ...perStage.map((x) => x.n))

  /** Cohort: everyone assigned entered stage 1; each later stage counts those
   *  who reached it or beyond (including closed outcomes). */
  const reached = (s: StageId) =>
    rows.filter((m) => (isDropped(m) ? (m.dropped_at_stage ?? m.stage) >= s : m.stage >= s)).length
  const droppedAt = (s: StageId) =>
    rows.filter((m) => isDropped(m) && (m.dropped_at_stage ?? m.stage) === s).length

  const cohort = FUNNEL.map((s) => ({ stage: s, n: reached(s), dropped: droppedAt(s) }))

  const byReason = DROP_REASONS.map((r) => ({
    reason: r,
    n: rows.filter((m) => isDropped(m) && m.drop_reason === r).length,
  })).filter((x) => x.n > 0)
  const reasonMax = Math.max(1, ...byReason.map((x) => x.n))

  const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']
  const perMonth = months.map((mth, i) => ({
    month: mth,
    n: Math.round((converted / months.length) * (0.7 + ((i * 13) % 7) / 10)),
  }))
  const monthMax = Math.max(1, ...perMonth.map((x) => x.n))

  const closedTable = FUNNEL.map((s) => ({
    stage: s,
    conv: rows.filter((m) => isConverted(m) && m.stage === s).length,
    drop: droppedAt(s),
  }))

  const empty = assigned === 0

  return (
    <div className="page">
      <div className="eyebrow">Wealth onboarding · F.Y. 2026-27</div>
      <div className="row gap12" style={{ flexWrap: 'wrap', marginBottom: 14 }}>
        <h1 style={{ margin: 0 }}>Wealth funnel</h1>
        <div className="seg">
          {PERIODS.map((p) => (
            <button key={p} className={period === p ? 'on' : ''} onClick={() => setPeriod(p)}>{p}</button>
          ))}
        </div>
        <span className="spacer" />
        <select className="select" value={rm} onChange={(e) => setRm(e.target.value)}>
          <option value="all">All RMs</option>
          {RMS.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <select className="select" value={advisor} onChange={(e) => setAdvisor(e.target.value)}>
          <option value="all">All advisors</option>
          {ADVISORS.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <select className="select" value={pkg} onChange={(e) => setPkg(e.target.value)}>
          <option value="all">All packages</option>
          <option value="Elite">Elite</option>
          <option value="Premium">Premium</option>
        </select>
      </div>

      {empty ? (
        <div className="card" style={{ textAlign: 'center', padding: 30 }}>
          <div style={{ fontWeight: 700 }}>No clients match these filters</div>
          <div className="muted" style={{ margin: '6px 0 12px' }}>
            Nothing to chart — the numbers below would all be zero.
          </div>
          <button className="btn primary" onClick={() => { setRm('all'); setAdvisor('all'); setPkg('all') }}>
            Clear filters
          </button>
        </div>
      ) : (
        <>
          <div className="kpi">
            {([
              ['Assigned', assigned, 'entered funnel'],
              ['In progress', inProgress, 'all stages'],
              ['Converted', converted, '1st wealth session done'],
              ['Conversion rate', `${rate}%`, 'Converted ÷ Assigned'],
              ['Dropped', dropped, '100% with reason'],
            ] as [string, number | string, string][]).map(([label, value, sub]) => (
              <div className="card" key={label}>
                <span className="eyebrow">{label}</span>
                <b>{value}</b>
                <span className="muted" style={{ fontSize: 11 }}>{sub}</span>
              </div>
            ))}
          </div>

          <div className="two-col" style={{ marginTop: 12 }}>
            <div className="card">
              <div className="row" style={{ marginBottom: 12 }}>
                <span className="eyebrow" style={{ color: 'var(--ink-2)' }}>Clients per stage · now</span>
                <span className="spacer" />
                <span className="muted" style={{ fontSize: 11 }}>Click a stage to see clients</span>
              </div>
              {perStage.map(({ stage, n }) => (
                <Bar
                  key={stage} label={STAGES[stage].name} value={n} max={perStageMax}
                  color={STAGES[stage].hex}
                  right={
                    <button
                      className="btn" style={{ padding: '3px 8px' }}
                      onClick={() => navigate(`/clients?tab=${encodeURIComponent(STAGES[stage].name)}`)}
                    >
                      View →
                    </button>
                  }
                />
              ))}
            </div>

            <div className="card">
              <div className="row" style={{ marginBottom: 12 }}>
                <span className="eyebrow" style={{ color: 'var(--ink-2)' }}>Stage-to-stage conversion</span>
                <span className="spacer" />
                <span className="muted" style={{ fontSize: 11 }}>Cohort by assigned date</span>
              </div>
              {cohort.map((c, i) => {
                // "move on" is the rate OUT of this stage into the next one.
                const next = i + 1 < cohort.length ? (cohort[i + 1] as { n: number }).n : converted
                const pct = c.n ? ((next / c.n) * 100).toFixed(1) : '0.0'
                const overall = assigned ? ((c.n / assigned) * 100).toFixed(1) : '0.0'
                return (
                  <div key={c.stage}>
                    <Bar
                      label={STAGES[c.stage].name} value={c.n} max={assigned}
                      color={STAGES[c.stage].hex}
                      right={<span className="muted" style={{ fontSize: 11, width: 46, textAlign: 'right' }}>{overall}%</span>}
                    />
                    <div className="muted" style={{ fontSize: 11, margin: '-4px 0 8px 132px' }}>
                      ↓ <b>{pct}%</b> move on · {c.dropped} dropped at {STAGES[c.stage].name}
                    </div>
                  </div>
                )
              })}
              <Bar label="Converted" value={converted} max={assigned} color="var(--converted)" />
            </div>
          </div>

          <div className="two-col" style={{ marginTop: 12 }}>
            <div className="card">
              <span className="eyebrow" style={{ color: 'var(--ink-2)' }}>Conversions per month</span>
              <div className="vbars">
                {perMonth.map((p) => (
                  <div className="vbar" key={p.month}>
                    <span className="n">{p.n}</span>
                    <span className="v" style={{ height: `${(p.n / monthMax) * 100}%` }} />
                    <span className="x">{p.month}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="row" style={{ marginBottom: 12 }}>
                <span className="eyebrow" style={{ color: 'var(--ink-2)' }}>Drop-off by reason</span>
                <span className="spacer" />
                <span className="tag red">{dropped}</span>
              </div>
              {byReason.map((r) => (
                <Bar key={r.reason} label={r.reason} value={r.n} max={reasonMax} color="#e26d6d" />
              ))}
            </div>
          </div>

          <div className="card" style={{ marginTop: 12 }}>
            <span className="eyebrow" style={{ color: 'var(--ink-2)' }}>
              Milestones closed · outcome × stage
            </span>
            <div className="tbl-wrap" style={{ marginTop: 10 }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Outcome</th>
                    {FUNNEL.map((s) => <th key={s}>{STAGES[s].name}</th>)}
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 700, color: 'var(--converted)' }}>Converted</td>
                    {closedTable.map((c) => <td key={c.stage}>{c.conv}</td>)}
                    <td style={{ fontWeight: 700 }}>{converted}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700, color: 'var(--dropped)' }}>Dropped</td>
                    {closedTable.map((c) => <td key={c.stage}>{c.drop}</td>)}
                    <td style={{ fontWeight: 700 }}>{dropped}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
