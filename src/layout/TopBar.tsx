import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useStore } from '../domain/store'
import { ADMIN, ADVISORS, RMS } from '../domain/seed'
import type { Role } from '../domain/types'

const NAV = ['Dashboard', 'Users', 'Chat', 'Tasks', 'Sales'] as const

/** Role switcher mirrors the existing CMS role dropdown — a prototype device,
 *  per the handoff's "Interactions & Behaviour". */
const ROLES: { role: Role; actorId: string; label: string }[] = [
  { role: 'RM', actorId: (RMS[0] as { id: string }).id, label: 'RM' },
  { role: 'WEALTH_ADVISOR', actorId: (ADVISORS[0] as { id: string }).id, label: 'WEALTH_ADVISOR' },
  { role: 'WEALTH_ADMIN', actorId: ADMIN.id, label: 'WEALTH_ADMIN' },
  { role: 'SALES_EXEC', actorId: (RMS[0] as { id: string }).id, label: 'SALES_EXECUTIVE' },
  { role: 'SALES_ADMIN', actorId: ADMIN.id, label: 'SALES_ADMIN' },
]

const SALES_PATHS = ['/sales/referrals', '/sales/assisted', '/sales/changes']
const USER_PATHS = ['/sales/super-saver', '/sales/permissions']

interface Item { label: string; to: string }

/** A nav entry that opens a menu. Closes on outside click and on choosing. */
function Menu({ label, items, active }: { label: string; items: Item[]; active: boolean }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [open])

  return (
    <span className="menu-wrap" onClick={(e) => e.stopPropagation()}>
      <span className={active ? 'on' : ''} onClick={() => setOpen(!open)}>
        {label} <span className="caret">▾</span>
      </span>
      {open ? (
        <div className="navmenu" role="menu">
          {items.map((it) => (
            <button
              key={it.to}
              className={`navmenu-item ${pathname === it.to ? 'on' : ''}`}
              role="menuitem"
              onClick={() => { setOpen(false); navigate(it.to) }}
            >
              {it.label}
            </button>
          ))}
        </div>
      ) : null}
    </span>
  )
}

export function TopBar() {
  const { state, dispatch } = useStore()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const sales = state.role === 'SALES_EXEC' || state.role === 'SALES_ADMIN'
  const salesAdmin = state.role === 'SALES_ADMIN'
  const on = pathname.startsWith('/clients') ? 'Users' : 'Dashboard'

  const salesItems: Item[] = [
    { label: 'Referrals', to: '/sales/referrals' },
    { label: 'Assisted sales', to: '/sales/assisted' },
    { label: 'Change request', to: '/sales/changes' },
  ]

  const userItems: Item[] = [
    { label: 'Super Saver users', to: '/sales/super-saver' },
    { label: 'Users & permissions', to: '/sales/permissions' },
  ]

  return (
    <div className="top">
      <div className="logo">PROSPERR</div>
      <div className="nav">
        {sales ? (
          <>
            {salesAdmin ? (
              <Menu label="Users" items={userItems} active={USER_PATHS.includes(pathname)} />
            ) : (
              <span className={pathname === '/sales/users' ? 'on' : ''} onClick={() => navigate('/sales/users')}>Users</span>
            )}
            <Menu label="Sales" items={salesItems} active={SALES_PATHS.includes(pathname)} />
          </>
        ) : (
          NAV.map((n) => (
            <span
              key={n}
              className={n === on ? 'on' : ''}
              onClick={() => {
                if (n === 'Dashboard') navigate('/')
                if (n === 'Users') navigate('/clients')
              }}
            >
              {n}
            </span>
          ))
        )}
      </div>
      <span className="spacer" />
      <div className="tsel">F.Y. 2026-27</div>
      <select
        className="tsel role"
        value={state.role}
        onChange={(e) => {
          const role = e.target.value as Role
          const opt = ROLES.find((r) => r.role === role)
          if (opt) dispatch({ type: 'setRole', role, actorId: opt.actorId })
          navigate(role === 'SALES_EXEC' || role === 'SALES_ADMIN' ? '/sales/referrals' : '/')
        }}
      >
        {ROLES.map((r) => (
          <option key={r.role} value={r.role}>{r.label}  NEW</option>
        ))}
      </select>
    </div>
  )
}
