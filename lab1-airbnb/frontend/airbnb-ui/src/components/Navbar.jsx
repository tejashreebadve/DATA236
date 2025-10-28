import { useAuth } from "../store";
import { useState } from "react";

const btnBase = "px-4 py-2 rounded-full border transition font-medium";
const btn = `${btnBase} border-red-400 bg-white text-red-800 hover:bg-red-100`;
const btnPrimary = `${btnBase} border-red-800 bg-red-700 text-white hover:bg-red-200`;


export default function Navbar({ onOpenSearch }) {
  const user = useAuth(s => s.user);
  const logout = useAuth(s => s.logout);
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-40 bg-red-100/80 backdrop-blur border-b border-red-200">
      <div className="mx-auto max-w-7xl px-4 h-20 flex items-center justify-between">

        {/* Brand */}
        <a href="/" className="flex items-center gap-2 select-none hover:opacity-90 transition">
          <div className="text-red-700 text-2xl">🏡</div>
          <span className="text-[22px] font-semibold tracking-tight text-red-700">
            Stay<span className="font-black text-neutral-800">Nest</span>
          </span>
        </a>

        {/* Search Pill */}
        <button
          onClick={onOpenSearch}
          aria-label="Open search"
          className="
            hidden md:flex items-center gap-3 px-5 py-3 rounded-full
            border border-red-300 bg-white text-red-700 text-sm
            hover:bg-red-100 transition
          "
        >
          <span className="font-medium">Where</span>
          <span className="text-red-500">When</span>
          <span className="text-red-500">Who</span>
          <div className="ml-1 p-2 rounded-full border border-red-300 bg-white flex items-center justify-center">
            🔍
          </div>
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
              className="absolute right-0 top-[72px] w-56 rounded-xl bg-white shadow border border-red-200 p-2 z-50"
            >
              {!user ? (
                <a
                  href="/signup"
                  className="block px-3 py-2 rounded text-sm text-red-700 hover:bg-red-100 transition"
                >
                  Sign up
                </a>
              ) : (
                <>
                  <div className="px-3 py-2 text-sm text-black">
                    Signed in as <span className="font-medium text-red-700">{user.name}</span>
                  </div>
                  <a
                    href={user.role === "OWNER" ? "/owner" : "/traveler"}
                    className="block px-3 py-2 rounded text-sm text-black hover:bg-red-100 transition"
                  >
                    Dashboard
                  </a>
                  <a
                    href={user.role === "OWNER" ? "/owner/profile" : "/traveler/profile"}
                    className="block px-3 py-2 rounded text-sm text-black hover:bg-red-100 transition"
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
