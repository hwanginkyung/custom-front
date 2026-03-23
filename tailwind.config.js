/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        Neutral: {
          black: "#000000",
          900: "#1B242C",
          800: "#32383F",
          700: "#3D4349",
          600: "#5B6064",
          500: "#B2B4B6",
          400: "#D5D5D5",
          300: "#EBEBEB",
          200: "#F2F2F2",
          100: "#F7F7F7",
          White: "#FFFFFF",
        },
        Brand: {
          1: "#0E162B",
          2: "#373EEF",
          3: "#00F0FF",
        },
        Blue: {
          50: "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#93C5FD",
          400: "#60A5FA",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
        },
        Red: {
          50: "#FEF2F2",
          100: "#FEE2E2",
          200: "#FECACA",
          300: "#FCA5A5",
          400: "#F87171",
          500: "#EF4444",
          600: "#DC2626",
          700: "#B91C1C",
        },
        Green: {
          50: "#F0FDF4",
          100: "#DCFCE7",
          200: "#BBF7D0",
          300: "#86EFAC",
          400: "#4ADE80",
          500: "#22C55E",
          600: "#16A34A",
          700: "#15803D",
        },
      },
    },
  },
  plugins: [],
};
