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
]

export function TopBar() {
  const { state, dispatch } = useStore()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const on = pathname.startsWith('/clients') ? 'Users' : 'Dashboard'

  return (
    <div className="top">
      <div className="logo">PROSPERR</div>
      <div className="nav">
        {NAV.map((n) => (
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
        ))}
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
          navigate('/')
        }}
      >
        {ROLES.map((r) => (
          <option key={r.role} value={r.role}>{r.label}  NEW</option>
        ))}
      </select>
    </div>
  )
}
