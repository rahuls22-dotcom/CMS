import type {
  Client, HistoryEntry, Milestone, PackageName, Person, StageId, Status, TxStatus,
} from './types'

/** Name pools and PAN generator mirror `Wealth Onboarding P0.html` so the mock
 *  rows match the prototype your team has been reviewing. */
const FN = ['Aarav','Diya','Rahul','Sneha','Vivek','Ishaan','Nisha','Kabir','Riya','Aditya',
  'Tara','Nikhil','Anjali','Yash','Priyanka','Siddharth','Kavita','Harsh','Lakshmi','Varun',
  'Sanya','Omkar','Pallavi','Gaurav','Ritika','Manish','Swati','Deepak','Bhavna','Rohit']
const LN = ['Sharma','Menon','Agarwal','Nair','Chopra','Bhatt','Kulkarni','Sinha','Desai',
  'Malhotra','Rao','Banerjee','Pillai','Mishra','Thakur','Saxena','Hegde','Ghosh','Kapoor','Reddy']
const PL = 'ABCDEFGHJKLMNPRSTUVWXYZ'

const at = <T,>(arr: readonly T[], i: number): T => arr[i % arr.length] as T
/** PL is a string, so it needs its own accessor — `at` is for arrays. */
const ch = (s: string, i: number): string => s.charAt(i % s.length)

function makePan(idx: number, name: string): string {
  const last = name.split(' ').pop() ?? 'X'
  return (
    ch(PL, idx * 7) + ch(PL, idx * 3) + ch(PL, idx * 11 + 5) + 'P' +
    (last[0] ?? 'X').toUpperCase() +
    String(1000 + ((idx * 397) % 9000)).slice(-4) +
    ch(PL, idx * 13)
  )
}

export const RMS: Person[] = [
  { id: 'rm1', name: 'Neha Verma', role: 'RM' },
  { id: 'rm2', name: 'Arjun Shetty', role: 'RM' },
]
export const ADVISORS: Person[] = [
  { id: 'ad1', name: 'Rohan Mehta', role: 'WEALTH_ADVISOR' },
  { id: 'ad2', name: 'Priya Iyer', role: 'WEALTH_ADVISOR' },
  { id: 'ad3', name: 'Karan Joshi', role: 'WEALTH_ADVISOR' },
]
export const ADMIN: Person = { id: 'am1', name: 'Meera Raghavan', role: 'WEALTH_ADMIN' }
export const ALL_PEOPLE = [...RMS, ...ADVISORS, ADMIN]
export const personName = (id: string) =>
  ALL_PEOPLE.find((p) => p.id === id)?.name ?? 'System'

