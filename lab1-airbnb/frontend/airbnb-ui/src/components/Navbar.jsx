import { useAuth } from "../store";
import { useState } from "react";

const btnBase = "px-4 py-2 rounded-full border transition";
const btn = `${btnBase} border-black/30 bg-white text-black hover:border-black`;
const btnPrimary = `${btnBase} border-black bg-black text-white hover:bg-neutral-900`;

export default function Navbar({ onOpenSearch }) {
  const user = useAuth(s => s.user);
  const logout = useAuth(s => s.logout);
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-40 bg-[#F7F3EE]/80 backdrop-blur border-b border-black/10">
      <div className="mx-auto max-w-7xl px-4 h-20 flex items-center justify-between">
        
        {/* Brand */}
        <a href="/" className="flex items-center gap-2 select-none">
          <div className="text-black text-2xl">★</div>
          <span className="font-semibold tracking-tight text-[22px]">
            Stay<span className="font-black">BnB</span>
          </span>
        </a>

        {/* Search Pill */}
        <button
          onClick={onOpenSearch}
          className="hidden md:flex items-center gap-3 px-5 py-3 rounded-full border border-black/30 bg-white text-black text-sm hover:border-black transition"
          aria-label="Open search"
        >
          <span className="font-medium">Anywhere</span>
          <span className="text-black/60">Any week</span>
          <span className="text-black/60">Add guests</span>
          <div className="ml-1 p-2 rounded-full border border-black/30 bg-white">🔍</div>
        </button>

        {/* Right Side */}
        <div className="relative flex items-center gap-3">
          {!user ? (
            <a href="/login" className={btnPrimary}>Log in</a>
          ) : (
            <button onClick={handleLogout} className={btnPrimary}>Log out</button>
          )}

          <button
            onClick={() => setOpen(prev => !prev)}
            className={btn}
            aria-haspopup="menu"
            aria-expanded={open}
          >
            Account 👤
          </button>

          {open && (
            <div
              role="menu"
              className="absolute right-0 top-[72px] w-56 rounded-xl bg-white shadow border border-black/10 p-2"
            >
              {!user ? (
                <a href="/signup" className="block px-3 py-2 rounded hover:bg-black/5">
                  Sign up
                </a>
              ) : (
                <>
                  <div className="px-3 py-2 text-sm text-black/60">
                    Signed in as <span className="font-medium text-black">{user.name}</span>
                  </div>
                  <a
                    href={user.role === "OWNER" ? "/owner" : "/traveler"}
                    className="block px-3 py-2 rounded hover:bg-black/5"
                  >
                    Dashboard
                  </a>
                  <a
                    href={user.role === "OWNER" ? "/owner/profile" : "/traveler/profile"}
                    className="block px-3 py-2 rounded hover:bg-black/5"
                  >
                    Profile
                  </a>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
