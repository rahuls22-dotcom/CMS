import { createContext, useContext } from 'react'
import type {
  Client, DropReason, HistoryEntry, Milestone, Role, StageId, Status, TxStatus,
} from './types'
import { isClosed } from './funnel'

export interface Actor { id: string; name: string; role: Role }

export interface AppState {
  clients: Client[]
  milestones: Milestone[]
  history: HistoryEntry[]
  role: Role
  actorId: string
}

export type Action =
  | { type: 'setRole'; role: Role; actorId: string }
  | { type: 'setStatus'; milestoneId: string; status: Status; momText?: string; when?: SlotInput }
  | { type: 'scheduleCall'; milestoneId: string; when: SlotInput; advisorId: string; reschedule: boolean }
  | { type: 'firstMessage'; milestoneId: string }
  | { type: 'addMoM'; milestoneId: string; text: string }
  | { type: 'drop'; milestoneId: string; reason: DropReason; note?: string; noshowCount?: number }
  | { type: 'setTxStatus'; milestoneId: string; tx: TxStatus }

export interface SlotInput { date: string; start: string; end: string }

let hSeq = 10_000
const nextHistoryId = () => `h${++hSeq}`

/** Every mutation goes through here so R3's "timestamped with actor" holds
 *  without each caller remembering to log. */
function logEntry(
  m: Milestone, event: string, actor: Actor,
  from: { stage: StageId; status: Status },
): HistoryEntry {
  return {
    id: nextHistoryId(),
    milestone_id: m.id,
    event,
    from_stage: from.stage,
    to_stage: m.stage,
    from_status: from.status,
    to_status: m.status,
    actor_id: actor.id,
    actor_role: actor.role,
    at: new Date().toISOString(),
  }
}

const actorLabel = (a: Actor) =>
  a.role === 'WEALTH_ADVISOR' ? `${a.name} (Advisor)`
  : a.role === 'RM' ? `${a.name} (RM)`
  : `${a.name} (Admin)`

function enterStage(m: Milestone, stage: StageId, status: Status): void {
  m.stage = stage
  m.status = status
  m.stage_entered_at = new Date().toISOString()
}

export function reducer(state: AppState, action: Action): AppState {
  if (action.type === 'setRole') {
    return { ...state, role: action.role, actorId: action.actorId }
  }

  const idx = state.milestones.findIndex((x) => x.id === action.milestoneId)
  if (idx === -1) return state

  const prev = state.milestones[idx] as Milestone
  const m: Milestone = { ...prev }
  const from = { stage: prev.stage, status: prev.status }
  const actor: Actor = {
    id: state.actorId,
    name: ACTOR_NAMES[state.actorId] ?? 'Unknown',
    role: state.role,
  }
  const entries: HistoryEntry[] = []
  const add = (event: string) => entries.push(logEntry(m, event, actor, from))

  /** R5 — nothing mutates a closed milestone. */
  if (isClosed(prev) && action.type !== 'setTxStatus') return state

  switch (action.type) {
    case 'setStatus': {
      if (action.status === prev.status) return state
      m.status = action.status

      if (prev.stage === 1 && action.status === 'Interested') {
        enterStage(m, 2, 'Awaiting docs')
        add(`Interest shown · advanced to Intent`)
        break
      }
      if (prev.stage === 3) {
        if (action.status === 'No-show') {
          m.noshow_count = prev.noshow_count + 1
          add(`Wealth call marked No-show ×${m.noshow_count}`)
          break
        }
        if (action.status === 'Completed') {
          if (action.momText && action.momText.trim()) {
            m.mom_logged = true
            m.mom_text = action.momText.trim()
            enterStage(m, 4, 'KYC pending')
            add('Wealth call completed + MoM logged · moved to Onboarding')
          } else {
            /** R7 — stays in Wealth call, flagged MoM pending. */
            m.mom_logged = false
            add('Wealth call completed · MoM pending')
          }
          break
        }
        if (action.status === 'Skipped') {
          /** PRD Q11 assumption — Skipped moves on to Onboarding. */
          enterStage(m, 4, 'KYC pending')
          add('Wealth call skipped · moved to Onboarding')
          break
        }
        if (action.status === 'Scheduled' || action.status === 'Rescheduled') {
          add(`Wealth call ${action.status.toLowerCase()}${action.when ? ` · ${action.when.date} ${action.when.start}–${action.when.end}` : ''}`)
          break
        }
      }
      if (prev.stage === 4 && action.status === 'Converted') {
        m.status = 'Converted'
        add('Converted · 1st wealth session completed')
        break
      }
      add(`Status changed to ${action.status}`)
      break
    }

    case 'firstMessage': {
      if (prev.stage !== 1) return state
      enterStage(m, 2, 'Awaiting docs')
      add('RM started wealth conversation')
      break
    }

    case 'scheduleCall': {
      m.advisor_id = action.advisorId
      if (prev.stage === 1) {
        enterStage(m, 3, 'Scheduled')
        add('Skipped Intent · meeting booked directly')
      } else {
        enterStage(m, 3, action.reschedule ? 'Rescheduled' : 'Scheduled')
        add(`Wealth call ${action.reschedule ? 'rescheduled' : 'booked'} · ${action.when.date} ${action.when.start}–${action.when.end}`)
      }
      break
    }

    case 'addMoM': {
      if (!action.text.trim()) return state
      m.mom_logged = true
      m.mom_text = action.text.trim()
      enterStage(m, 4, 'KYC pending')
      add('MoM logged · Wealth call closed, moved to Onboarding / KYC pending')
      break
    }

    case 'drop': {
      /** R4 — allowed from stages 1–4 only; the client keeps the stage it dropped at. */
      if (prev.stage === 5) return state
      m.dropped_at_stage = prev.stage
      m.drop_reason = action.reason
      m.drop_note = action.note?.trim() || null
      if (action.noshowCount != null) m.noshow_count = action.noshowCount
      m.status = 'Dropped'
      add(`Dropped at ${from.stage} · ${action.reason}`)
      break
    }

    case 'setTxStatus': {
      m.tx_status = action.tx
      add(`Transaction status · ${action.tx}`)
      break
    }
  }

  m.last_activity_at = new Date().toISOString()
  const milestones = [...state.milestones]
  milestones[idx] = m
  return { ...state, milestones, history: [...state.history, ...entries] }
}

export const ACTOR_NAMES: Record<string, string> = {}
export { actorLabel }

export interface StoreValue {
  state: AppState
  dispatch: (a: Action) => void
  toast: (msg: string) => void
}

export const StoreContext = createContext<StoreValue | null>(null)

export function useStore(): StoreValue {
  const v = useContext(StoreContext)
  if (!v) throw new Error('useStore must be used inside <StoreProvider>')
  return v
}
