import { Outlet, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import SearchModal from './components/SearchModal'
import AgentFab from './components/AgentFab'
import AgentDrawer from './components/AgentDrawer'
import { agentChat, agentBookings, agentPlan } from './api'
import { useAuth } from './store'
import './index.css'

export default function App(){
  // ---------- Search (existing) ----------
  const [openSearch, setOpenSearch] = useState(false)
  const navigate = useNavigate()
  const me    = useAuth(s => s.me)     // action to fetch session
  const user  = useAuth(s => s.user)   // current user object (if any)
  const isLoggedIn = !!user?.id

  useEffect(()=>{ me?.().catch(()=>{}) },[])

  function handleSearch(params){
    setOpenSearch(false)
    const q = new URLSearchParams(params).toString()
    navigate(`/search?${q}`)
  }

  // ---------- Agent state ----------
  // modes: 'idle' | 'anon' | 'loading' | 'choose' | 'plan'
  const [agentOpen, setAgentOpen] = useState(false)
  const [mode, setMode]           = useState('idle')
  const [bookings, setBookings]   = useState([])
  const [selected, setSelected]   = useState(null)
  const [ask, setAsk]             = useState('')
  const [prefs, setPrefs]         = useState({ budget: '$$', interests: [], mobility: 'none', diet: '' })
  const [resp, setResp]           = useState(null)
  const [error, setError]         = useState('')
  const [busy, setBusy]           = useState(false)

  async function openAgent(){
    setAgentOpen(true)
    setResp(null); setError(''); setAsk(''); setSelected(null)
    if (isLoggedIn) {
      setMode('loading')
      try {
        const { bookings } = await agentBookings()
        setBookings(bookings || [])
        setMode('choose')
      } catch (e) {
        setError('Could not load your bookings. You can still ask general questions.')
        setMode('anon')
      }
    } else {
      setMode('anon')
    }
  }

  async function submitAnon(e){
    e?.preventDefault?.()
    if (!ask.trim()) return
    setBusy(true); setError(''); setResp(null)
    try {
      const { answer } = await agentChat(ask)
      setResp(answer)
    } catch (e) {
      setError('Agent chat failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function submitPlan(e){
    e?.preventDefault?.()
    if (!selected) return
    setBusy(true); setError(''); setResp(null)
    try {
      const payload = {
        booking: {
          id: selected.id,
          location: selected.location,
          start: selected.start,
          end: selected.end,
          partyType: 'family',
          guests: selected.guests || 2
        },
        preferences: {
          budget: prefs.budget || '$$',
          interests: prefs.interests || [],
          mobility: prefs.mobility || 'none',
          diet: prefs.diet || null
        },
        ask: ask || ''
      }
      const data = await agentPlan(payload)
      setResp(data)
      setMode('plan')
    } catch (e) {
      setError('Could not generate plan. Please try again.')
      setMode('choose')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F3EE] text-black">
      <Navbar onOpenSearch={()=>setOpenSearch(true)} />

      <SearchModal
        open={openSearch}
        onClose={()=>setOpenSearch(false)}
        onSearch={handleSearch}
      />

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />

      {/* AI Agent Trigger */}
      <AgentFab onClick={openAgent} />

      {/* AI Agent Drawer */}
      <AgentDrawer open={agentOpen} onClose={()=>setAgentOpen(false)}>
        {/* Anonymous mode */}
        {mode === 'anon' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-700">
              Hi! I’m <b>TripMate</b>. I can help with trip planning.&nbsp;
              <span className="text-gray-600">Log in to fetch your bookings, or ask me general questions.</span>
            </p>

            <form onSubmit={submitAnon} className="space-y-2">
              <input
                className="w-full border rounded px-3 py-2"
                placeholder="e.g., Is July good for Lisbon?"
                value={ask}
                onChange={e=>setAsk(e.target.value)}
              />
              <button className="px-4 py-2 bg-black text-white rounded" disabled={busy}>
                {busy ? 'Thinking…' : 'Ask'}
              </button>
            </form>

            {resp && typeof resp === 'string' && (
              <div className="mt-2 whitespace-pre-wrap text-sm">{resp}</div>
            )}
            {error && <div className="text-red-600 text-sm">{error}</div>}
          </div>
        )}

        {/* Loading */}
        {mode === 'loading' && <div>Loading your bookings…</div>}

        {/* Choose booking (logged-in) */}
        {mode === 'choose' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-700">Choose one of your upcoming trips:</p>

            <ul className="space-y-2">
              {bookings.map(b => (
                <li key={b.id}>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="trip"
                      onChange={()=>setSelected(b)}
                    />
                    <span>{b.location} — {b.start} → {b.end} ({b.guests} guests)</span>
                  </label>
                </li>
              ))}
              {!bookings?.length && (
                <li className="text-sm text-gray-500">No upcoming trips found.</li>
              )}
            </ul>

            <div className="grid grid-cols-2 gap-2">
              <select
                className="border rounded px-2 py-1"
                value={prefs.budget}
                onChange={e=>setPrefs(p=>({...p, budget: e.target.value}))}
              >
                <option>$</option><option>$$</option><option>$$$</option><option>$$$$</option>
              </select>

              <select
                className="border rounded px-2 py-1"
                value={prefs.mobility}
                onChange={e=>setPrefs(p=>({...p, mobility: e.target.value}))}
              >
                <option value="none">mobility: none</option>
                <option value="wheelchair">mobility: wheelchair</option>
                <option value="limited">mobility: limited</option>
              </select>

              <input
                className="border rounded px-2 py-1 col-span-2"
                placeholder="interests (comma-separated)"
                onChange={e=>setPrefs(p=>({...p, interests: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)}))}/>
              <input
                className="border rounded px-2 py-1 col-span-2"
                placeholder="diet (vegan/halal/...)"
                onChange={e=>setPrefs(p=>({...p, diet: e.target.value || null}))}/>
            </div>

            <form onSubmit={submitPlan} className="space-y-2">
              <input
                className="w-full border rounded px-3 py-2"
                placeholder='Anything to add? e.g., "vegan, no long hikes, two kids"'
                value={ask}
                onChange={e=>setAsk(e.target.value)}
              />
              <button className="px-4 py-2 bg-black text-white rounded" disabled={!selected || busy}>
                {busy ? 'Planning…' : 'Generate plan'}
              </button>
            </form>

            {error && <div className="text-red-600 text-sm">{error}</div>}
          </div>
        )}

        {/* Plan view */}
        {mode === 'plan' && resp && typeof resp === 'object' && (
          <div className="space-y-4">
            <section>
              <h4 className="font-semibold mb-2">Packing</h4>
              <ul className="list-disc ml-5">
                {resp.packing?.map((p,i)=><li key={i}>{p}</li>)}
              </ul>
            </section>

            <section>
              <h4 className="font-semibold mb-2">Itinerary</h4>
              {resp.itinerary?.map((day) => (
                <div key={day.date} className="mb-3">
                  <div className="font-medium">{day.date}</div>
                  {['morning','afternoon','evening'].map(slot => (
                    <div key={slot} className="ml-3">
                      <div className="text-sm text-gray-600 capitalize">{slot}</div>
                      <ul className="list-disc ml-5">
                        {day[slot]?.map((c, idx) => (
                          <li key={idx}>
                            {c.title} {c.priceTier ? `(${c.priceTier})` : ''} {c.tags?.length ? `– ${c.tags.join(', ')}` : ''}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ))}
            </section>

            <section>
              <h4 className="font-semibold mb-2">Activities</h4>
              <ul className="list-disc ml-5">{resp.activities?.map((a,i)=><li key={i}>{a.title}</li>)}</ul>
            </section>

            <section>
              <h4 className="font-semibold mb-2">Restaurants</h4>
              <ul className="list-disc ml-5">{resp.restaurants?.map((r,i)=><li key={i}>{r.title}</li>)}</ul>
            </section>
          </div>
        )}
      </AgentDrawer>
    </div>
  )
}