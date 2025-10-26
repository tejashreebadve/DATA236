export default function AgentFab({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg px-5 py-3 bg-black text-white hover:opacity-90"
      aria-label="AI Concierge"
      title="AI Concierge"
    >
      🤖 TripMate
    </button>
  );
}