/** Deterministic so reloads produce the same list — mock data, not randomness. */
const daysAgo = (n: number, hour = 11, min = 15) => {
  const d = new Date()
  d.setHours(hour, min, 0, 0)
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

interface Blueprint {
  stage: StageId
  status: Status
  noshow?: number
  mom?: boolean
  tx?: TxStatus
  droppedAt?: StageId
  reason?: Milestone['drop_reason']
  inStage: number
}

/** Distribution targets the prototype's admin funnel: 240 assigned, ~141 in
 *  progress, 41 converted, 58 dropped. Deterministic — no randomness. */
interface Blueprint {
  stage: StageId
  status: Status
  noshow?: number
  mom?: boolean
  tx?: TxStatus
  droppedAt?: StageId
  reason?: Milestone['drop_reason']
  inStage: number
}

const S1: Status[] = ['New', 'Contacted', 'Interested']
const S2: Status[] = ['Awaiting docs', 'Schedule meeting']
const S3: Status[] = ['Scheduled', 'Rescheduled', 'No-show', 'Completed', 'Skipped']
const S4: Status[] = ['KYC pending', '1st session scheduled']
const REASONS: NonNullable<Milestone['drop_reason']>[] = [
  'Not interested', 'Already has advisor', 'Low investable surplus',
  'Unreachable / no-show ×N', 'Pricing / fees', 'Trust / privacy concern', 'Timing — later',
]

function buildBlueprints(): Blueprint[] {
  const out: Blueprint[] = []
  const age = (i: number, spread: number) => (i * 7) % spread

  // Open funnel — 64 / 38 / 22 / 17 per the prototype's "clients per stage".
  for (let i = 0; i < 64; i++) out.push({ stage: 1, status: at(S1, i), inStage: age(i, 11) })
  for (let i = 0; i < 38; i++) out.push({ stage: 2, status: at(S2, i), inStage: age(i, 9) })
  for (let i = 0; i < 22; i++) {
    const st = at(S3, i)
    out.push({
      stage: 3, status: st, inStage: age(i, 8),
      noshow: st === 'No-show' ? 1 + (i % 2) : 0,
      mom: false,
    })
  }
  for (let i = 0; i < 17; i++) out.push({ stage: 4, status: at(S4, i), inStage: age(i, 7) })

  // Converted — 41, of which some are transacting.
  for (let i = 0; i < 41; i++) {
    const tx: TxStatus | undefined =
      i % 4 === 0 ? 'With us' : i % 4 === 1 ? 'Both' : i % 7 === 3 ? 'With others' : undefined
    out.push({ stage: 4, status: 'Converted', mom: true, tx, inStage: 5 + age(i, 28) })
  }

  // Dropped — 58, spread across stages 1-4 with the prototype's reason mix.
  const dropStage: StageId[] = [1, 1, 2, 2, 3, 4]
  for (let i = 0; i < 58; i++) {
    const st = at(dropStage, i)
    const reason = at(REASONS, i)
    out.push({
      stage: st, status: 'Dropped', droppedAt: st, reason,
      noshow: reason === 'Unreachable / no-show ×N' ? 2 + (i % 2) : 0,
      inStage: 6 + age(i, 24),
    })
  }
  return out
}

const BLUEPRINTS: Blueprint[] = buildBlueprints()

export interface SeedData {
  clients: Client[]
  milestones: Milestone[]
  history: HistoryEntry[]
}

export function buildSeed(): SeedData {
  const clients: Client[] = []
  const milestones: Milestone[] = []
  const history: HistoryEntry[] = []
  let hid = 0

  BLUEPRINTS.forEach((bp, i) => {
    const idx = i + 1
    const name = `${at(FN, idx * 3)} ${at(LN, idx * 7)}`
    const pkg: PackageName = idx % 3 === 0 ? 'Premium' : 'Elite'
    const clientId = `c${idx}`

    clients.push({
      id: clientId,
      name,
      phone: `+91 ${String(90000 + ((idx * 617) % 9999)).slice(0, 5)} ${String(10000 + ((idx * 331) % 89999)).slice(0, 5)}`,
      email: `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@example.com`,
      pan: makePan(idx, name),
      package: pkg,
    })

    const rm = at(RMS, idx)
    const advisor = at(ADVISORS, idx)
    const created = daysAgo(bp.inStage + 8, 10, 5)
    const entered = daysAgo(bp.inStage, 12, 30)

    milestones.push({
      id: `m${idx}`,
      client_id: clientId,
      rm_id: rm.id,
      advisor_id: advisor.id,
      package: pkg,
      stage: bp.stage,
      status: bp.status,
      dropped_at_stage: bp.droppedAt ?? null,
      drop_reason: bp.reason ?? null,
      drop_note: bp.reason === 'Unreachable / no-show ×N' ? null : null,
      noshow_count: bp.noshow ?? 0,
      mom_logged: bp.mom ?? false,
      mom_text: bp.mom ? 'Discussed goals, risk appetite and horizon. Client comfortable with equity-tilted allocation.' : null,
      tx_status: bp.tx ?? null,
      stage_entered_at: entered,
      created_at: created,
      last_activity_at: entered,
    })

    const push = (event: string, actorId: string, actorRole: HistoryEntry['actor_role'], when: string) => {
      history.push({
        id: `h${++hid}`, milestone_id: `m${idx}`, event,
        from_stage: null, to_stage: null, from_status: null, to_status: null,
        actor_id: actorId, actor_role: actorRole, at: when,
      })
    }
    push(`Milestone created · ${pkg} activated`, 'system', 'System', created)
    push(`Entered ${bp.status}`, rm.id, 'RM', entered)
  })

  return { clients, milestones, history }
}
