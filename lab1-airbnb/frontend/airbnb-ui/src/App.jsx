// src/App.jsx
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
  const me    = useAuth(s => s.me)
  const user  = useAuth(s => s.user)
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

    // --- Map whatever your backend returns → the exact schema agent needs
    const toAgentBooking = (b) => {
      // dates come in many shapes: start, start_date, checkIn, check_in
      const startRaw =
        b.start || b.start_date || b.checkIn || b.check_in || b.checkin || ''
      const endRaw =
        b.end || b.end_date || b.checkOut || b.check_out || b.checkout || ''

      const normDate = (v) => (typeof v === 'string' ? v.slice(0,10) : '')

      // location fallback if your row has city/state/country fields
      const loc =
        b.location ||
        [b.city, b.state, b.country].filter(Boolean).join(', ') ||
        'Unknown'

      return {
        id: b.id,
        location: loc,
        start: normDate(startRaw),
        end: normDate(endRaw),
        partyType: b.partyType || 'family',
        guests: Number(b.guests || 2),
      }
    }

    try {
      const payload = {
        booking: toAgentBooking(selected),
        // We removed preferences from the UX; planner ignores them anyway
        ask: ask || ''
      }

      // quick client-side assert to catch missing fields before 422
      if (!payload.booking.location || !payload.booking.start || !payload.booking.end) {
        throw new Error('Missing required booking fields (location/start/end).')
      }

      console.log('[agentPlan] payload →', payload)
      const data = await agentPlan(payload)
      setResp(data)
      setMode('plan')
    } catch (e) {
      console.error('submitPlan error:', e)
      setError('Could not generate plan. Please check dates/location and try again.')
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

            {/* Single NLU textbox (Haiku extracts everything) */}
            <form onSubmit={submitPlan} className="space-y-2">
              <textarea
                rows={3}
                className="w-full border rounded px-3 py-2"
                placeholder={`Tell me what you need.\nExample: "We're on a $900 budget, vegan, wheelchair user, want beaches and easy walks for 2 kids"`}
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