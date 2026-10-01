/** Sales: referrals, the users behind them, assisted sales and change requests.
 *
 *  A customer refers a friend. The friend's BDA and tax RM are copied from the
 *  referring customer — they are never chosen on the form. "Sold" means the
 *  friend is on a paid plan; the payout buttons only record that someone has
 *  been paid, they do not move money. */

export type ReferralStatus = 'INVITED' | 'SIGNED_UP' | 'USER_ALREADY_EXISTS'
export type DecisionStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface Referral {
  id: string
  friend: string
  mobile: string
  code: string
  referrer: string
  status: ReferralStatus
  bda: string
  rm: string
  at: string
  sold: boolean
  bda_paid: boolean
  rm_paid: boolean
}

export interface SalesUser {
  id: string
  name: string
  mobile: string
  plan: 'Super Saver' | 'Premium' | 'Basic'
  bda: string
  rm: string
  since: string
  active: boolean
}

export interface AssistedSale {
  id: string
  client: string
  plan: string
  amount: string
  bda: string
  status: DecisionStatus
  at: string
}

export interface ChangeRequest {
  id: string
  client: string
  kind: string
  detail: string
  raised_by: string
  status: DecisionStatus
  at: string
}

export interface TeamMember {
  id: string
  name: string
  role: string
  scope: string
  active: boolean
}

export const REFERRAL_STATUS: Record<ReferralStatus, { label: string; tone: string }> = {
  INVITED: { label: 'Invited', tone: 'amber' },
  SIGNED_UP: { label: 'Signed up', tone: 'green' },
  USER_ALREADY_EXISTS: { label: 'Already a user', tone: '' },
}

export const DECISION_STATUS: Record<DecisionStatus, { label: string; tone: string }> = {
  PENDING: { label: 'Pending', tone: 'amber' },
  APPROVED: { label: 'Approved', tone: 'green' },
  REJECTED: { label: 'Rejected', tone: 'red' },
}

/** The signed-in sales executive. Their own list is scoped to this BDA. */
export const SALES_EXEC = { name: 'Rohit Sharma', bda: 'Kabir Sethi' }

export function seedReferrals(): Referral[] {
  return [
    r('r1', 'Zaid Ahmed', '+91-8898989123', 'PRSP-ASDF', 'Aarav Shah', 'SIGNED_UP', 'Kabir Sethi', 'Leena Mathur', '1 Oct 2026, 3:08 am', true, false, false),
    r('r2', 'Test User', '+91-8727272222', 'PRSP-ASDF', 'Aarav Shah', 'INVITED', 'Kabir Sethi', 'Leena Mathur', '1 Oct 2026, 12:42 pm', false, false, false),
    r('r3', 'Rahul Menon', '+91-9876500001', 'PRSP-LSKF', 'Dev Patel', 'INVITED', 'Nidhi Arora', 'Anand Krishnan', '30 Sept 2026, 12:05 am', false, false, false),
    r('r4', 'Sana Kapoor', '+91-9811122233', 'PRSP-TEST', 'Isha Gupta', 'SIGNED_UP', 'Nidhi Arora', 'Divya Pillai', '29 Sept 2026, 7:49 am', true, true, false),
    r('r5', 'Manav Joshi', '+91-9876543210', 'PRSP-TEST', 'Isha Gupta', 'USER_ALREADY_EXISTS', '—', '—', '29 Sept 2026, 7:49 am', false, false, false),
    r('r6', 'Pooja Hegde', '+91-9900011122', 'PRSP-KMR9', 'Kunal Rao', 'SIGNED_UP', 'Kabir Sethi', 'Leena Mathur', '28 Sept 2026, 6:20 pm', true, true, true),
    r('r7', 'Harsh Vora', '+91-9845566778', 'PRSP-KMR9', 'Kunal Rao', 'INVITED', 'Kabir Sethi', 'Leena Mathur', '27 Sept 2026, 11:02 am', false, false, false),
    r('r8', 'Neha Kulkarni', '+91-9123344556', 'PRSP-RB22', 'Ritika Bose', 'SIGNED_UP', 'Vikas Menon', 'Anand Krishnan', '26 Sept 2026, 4:35 pm', false, false, false),
  ]
}

