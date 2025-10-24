export default function FloatingAgentButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 rounded-full shadow-lg px-5 py-3 bg-brand text-white hover:brightness-95"
      aria-label="Open AI Concierge"
    >
      AI Concierge
    </button>
  );
}
