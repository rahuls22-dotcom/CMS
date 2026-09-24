import { useStore } from '../domain/store'
import { ADMIN, ADVISORS, RMS } from '../domain/seed'
import type { Role } from '../domain/types'

/** Role switcher mirrors the existing CMS role dropdown — a prototype device,
 *  per the handoff's "Interactions & Behaviour". */
const OPTIONS: { role: Role; actorId: string; label: string }[] = [
  { role: 'RM', actorId: (RMS[0] as { id: string }).id, label: `RM · ${(RMS[0] as { name: string }).name}` },
  { role: 'WEALTH_ADVISOR', actorId: (ADVISORS[0] as { id: string }).id, label: `Advisor · ${(ADVISORS[0] as { name: string }).name}` },
  { role: 'WEALTH_ADMIN', actorId: ADMIN.id, label: `Admin · ${ADMIN.name}` },
]

export function TopBar() {
  const { state, dispatch } = useStore()
  const value = `${state.role}|${state.actorId}`
  return (
    <div className="topbar">
      <span className="brand">Prosperr CMS</span>
      <span className="muted" style={{ color: 'rgba(255,255,255,.75)', fontSize: 12 }}>
        Wealth Onboarding
      </span>
      <span className="spacer" />
      <select
        value={value}
        onChange={(e) => {
          const [role, actorId] = e.target.value.split('|') as [Role, string]
          dispatch({ type: 'setRole', role, actorId })
        }}
      >
        {OPTIONS.map((o) => (
          <option key={o.role} value={`${o.role}|${o.actorId}`}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}
