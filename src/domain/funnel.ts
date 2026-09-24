import type {
  DropReason, Flag, Milestone, RowTint, StageId, Status, TxStatus,
} from './types'

/** Stage table. Statuses and exit criteria follow `Wealth Onboarding P0.html`
 *  (const ST), which is the signed-off clickable artifact. NOTE: the handoff
 *  README lists only New/Contacted for stage 1 and a different exit rule — the
 *  prototype wins here; see README-IMPLEMENTATION-NOTES.md. */
export const STAGES = {
  1: { key: 'S1', name: 'Not started', color: 'var(--stage-1)', hex: '#374151',
       statuses: ['New', 'Contacted', 'Interested'] as const,
       exit: 'Interested' as Status, owner: 'RM' },
  2: { key: 'S2', name: 'Intent', color: 'var(--stage-2)', hex: '#1f5fd9',
       statuses: ['Awaiting docs', 'Schedule meeting'] as const,
       exit: 'Schedule meeting' as Status, owner: 'RM' },
  3: { key: 'S3', name: 'Wealth call', color: 'var(--stage-3)', hex: '#7c3aed',
       statuses: ['Scheduled', 'Rescheduled', 'No-show', 'Completed', 'Skipped'] as const,
       exit: 'Completed' as Status, owner: 'RM / Advisor' },
  4: { key: 'S4', name: 'Onboarding / Closed', color: 'var(--stage-4)', hex: '#0f8a7e',
       statuses: ['KYC pending', '1st session scheduled', 'Converted', 'Not converted'] as const,
       exit: 'Converted' as Status, owner: 'RM' },
  5: { key: 'S5', name: 'Transacting', color: 'var(--stage-5)', hex: '#0e7490',
       statuses: ['With us', 'Both', 'With others', 'Not transacting'] as const,
       exit: null, owner: 'System' },
} as const

export const EXIT_TEXT: Record<1 | 2 | 3 | 4, string> = {
  1: 'Interest shown by client',
  2: 'Request to schedule meeting',
  3: 'Call completed + MoM logged',
  4: '1st wealth session completed',
}

export const NEXT_ACTION: Partial<Record<Status, string>> = {
  'New': 'Make pitch call',
  'Contacted': 'Follow up for interest',
  'Interested': 'Move to Intent',
  'Awaiting docs': 'Collect docs',
  'Schedule meeting': 'Book wealth call',
  'Scheduled': 'Attend wealth call',
  'Rescheduled': 'Attend rescheduled call',
  'No-show': 'Reschedule or drop',
  'Completed': 'Log MoM to close Wealth call',
  'Skipped': 'Complete KYC',
  'KYC pending': 'Complete KYC',
  '1st session scheduled': 'Complete 1st wealth session',
}

export const DROP_REASONS: readonly DropReason[] = [
  'Not interested', 'Already has advisor', 'Low investable surplus',
  'Unreachable / no-show ×N', 'Pricing / fees', 'Trust / privacy concern',
  'Timing — later', 'Other',
]

export const PAGE_SIZE = 10
/** Days in stage at which the Stuck flag appears. */
export const STUCK_DAYS = 5

export const stageName = (s: StageId) => STAGES[s].name
export const stageColor = (s: StageId) => STAGES[s].color
export const statusesFor = (s: StageId): readonly Status[] =>
  STAGES[s].statuses as readonly Status[]

// ── Derived state ────────────────────────────────────────────────────────────

export const isDropped = (m: Milestone) => m.status === 'Dropped'
export const isConverted = (m: Milestone) =>
  m.status === 'Converted' || m.tx_status !== null
/** R5 — a milestone closes only on Converted or Dropped. */
export const isClosed = (m: Milestone) => isDropped(m) || isConverted(m)

/** R7 — Completed without a MoM keeps the client in Wealth call, flagged. */
export const isMoMPending = (m: Milestone) =>
  m.stage === 3 && m.status === 'Completed' && !m.mom_logged

export function daysInStage(m: Milestone, now = new Date()): number {
  const ms = now.getTime() - new Date(m.stage_entered_at).getTime()
  return Math.max(0, Math.floor(ms / 86_400_000))
}

/** A converted client transacting with us (or both) surfaces as Transacting.
 *  Whether "With others" should count is PRD Q-open — it does not, for now. */
export function displayStage(m: Milestone): StageId {
  if (isDropped(m)) return m.dropped_at_stage ?? m.stage
  if (m.tx_status === 'With us' || m.tx_status === 'Both') return 5
  return m.stage
}

export function displayStatus(m: Milestone): Status | TxStatus {
  if (isDropped(m)) return 'Dropped'
  if (displayStage(m) === 5 && m.tx_status) return m.tx_status
  return m.status
}

export function flagsFor(m: Milestone, now = new Date()): Flag[] {
  const out: Flag[] = []
  if (isDropped(m)) out.push({ kind: 'Dropped', label: 'Dropped', tone: 'red' })
  if (m.status === 'Converted' || m.tx_status)
    out.push({ kind: 'Converted', label: 'Converted', tone: 'green' })
  if (isMoMPending(m)) out.push({ kind: 'MoM pending', label: 'MoM pending', tone: 'amber' })
  if (m.noshow_count > 0)
    out.push({ kind: 'No-show', label: `No-show ×${m.noshow_count}`, tone: 'red' })
  if (!isClosed(m)) {
    const d = daysInStage(m, now)
    if (d >= STUCK_DAYS) out.push({ kind: 'Stuck', label: `Stuck ${d}d`, tone: 'red' })
  }
  return out
}

/** Closed rows are untinted. Red = RM must act, amber = waiting on someone else. */
export function rowTint(m: Milestone, now = new Date()): RowTint {
  if (isClosed(m)) return null
  const d = daysInStage(m, now)
  if (m.status === 'No-show' || d >= STUCK_DAYS) return 'red'
  if (isMoMPending(m)) return 'amber'
  if (m.status === 'Awaiting docs' || m.status === 'Scheduled' || m.status === 'Rescheduled')
    return 'amber'
  if (m.status === 'New' || m.status === 'Contacted' || m.status === 'Schedule meeting')
    return 'red'
  return null
}

export function nextActionFor(m: Milestone): string {
  if (isDropped(m)) return '—'
  if (m.status === 'Converted') return 'Milestone closed'
  if (isMoMPending(m)) return 'Awaiting MoM from advisor'
  return NEXT_ACTION[m.status] ?? '—'
}

/** At risk = RM action needed now (red tint), used by the dashboard card. */
export const isAtRisk = (m: Milestone, now = new Date()) => rowTint(m, now) === 'red'
