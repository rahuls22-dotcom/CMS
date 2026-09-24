/** Entities mirror the handoff's "State Management / Data" section so this model
 *  can be lifted into the real CMS data layer with minimal translation. */

export type StageId = 1 | 2 | 3 | 4 | 5
export type Role = 'RM' | 'WEALTH_ADVISOR' | 'WEALTH_ADMIN'
export type PackageName = 'Elite' | 'Premium'

export type S1Status = 'New' | 'Contacted' | 'Interested'
export type S2Status = 'Awaiting docs' | 'Schedule meeting'
export type S3Status = 'Scheduled' | 'Rescheduled' | 'No-show' | 'Completed' | 'Skipped'
export type S4Status = 'KYC pending' | '1st session scheduled' | 'Converted' | 'Not converted'
export type TxStatus = 'With us' | 'Both' | 'With others' | 'Not transacting'

export type Status = S1Status | S2Status | S3Status | S4Status | 'Dropped'

export type DropReason =
  | 'Not interested'
  | 'Already has advisor'
  | 'Low investable surplus'
  | 'Unreachable / no-show ×N'
  | 'Pricing / fees'
  | 'Trust / privacy concern'
  | 'Timing — later'
  | 'Other'

export interface Person {
  id: string
  name: string
  role: Role
}

export interface Client {
  id: string
  name: string
  phone: string
  email: string
  pan: string
  package: PackageName
}

/** One milestone per client (R1 — re-activation must not duplicate). */
export interface Milestone {
  id: string
  client_id: string
  rm_id: string
  advisor_id: string
  package: PackageName
  stage: StageId
  status: Status
  dropped_at_stage: StageId | null
  drop_reason: DropReason | null
  drop_note: string | null
  noshow_count: number
  mom_logged: boolean
  mom_text: string | null
  tx_status: TxStatus | null
  stage_entered_at: string
  created_at: string
  last_activity_at: string
}

export interface HistoryEntry {
  id: string
  milestone_id: string
  event: string
  from_stage: StageId | null
  to_stage: StageId | null
  from_status: Status | null
  to_status: Status | null
  actor_id: string
  actor_role: Role | 'System'
  at: string
}

export type FlagKind = 'Dropped' | 'Converted' | 'MoM pending' | 'No-show' | 'Stuck'

export interface Flag {
  kind: FlagKind
  label: string
  tone: 'red' | 'amber' | 'green'
}

/** Red = RM action needed, amber = waiting, none = closed or nothing due. */
export type RowTint = 'red' | 'amber' | null
