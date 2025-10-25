import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../api";
import { useFav, useAuth } from "../store";

const btn = "px-4 py-2 rounded-full border border-black/30 bg-white text-black hover:border-black";
const btnPrimary = "px-4 py-2 rounded-full border border-black bg-black text-white hover:bg-neutral-900";

export default function Property() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const fav = useFav();
  const user = useAuth(s => s.user);

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/properties/${id}`);
        setItem(data);
        if (!fav.loaded) await fav.load();
      } catch (e) {
        console.error(e);
      }
    })();
  }, [id]);

  if (!item) return <div className="p-6">Loading...</div>;

  const isFav = fav.ids.includes(item.id);
  const img = item.images?.[0]?.url;

  async function toggleFav() {
    if (!user) {
      alert("Please log in to add to favourites.");
      return;
    }
    await fav.toggle(item.id);
  }

  async function requestToBook() {
    setMsg("");
    if (!user) {
      alert("Please log in to book a property.");
      return;
    }
    if (!checkIn || !checkOut || !guests) {
      setMsg("Please select dates and guests.");
      return;
    }
    try {
      setBusy(true);
      const { data } = await api.post('/bookings', {
        propertyId: item.id, checkIn, checkOut, guests: Number(guests)
      });
      setMsg(`Booking requested! ID #${data.bookingId}`);
    } catch (e) {
      const err = e?.response?.data?.error || 'Request failed';
      setMsg(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="aspect-[4/3] overflow-hidden rounded-xl bg-white border border-black/10">
          {img && <img src={img} alt={item.name} className="w-full h-full object-cover" />}
        </div>
        <div>
          <h1 className="text-2xl font-semibold">{item.name}</h1>
          <p className="text-black/70">{item.location} {item.country ? `(${item.country})` : ''}</p>
          <p className="mt-3">{item.description}</p>
          <p className="mt-3 text-lg font-medium">${Number(item.price_per_night).toFixed(0)} / night</p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-black/70">Check in</label>
              <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)}
                className="w-full border border-black/30 rounded-xl px-3 py-2 bg-white text-black" />
            </div>
            <div>
              <label className="text-sm text-black/70">Check out</label>
              <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)}
                className="w-full border border-black/30 rounded-xl px-3 py-2 bg-white text-black" />
            </div>
            <div className="col-span-2">
              <label className="text-sm text-black/70">Guests</label>
              <input type="number" min={1} value={guests} onChange={e => setGuests(e.target.value)}
                className="w-full border border-black/30 rounded-xl px-3 py-2 bg-white text-black" />
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={user ? toggleFav : () => alert("Please log in to favourite.")}
              className={btn}
            >
              {isFav ? '❤️ Remove from wishlist' : '🤍 Add to wishlist'}
            </button>
            <button
              onClick={user ? requestToBook : () => alert("Please log in to book.")}
              disabled={busy}
              className={`${btnPrimary} disabled:opacity-60`}
            >
              {busy ? 'Requesting…' : 'Request to Book'}
            </button>
          </div>
          {msg && <div className="text-sm mt-2">{msg}</div>}
        </div>
      </div>
    </div>
  );
}