function r(
  id: string, friend: string, mobile: string, code: string, referrer: string,
  status: ReferralStatus, bda: string, rm: string, at: string,
  sold: boolean, bda_paid: boolean, rm_paid: boolean,
): Referral {
  return { id, friend, mobile, code, referrer, status, bda, rm, at, sold, bda_paid, rm_paid }
}

export function seedSalesUsers(): SalesUser[] {
  return [
    { id: 'u1', name: 'Aarav Shah', mobile: '+91-9876512345', plan: 'Super Saver', bda: 'Kabir Sethi', rm: 'Leena Mathur', since: '12 Jul 2026', active: true },
    { id: 'u2', name: 'Isha Gupta', mobile: '+91-9811122233', plan: 'Premium', bda: 'Nidhi Arora', rm: 'Divya Pillai', since: '3 Aug 2026', active: true },
    { id: 'u3', name: 'Kunal Rao', mobile: '+91-9900011122', plan: 'Super Saver', bda: 'Kabir Sethi', rm: 'Leena Mathur', since: '21 Aug 2026', active: true },
    { id: 'u4', name: 'Dev Patel', mobile: '+91-9876500001', plan: 'Basic', bda: 'Nidhi Arora', rm: 'Anand Krishnan', since: '2 Sept 2026', active: false },
    { id: 'u5', name: 'Ritika Bose', mobile: '+91-9123344556', plan: 'Super Saver', bda: 'Vikas Menon', rm: 'Anand Krishnan', since: '9 Sept 2026', active: true },
    { id: 'u6', name: 'Zoya Khan', mobile: '+91-9845566778', plan: 'Premium', bda: 'Kabir Sethi', rm: 'Leena Mathur', since: '15 Sept 2026', active: true },
  ]
}

export function seedAssistedSales(): AssistedSale[] {
  return [
    { id: 'a1', client: 'Aarav Shah', plan: 'Super Saver', amount: '₹11,800', bda: 'Kabir Sethi', status: 'PENDING', at: '1 Oct 2026, 11:10 am' },
    { id: 'a2', client: 'Harsh Vora', plan: 'Premium', amount: '₹7,200', bda: 'Kabir Sethi', status: 'PENDING', at: '30 Sept 2026, 4:40 pm' },
    { id: 'a3', client: 'Ritika Bose', plan: 'Super Saver', amount: '₹11,800', bda: 'Vikas Menon', status: 'APPROVED', at: '29 Sept 2026, 10:02 am' },
    { id: 'a4', client: 'Dev Patel', plan: 'Basic', amount: '₹3,500', bda: 'Nidhi Arora', status: 'REJECTED', at: '27 Sept 2026, 6:15 pm' },
  ]
}

export function seedChangeRequests(): ChangeRequest[] {
  return [
    { id: 'c1', client: 'Isha Gupta', kind: 'Plan change', detail: 'Premium → Super Saver', raised_by: 'Kabir Sethi', status: 'PENDING', at: '1 Oct 2026, 9:30 am' },
    { id: 'c2', client: 'Kunal Rao', kind: 'Bank details', detail: 'New account for refunds', raised_by: 'Kabir Sethi', status: 'PENDING', at: '30 Sept 2026, 2:05 pm' },
    { id: 'c3', client: 'Zoya Khan', kind: 'Mobile number', detail: '+91-9845566778 → +91-9845500011', raised_by: 'Vikas Menon', status: 'APPROVED', at: '28 Sept 2026, 11:45 am' },
  ]
}

export function seedTeam(): TeamMember[] {
  return [
    { id: 't1', name: 'Rohit Sharma', role: 'Sales executive', scope: 'Own referrals and assisted sales', active: true },
    { id: 't2', name: 'Kabir Sethi', role: 'BDA', scope: 'Assigned customers', active: true },
    { id: 't3', name: 'Nidhi Arora', role: 'BDA', scope: 'Assigned customers', active: true },
    { id: 't4', name: 'Vikas Menon', role: 'BDA', scope: 'Assigned customers', active: false },
    { id: 't5', name: 'Leena Mathur', role: 'Tax RM', scope: 'Own clients and milestones', active: true },
    { id: 't6', name: 'Anjali Rao', role: 'Sales admin', scope: 'Everything in Sales and Users', active: true },
  ]
}

/** Unique, sorted values for a filter dropdown, ignoring the placeholder dash. */
export function optionsOf<T>(rows: T[], pick: (row: T) => string): string[] {
  return [...new Set(rows.map(pick))].filter((v) => v && v !== '—').sort()
}
