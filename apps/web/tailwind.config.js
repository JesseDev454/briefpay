/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#2962FF",
        canvas: "#F8FAFC",
        ink: "#0F172A",
        muted: "#64748B",
        accent: "#00BFA5",
        navy: "#0A0F24",
      },
    },
  },
  plugins: [],
};
