import { useMemo, useReducer } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useToasts } from './components/ui'
import { ClientList } from './features/clientList/ClientList'
import { Dashboard } from './features/dashboard/Dashboard'
import { ClientPage } from './features/clientPage/ClientPage'
import { TopBar } from './layout/TopBar'
import { ACTOR_NAMES, StoreContext, reducer, type AppState } from './domain/store'
import { ALL_PEOPLE, RMS, buildSeed } from './domain/seed'

for (const p of ALL_PEOPLE) ACTOR_NAMES[p.id] = p.name
ACTOR_NAMES['system'] = 'System'

function initialState(): AppState {
  const { clients, milestones, history } = buildSeed()
  return {
    clients, milestones, history,
    role: 'RM',
    actorId: (RMS[0] as { id: string }).id,
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState)
  const { toast, host } = useToasts()
  const value = useMemo(() => ({ state, dispatch, toast }), [state])

  return (
    <StoreContext.Provider value={value}>
      <TopBar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/clients" element={<ClientList />} />
        <Route path="/clients/:id" element={<ClientPage />} />
        <Route path="*" element={<Navigate to="/clients" replace />} />
      </Routes>
      {host}
    </StoreContext.Provider>
  )
}
