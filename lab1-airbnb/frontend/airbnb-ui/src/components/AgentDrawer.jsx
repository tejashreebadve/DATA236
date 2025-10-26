export default function AgentDrawer({ open, onClose, children }) {
  return (
    <div
      className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white shadow-2xl transform transition-transform duration-300 z-40 ${
        open ? "translate-x-0" : "translate-x-full"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="AI Concierge"
    >
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="text-lg font-semibold">TripMate</h3>
        <button
          onClick={onClose}
          aria-label="Close AI Concierge"
          className="text-gray-600 hover:text-black"
        >
          ✕
        </button>
      </div>
      <div className="p-4 overflow-y-auto h-[calc(100%-56px)]">{children}</div>
    </div>
  );
}