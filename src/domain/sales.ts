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
    r('r9', 'Arjun Pillai', '+91-9870012345', 'PRSP-ASDF', 'Aarav Shah', 'SIGNED_UP', 'Kabir Sethi', 'Leena Mathur', '25 Sept 2026, 9:12 am', true, false, false),
    r('r10', 'Diya Mathur', '+91-9833012456', 'PRSP-KMR9', 'Kunal Rao', 'INVITED', 'Kabir Sethi', 'Leena Mathur', '25 Sept 2026, 8:05 am', false, false, false),
    r('r11', 'Sameer Chawla', '+91-9812200334', 'PRSP-LSKF', 'Dev Patel', 'SIGNED_UP', 'Nidhi Arora', 'Anand Krishnan', '24 Sept 2026, 7:40 pm', true, true, true),
    r('r12', 'Tanvi Kulkarni', '+91-9820011223', 'PRSP-TEST', 'Isha Gupta', 'INVITED', 'Nidhi Arora', 'Divya Pillai', '24 Sept 2026, 11:15 am', false, false, false),
    r('r13', 'Nikhil Das', '+91-9845001122', 'PRSP-RB22', 'Ritika Bose', 'USER_ALREADY_EXISTS', '—', '—', '23 Sept 2026, 5:50 pm', false, false, false),
    r('r14', 'Riya Sen', '+91-9811900022', 'PRSP-ASDF', 'Aarav Shah', 'SIGNED_UP', 'Kabir Sethi', 'Leena Mathur', '23 Sept 2026, 10:30 am', true, true, false),
    r('r15', 'Aman Gill', '+91-9876600110', 'PRSP-KMR9', 'Kunal Rao', 'INVITED', 'Kabir Sethi', 'Leena Mathur', '22 Sept 2026, 4:05 pm', false, false, false),
    r('r16', 'Megha Jain', '+91-9903300221', 'PRSP-LSKF', 'Dev Patel', 'SIGNED_UP', 'Nidhi Arora', 'Anand Krishnan', '22 Sept 2026, 9:55 am', false, false, false),
    r('r17', 'Rakesh Pai', '+91-9844112233', 'PRSP-TEST', 'Isha Gupta', 'INVITED', 'Nidhi Arora', 'Divya Pillai', '21 Sept 2026, 6:20 pm', false, false, false),
    r('r18', 'Shreya Nair', '+91-9867001199', 'PRSP-ASDF', 'Aarav Shah', 'SIGNED_UP', 'Kabir Sethi', 'Leena Mathur', '21 Sept 2026, 12:00 pm', true, false, false),
    r('r19', 'Omkar Patil', '+91-9820330011', 'PRSP-RB22', 'Ritika Bose', 'INVITED', 'Vikas Menon', 'Anand Krishnan', '20 Sept 2026, 3:45 pm', false, false, false),
    r('r20', 'Fatima Sheikh', '+91-9811220044', 'PRSP-KMR9', 'Kunal Rao', 'SIGNED_UP', 'Kabir Sethi', 'Leena Mathur', '20 Sept 2026, 10:10 am', true, true, true),
    r('r21', 'Varun Kapoor', '+91-9890011445', 'PRSP-LSKF', 'Dev Patel', 'INVITED', 'Nidhi Arora', 'Anand Krishnan', '19 Sept 2026, 7:25 pm', false, false, false),
    r('r22', 'Ira Menon', '+91-9876004455', 'PRSP-TEST', 'Isha Gupta', 'USER_ALREADY_EXISTS', '—', '—', '19 Sept 2026, 11:35 am', false, false, false),
    r('r23', 'Gaurav Bhatt', '+91-9833440077', 'PRSP-ASDF', 'Aarav Shah', 'INVITED', 'Kabir Sethi', 'Leena Mathur', '18 Sept 2026, 2:15 pm', false, false, false),
    r('r24', 'Rhea Dutta', '+91-9812007733', 'PRSP-RB22', 'Ritika Bose', 'SIGNED_UP', 'Vikas Menon', 'Anand Krishnan', '18 Sept 2026, 9:05 am', true, false, false),
    r('r25', 'Kiran Shetty', '+91-9845667788', 'PRSP-KMR9', 'Kunal Rao', 'INVITED', 'Kabir Sethi', 'Leena Mathur', '17 Sept 2026, 5:30 pm', false, false, false),
    r('r26', 'Naina Kohli', '+91-9820556677', 'PRSP-LSKF', 'Dev Patel', 'SIGNED_UP', 'Nidhi Arora', 'Anand Krishnan', '17 Sept 2026, 10:45 am', false, false, false),
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
