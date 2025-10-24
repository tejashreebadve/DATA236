export default function PropertyCard({ item, onToggleFavorite, isFav }) {
  const img = item.images?.[0]?.url || "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format";
  return (
    <article className="group">
      <div className="relative aspect-[20/13] overflow-hidden rounded-xl">
        <img src={img} alt={item.name} className="h-full w-full object-cover group-hover:scale-105 transition" />
        {onToggleFavorite && (
          <button onClick={onToggleFavorite}
            className="absolute top-3 right-3 p-2 rounded-full bg-white/90 hover:bg-white"
            aria-label={isFav ? "Remove from wishlist" : "Add to wishlist"}>
            {isFav ? "❤️" : "🤍"}
          </button>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between">
        <h3 className="font-medium truncate">{item.name}</h3>
        <span className="text-sm text-brand font-medium">${Number(item.price_per_night).toFixed(0)} night</span>
      </div>
      <p className="text-sm text-textSecondary truncate">{item.location}</p>
      <p className="text-sm text-textSecondary truncate">{item.bedrooms ?? 1} bd · {item.bathrooms ?? 1} bath · {item.max_guests} guests</p>
    </article>
  );
}
