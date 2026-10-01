import type { ReactElement } from 'react'
import { useStore } from '../../domain/store'
import { DECISION_STATUS, SALES_EXEC, type DecisionStatus } from '../../domain/sales'
import { Pager, usePager } from './Pager'

/** Shared shell so every sales list reads the same: title, card, table, pager. */
function ListPage({
  title, head, rows, empty, cols, noun, pageKey,
}: {
  title: string
  head: React.ReactNode
  rows: ReactElement[]
  empty: string
  cols: number
  noun: string
  pageKey: string
}) {
  const pg = usePager(rows, pageKey)
  return (
    <div className="page tight">
      <div className="list-head"><h2 className="h2">{title}</h2></div>
      <div className="card" style={{ padding: 0 }}>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr>{head}</tr></thead>
            <tbody>
              {rows.length ? pg.slice : (
                <tr><td colSpan={cols}><div className="muted" style={{ padding: 20, textAlign: 'center' }}>{empty}</div></td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pager
          current={pg.current} pages={pg.pages} total={rows.length}
          from={pg.from} to={pg.to} noun={noun} onPage={pg.setPage}
        />
      </div>
    </div>
  )
}

function Decision({ status }: { status: DecisionStatus }) {
  const d = DECISION_STATUS[status]
  return <span className={`tag ${d.tone}`}>{d.label}</span>
}

/** Sales executive: the customers under their BDA.
 *  Sales admin: everyone, or only the Super Saver plan. */
export function SalesUsers({ superSaverOnly = false }: { superSaverOnly?: boolean }) {
  const { state } = useStore()
  const admin = state.role === 'SALES_ADMIN'
  const rows = admin
    ? state.salesUsers.filter((u) => !superSaverOnly || u.plan === 'Super Saver')
    : state.salesUsers.filter((u) => u.bda === SALES_EXEC.bda)

  return (
    <ListPage
      title={admin ? (superSaverOnly ? 'Super Saver users' : 'Users') : 'My users'}
      cols={7}
      noun="users"
      pageKey={`${admin}|${superSaverOnly}`}
      empty="No users yet"
      head={<>
        <th>Customer</th><th>Mobile</th><th>Plan</th><th>BDA</th><th>Tax RM</th><th>Customer since</th><th>Status</th>
      </>}
      rows={rows.map((u) => (
        <tr key={u.id}>
          <td><b>{u.name}</b></td>
          <td>{u.mobile}</td>
          <td><span className={`tag ${u.plan === 'Super Saver' ? 'green' : ''}`}>{u.plan}</span></td>
          <td>{u.bda}</td>
          <td>{u.rm}</td>
          <td className="muted">{u.since}</td>
          <td>{u.active ? <b style={{ color: 'var(--tag-green-fg)' }}>Active</b> : <span className="muted">Lapsed</span>}</td>
        </tr>
      ))}
    />
  )
}

/** Who is internal, and what each of them can see. */
export function Permissions() {
  const { state, toast } = useStore()
  return (
    <ListPage
      title="Users & permissions"
      cols={5}
      noun="people"
      pageKey="team"
      empty="No internal users"
      head={<><th>Name</th><th>Role</th><th>Can see</th><th>Status</th><th>Actions</th></>}
      rows={state.team.map((t) => (
        <tr key={t.id}>
          <td><b>{t.name}</b></td>
          <td>{t.role}</td>
          <td className="muted">{t.scope}</td>
          <td>{t.active ? <b style={{ color: 'var(--tag-green-fg)' }}>Active</b> : <span className="muted">Suspended</span>}</td>
          <td>
            <span className="row gap6">
              <button className="btn" onClick={() => toast(`Edit permissions for ${t.name} — placeholder UI`)}>Edit</button>
              <button className="btn" onClick={() => toast(`${t.active ? 'Suspended' : 'Restored'} ${t.name}`)}>
                {t.active ? 'Suspend' : 'Restore'}
              </button>
            </span>
          </td>
        </tr>
      ))}
    />
  )
}

/** Raised by a BDA, approved by the sales admin. */
export function AssistedSales() {
  const { state, dispatch, toast } = useStore()
  const admin = state.role === 'SALES_ADMIN'
  const rows = admin ? state.assistedSales : state.assistedSales.filter((a) => a.bda === SALES_EXEC.bda)

  return (
    <ListPage
      title="Assisted sales"
      cols={admin ? 7 : 6}
      noun="assisted sales"
      pageKey={`${admin}`}
      empty="Nothing to show"
      head={<>
        <th>Customer</th><th>Plan</th><th>Amount</th><th>BDA</th><th>Raised</th><th>Status</th>
        {admin ? <th>Decision</th> : null}
      </>}
      rows={rows.map((a) => (
        <tr key={a.id}>
          <td><b>{a.client}</b></td>
          <td>{a.plan}</td>
          <td>{a.amount}</td>
          <td>{a.bda}</td>
          <td className="muted">{a.at}</td>
          <td><Decision status={a.status} /></td>
          {admin ? (
            <td>
              {a.status === 'PENDING' ? (
                <span className="row gap6">
                  <button className="btn pri" onClick={() => {
                    dispatch({ type: 'decideAssistedSale', id: a.id, status: 'APPROVED' })
                    toast('Assisted sale approved')
                  }}>Approve</button>
                  <button className="btn" onClick={() => {
                    dispatch({ type: 'decideAssistedSale', id: a.id, status: 'REJECTED' })
                    toast('Assisted sale rejected')
                  }}>Reject</button>
                </span>
              ) : <span className="muted">—</span>}
            </td>
          ) : null}
        </tr>
      ))}
    />
  )
}

/** Plan, bank or contact changes raised against a customer. */
export function ChangeRequests() {
  const { state, dispatch, toast } = useStore()
  const admin = state.role === 'SALES_ADMIN'
  const rows = admin ? state.changeRequests : state.changeRequests.filter((c) => c.raised_by === SALES_EXEC.bda)

  return (
    <ListPage
      title="Change requests"
      cols={admin ? 7 : 6}
      noun="change requests"
      pageKey={`${admin}`}
      empty="No change requests"
      head={<>
        <th>Customer</th><th>Request</th><th>Detail</th><th>Raised by</th><th>Raised</th><th>Status</th>
        {admin ? <th>Decision</th> : null}
      </>}
      rows={rows.map((c) => (
        <tr key={c.id}>
          <td><b>{c.client}</b></td>
          <td>{c.kind}</td>
          <td className="muted">{c.detail}</td>
          <td>{c.raised_by}</td>
          <td className="muted">{c.at}</td>
          <td><Decision status={c.status} /></td>
          {admin ? (
            <td>
              {c.status === 'PENDING' ? (
                <span className="row gap6">
                  <button className="btn pri" onClick={() => {
                    dispatch({ type: 'decideChangeRequest', id: c.id, status: 'APPROVED' })
                    toast('Change request approved')
                  }}>Approve</button>
                  <button className="btn" onClick={() => {
                    dispatch({ type: 'decideChangeRequest', id: c.id, status: 'REJECTED' })
                    toast('Change request rejected')
                  }}>Reject</button>
                </span>
              ) : <span className="muted">—</span>}
            </td>
          ) : null}
        </tr>
      ))}
    />
  )
}
