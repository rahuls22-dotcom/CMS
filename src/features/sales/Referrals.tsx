import { useMemo, useState } from 'react'
import { useStore } from '../../domain/store'
import {
  REFERRAL_STATUS, SALES_EXEC, optionsOf,
  type Referral,
} from '../../domain/sales'

/** Referrals: the same table for both sales roles. The admin also sees the
 *  payout column — a button there only records that the BDA or the tax RM has
 *  been paid, it does not send the money. */
export function Referrals() {
  const { state, dispatch, toast } = useStore()
  const admin = state.role === 'SALES_ADMIN'

  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [sold, setSold] = useState<'all' | 'sold' | 'not'>('all')
  const [status, setStatus] = useState('all')
  const [bda, setBda] = useState('all')
  const [rm, setRm] = useState('all')

  /** An executive sees the referrals under their own BDA. */
  const scope = useMemo(
    () => (admin ? state.referrals : state.referrals.filter((r) => r.bda === SALES_EXEC.bda)),
    [state.referrals, admin],
  )

  const rows = useMemo(() => {
    const needle = q.toLowerCase().trim()
    return scope.filter((r) =>
      (!needle
        || r.friend.toLowerCase().includes(needle)
        || r.mobile.toLowerCase().includes(needle)
        || r.referrer.toLowerCase().includes(needle)
        || r.code.toLowerCase().includes(needle))
      && (sold === 'all' || (sold === 'sold' ? r.sold : !r.sold))
      && (status === 'all' || r.status === status)
      && (bda === 'all' || r.bda === bda)
      && (rm === 'all' || r.rm === rm))
  }, [scope, q, sold, status, bda, rm])

  const soldCount = rows.filter((r) => r.sold).length
  const filtered = sold !== 'all' || status !== 'all' || bda !== 'all' || rm !== 'all' || !!q

  const clear = () => {
    setQ(''); setSold('all'); setStatus('all'); setBda('all'); setRm('all')
  }

  return (
    <div className="page">
      <div className="row gap12" style={{ marginBottom: 12, flexWrap: 'wrap' }}>
        <h2 className="h2">Referrals</h2>
        <span className="spacer" />
        <button className="btn pri" onClick={() => setOpen(true)}>+ Referral</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="row gap8" style={{ padding: '11px 12px', borderBottom: '1px solid var(--divider)', flexWrap: 'wrap' }}>
          <select className="select" value={sold} onChange={(e) => setSold(e.target.value as typeof sold)}>
            <option value="all">Sold: all</option>
            <option value="sold">Sold: yes</option>
            <option value="not">Sold: no</option>
          </select>
          <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">Status: all</option>
            {Object.entries(REFERRAL_STATUS).map(([k, v]) => (
              <option key={k} value={k}>Status: {v.label}</option>
            ))}
          </select>
          <select className="select" value={bda} onChange={(e) => setBda(e.target.value)}>
            <option value="all">BDA: all</option>
            {optionsOf(scope, (r) => r.bda).map((v) => <option key={v} value={v}>BDA: {v}</option>)}
          </select>
          <select className="select" value={rm} onChange={(e) => setRm(e.target.value)}>
            <option value="all">Tax RM: all</option>
            {optionsOf(scope, (r) => r.rm).map((v) => <option key={v} value={v}>Tax RM: {v}</option>)}
          </select>
          {filtered ? <button className="btn" onClick={clear}>Clear</button> : null}
          <span className="spacer" />
          <input
            className="input" style={{ minWidth: 240 }}
            placeholder="Search friend, mobile or referrer"
            value={q} onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Friend</th><th>Mobile</th><th>Referrer</th><th>Status</th>
                <th>BDA</th><th>Tax RM</th><th>Date</th><th>Sold</th>
                {admin ? <th>Payout</th> : null}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td><b>{r.friend}</b></td>
                  <td>{r.mobile}</td>
                  <td>
                    {r.referrer}
                    <div className="muted" style={{ fontSize: 11 }}>{r.code}</div>
                  </td>
                  <td><span className={`tag ${REFERRAL_STATUS[r.status].tone}`}>{REFERRAL_STATUS[r.status].label}</span></td>
                  <td>{r.bda}</td>
                  <td>{r.rm}</td>
                  <td className="muted">{r.at}</td>
                  <td>{r.sold ? <b style={{ color: 'var(--tag-green-fg)' }}>Sold</b> : <span className="muted">Not sold</span>}</td>
                  {admin ? <td><Payout r={r} onPay={(who) => {
                    dispatch({ type: 'markPaid', referralId: r.id, who })
                    toast(`Recorded: ${who === 'bda' ? `${r.bda} (BDA)` : `${r.rm} (tax RM)`} paid`)
                  }} /></td> : null}
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr><td colSpan={admin ? 9 : 8}><div className="muted" style={{ padding: 20, textAlign: 'center' }}>No referrals match</div></td></tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="row gap12" style={{ padding: '10px 14px', borderTop: '1px solid var(--divider)' }}>
          <span className="muted">Showing <b>{rows.length}</b> of {scope.length} referrals · {soldCount} sold</span>
        </div>
      </div>

      {open ? <LogReferralDrawer onClose={() => setOpen(false)} /> : null}
    </div>
  )
}

