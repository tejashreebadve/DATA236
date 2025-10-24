import { useState } from 'react';
import { agentApi } from '../api';

export default function AgentSidePanel({ open, onClose, bookingContext }) {
  const [loading,setLoading] = useState(false);
  const [data,setData] = useState(null);

  async function runAgent() {
    setLoading(true);
    const payload = {
      booking: bookingContext,
      preferences: { budget:"mid", interests:["museums"], mobility_needs:"kids", dietary:["vegan"] }
    };
    const { data } = await agentApi.post('/concierge', payload);
    setData(data); setLoading(false);
  }

  return (
    <aside
      className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white shadow-2xl transition-transform
        ${open ? 'translate-x-0':'translate-x-full'}`}
      aria-label="AI Concierge Panel"
    >
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-xl font-semibold">Concierge</h2>
        <button onClick={onClose} aria-label="Close panel">✕</button>
      </div>
      <div className="p-4 space-y-4 overflow-y-auto h-[calc(100%-64px)]">
        <button onClick={runAgent} className="bg-brand text-white px-4 py-2 rounded">
          {loading ? 'Thinking...' : 'Get Plan'}
        </button>

        {data && (
          <>
            <section>
              <h3 className="font-semibold mb-2">Day-by-day plan</h3>
              <ul className="list-disc ml-5">
                {data.plan.map(d => (
                  <li key={d.date}><strong>{d.date}</strong>: {d.morning} / {d.afternoon} / {d.evening}</li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="font-semibold mb-2">Activities</h3>
              <ul className="list-disc ml-5">
                {data.activity_cards.map((a,idx)=>(
                  <li key={idx}>{a.title} — {a.duration} — {a.price_tier} ({a.tags.join(', ')})</li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="font-semibold mb-2">Restaurants</h3>
              <ul className="list-disc ml-5">
                {data.restaurants.map((r,idx)=>(
                  <li key={idx}>{r.name} — {r.dietary.join(', ')} — {r.price_tier}</li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="font-semibold mb-2">Packing checklist</h3>
              <ul className="list-disc ml-5">
                {data.packing_checklist.map((p,idx)=>(<li key={idx}>{p}</li>))}
              </ul>
            </section>
          </>
        )}
      </div>
    </aside>
  );
}
