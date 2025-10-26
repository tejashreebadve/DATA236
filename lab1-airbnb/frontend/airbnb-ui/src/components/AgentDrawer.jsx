// src/components/AgentDrawer.jsx
import { useEffect, useMemo, useState } from "react";
import { agentBookings, agentPlan, agentChat } from "../api";

// Small inline spinner (no global CSS)
function Spinner() {
  return (
    <span className="inline-block h-4 w-4 animate-spin rounded-full border-[2.5px] border-white/30 border-t-white/80" />
  );
}

export default function AgentDrawer({ open, onClose }) {
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const [ask, setAsk] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [answer, setAnswer] = useState(null); // {type:"plan"|"chat", data:any}

  // fetch trips when drawer opens
  useEffect(() => {
    if (!open) return;
    setError("");
    setAnswer(null);
    setLoadingTrips(true);
    agentBookings()
      .then((res) => {
        const items = res?.bookings || [];
        setBookings(items);
        setSelectedId(items?.[0]?.id ?? null);
      })
      .catch(() => {
        // not logged in / agent down → anonymous chat fallback
        setBookings([]);
      })
      .finally(() => setLoadingTrips(false));
  }, [open]);

  const selectedBooking = useMemo(
    () => bookings.find((b) => b.id === selectedId) || null,
    [bookings, selectedId]
  );

  // inside AgentDrawer.jsx

async function handleSubmit(e) {
  e.preventDefault();
  setSubmitting(true);
  setError("");
  setAnswer(null);

  try {
    const b = bookings.find(x => x.id === selectedId);
    if (!b) {
      throw new Error("No booking selected");
    }

    // map only from the returned booking fields
    const payload = {
      booking: {
        id: b.id,
        location: b.location,                                // e.g. "San Diego, CA"
        start: (b.start_date || "").slice(0, 10),            // e.g. "2025-10-29"
        end:   (b.end_date   || "").slice(0, 10),            // e.g. "2025-10-31"
        guests: Number(b.guests ?? 1)                         // keep provided guests
        // ⬅️ no partyType, no extras
      },
      ask: (ask || "")
    };

    // quick client guard to avoid a 422
    if (!payload.booking.location || !payload.booking.start || !payload.booking.end) {
      throw new Error("Missing required booking fields (location/start/end).");
    }

    const data = await agentPlan(payload);
    setAnswer({ type: "plan", data });
  } catch (err) {
    setError(err?.message || "Could not generate plan.");
  } finally {
    setSubmitting(false);
  }
}

  // ---- UI sections (scoped style: dark/glass only inside drawer) ----
  function Header() {
    return (
      <div className="flex items-center justify-between border-b border-white/10 bg-black/40 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-400/15 ring-1 ring-emerald-300/30">
            🌍
          </span>
          <div>
            <div className="text-base font-semibold text-white">TripMate</div>
            <div className="text-xs text-white/60 -mt-0.5">Your travel concierge</div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-2 text-white/70 hover:bg-white/10 hover:text-white"
          aria-label="Close"
          type="button"
        >
          ✕
        </button>
      </div>
    );
  }

  function TripsSection() {
    if (loadingTrips) {
      return (
        <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/70">
          <div className="flex items-center gap-2">
            <Spinner /> <span>Loading trips…</span>
          </div>
          <div className="mt-3 grid gap-2">
            <div className="h-10 rounded-lg bg-white/5 animate-pulse" />
            <div className="h-10 rounded-lg bg-white/5 animate-pulse" />
          </div>
        </div>
      );
    }
    if (!bookings.length) {
      return (
        <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/80">
          You’re not logged in or no upcoming trips found. You can still ask general questions
          below (web & weather enabled).
        </div>
      );
    }
    return (
      <div className="space-y-2">
        <div className="text-sm font-medium text-white/90">Choose one of your upcoming trips</div>
        <div className="space-y-2">
          {bookings.map((b) => (
            <label
              key={b.id}
              className="group flex cursor-pointer items-start gap-3 rounded-lg border border-white/10 bg-black/30 p-3 hover:border-white/25 transition"
            >
              <input
                type="radio"
                className="mt-1 accent-emerald-400"
                name="booking"
                checked={selectedId === b.id}
                onChange={() => setSelectedId(b.id)}
              />
              <div>
                <div className="text-white">
                  {b.location} <span className="text-white/50">•</span>{" "}
                  <span className="text-white/80">{b.guests || 2} guests</span>
                </div>
                <div className="text-xs text-white/60">
                  {b.start?.slice(0, 10)} → {b.end?.slice(0, 10)} · {b.partyType || "group"}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>
    );
  }

  function AnswerBlock() {
    if (!answer) return null;

    if (answer.type === "chat") {
      return (
        <div className="mt-4 rounded-lg border border-white/10 bg-black/30 p-3 text-sm text-white/90">
          {answer.data?.answer || ""}
        </div>
      );
    }

    const plan = answer.data || {};
    return (
      <div className="mt-4 space-y-3">
        {/* packing */}
        <div className="rounded-lg border border-white/10 bg-white/5 p-3">
          <div className="text-sm font-semibold text-white">Packing</div>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-white/90">
            {(plan.packing || []).map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </div>

        {/* raw json */}
        <details className="rounded-lg border border-white/10 bg-white/5 p-3">
          <summary className="cursor-pointer text-sm font-semibold text-white">
            View full JSON
          </summary>
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words text-xs text-white/80">
            {JSON.stringify(plan, null, 2)}
          </pre>
        </details>
      </div>
    );
  }

  return (
    <>
      {/* Backdrop (scoped) */}
      <div
        className={`fixed inset-0 z-[60] bg-black/40 transition-opacity ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer (scoped dark/glass only) */}
      <div
        className={`fixed right-0 top-0 z-[70] h-full w-full max-w-[420px] transform bg-[#0B0B0F]/95 text-white shadow-2xl ring-1 ring-white/10 backdrop-blur-xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <Header />

        <div className="flex h-[calc(100%-56px)] flex-col gap-4 overflow-y-auto p-4">
          {/* Trips */}
          <TripsSection />

          {/* Ask form (works for both anon & logged-in) */}
          <form onSubmit={handleSubmit} className="space-y-2">
            <label className="text-sm font-medium text-white/90">
              Tell me what you need (NLU)
            </label>
            <textarea
              rows={3}
              placeholder='e.g., “We’re on a $900 budget, vegan, wheelchair user, want beaches and easy walks for 2 kids”'
              className="w-full resize-none rounded-lg border border-white/10 bg-black/40 p-3 text-sm text-white placeholder-white/40 outline-none ring-emerald-400/0 focus:ring-2"
              value={ask}
              onChange={(e) => setAsk(e.target.value)}
            />

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-400 px-4 py-2 font-semibold text-black shadow-lg shadow-emerald-500/20 hover:brightness-105 disabled:opacity-60"
            >
              {selectedBooking
                ? submitting ? "Planning…" : "Generate plan"
                : submitting ? "Thinking…" : "Ask"}
            </button>
          </form>

          {error && <div className="text-sm text-red-300">{error}</div>}

          {/* Answer */}
          <AnswerBlock />
        </div>
      </div>
    </>
  );
}