/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // UI base colors
        bgBase: "#F7F3EE",          // light beige page background
        textPrimary: "#111827",     // near-black
        textSecondary: "#6B7280",   // gray-500
        borderSubtle: "#E5E7EB",    // gray-200

        // accent (kept if you still want a bit of color for highlights)
        brand: "#E11D48",
        brandHover: "#BE123C",
      },
      fontFamily: {
        sans: ["Inter","ui-sans-serif","system-ui"]
      },
      boxShadow: {
        card: "0 8px 24px rgba(0,0,0,0.06)"
      }
    },
  },
  plugins: [],
};