function Payout({ r, onPay }: { r: Referral; onPay: (who: 'bda' | 'rm') => void }) {
  if (!r.sold) return <span className="muted">—</span>
  return (
    <span className="row gap6">
      <button className={r.bda_paid ? 'btn' : 'btn pri'} disabled={r.bda_paid} onClick={() => onPay('bda')}>
        {r.bda_paid ? 'BDA paid' : 'Mark BDA paid'}
      </button>
      <button className={r.rm_paid ? 'btn' : 'btn pri'} disabled={r.rm_paid} onClick={() => onPay('rm')}>
        {r.rm_paid ? 'RM paid' : 'Mark RM paid'}
      </button>
    </span>
  )
}

/** Opens from the right, like the client page's rail panels. */
function LogReferralDrawer({ onClose }: { onClose: () => void }) {
  const { state, dispatch, toast } = useStore()
  const [code, setCode] = useState('')
  const [friend, setFriend] = useState('')
  const [mobile, setMobile] = useState('')

  const src = state.referrals.find((r) => r.code.toUpperCase() === code.trim().toUpperCase())
  const ready = code.trim() !== '' && friend.trim() !== '' && /^\d{10}$/.test(mobile.trim())

  return (
    <div className="overlay drawer-overlay" onClick={onClose} role="presentation">
      <div className="drawer" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Log referral">
        <div className="drawer-head">
          <b>Log referral</b>
          <span className="spacer" />
          <button className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="drawer-body">
          <p className="muted" style={{ marginTop: 0 }}>
            Enter the customer's referral code and the friend's name and mobile. The friend's
            BDA and tax RM are copied from that customer — you do not choose them.
          </p>

          <label className="fld">Referral code
            <input className="input" placeholder="Customer referral code" value={code} onChange={(e) => setCode(e.target.value)} />
          </label>
          <label className="fld">Friend's name
            <input className="input" placeholder="Name" value={friend} onChange={(e) => setFriend(e.target.value)} />
          </label>
          <label className="fld">Friend's mobile
            <input className="input" placeholder="10-digit mobile" inputMode="numeric" value={mobile} onChange={(e) => setMobile(e.target.value)} />
          </label>

          <div className="muted" style={{ minHeight: 18 }}>
            {code.trim() && src ? (
              <>Referred by <b>{src.referrer}</b> · BDA <b>{src.bda}</b> · tax RM <b>{src.rm}</b></>
            ) : code.trim() ? (
              <span style={{ color: 'var(--tag-amber-fg)' }}>
                No customer found for that code — the friend will be logged without a BDA.
              </span>
            ) : null}
          </div>
        </div>

        <div className="drawer-foot">
          <span className="spacer" />
          <button className="btn" onClick={onClose}>Cancel</button>
          <button
            className="btn pri" disabled={!ready}
            onClick={() => {
              dispatch({ type: 'logReferral', friend, mobile, code })
              toast('Referral logged · invite sent to the friend')
              onClose()
            }}
          >
            Log referral
          </button>
        </div>
      </div>
    </div>
  )
}
