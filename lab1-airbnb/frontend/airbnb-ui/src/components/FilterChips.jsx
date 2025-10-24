export default function FilterChips({ active, onChange }) {
  const chips = [
    { key: "beach",  label: "Beachfront", icon: "🏖️" },
    { key: "city",   label: "City",       icon: "🏙️" },
    { key: "parks",  label: "Parks",      icon: "🌳" },
    { key: "museums",label: "Museums",    icon: "🏛️" },
    { key: "hiking", label: "Hiking",     icon: "🥾" },
  ];
  return (
    <div className="mx-auto max-w-7xl px-4 pt-4 pb-2 flex gap-2 overflow-x-auto">
      {chips.map(ch => {
        const isActive = active === ch.key;
        return (
          <button
            key={ch.key}
            onClick={() => onChange(isActive ? null : ch.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border text-black bg-white
              ${isActive ? "border-black" : "border-black/30 hover:border-black"}`}
            aria-pressed={isActive}
          >
            <span>{ch.icon}</span>
            <span className="text-sm">{ch.label}</span>
          </button>
        );
      })}
    </div>
  );
}
