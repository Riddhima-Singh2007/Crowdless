/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#F1F5F9", // Crisp light slate background
        surface: "#FFFFFF",
        primary: {
          light: "#EEF2FF",
          DEFAULT: "#4F46E5", // Modern vibrant Indigo
          dark: "#3730A3",
          hover: "#4338CA",
        },
        accent: {
          cyan: "#06B6D4",
          blue: "#2563EB",
          purple: "#7C3AED",
          rose: "#F43F5E",
          emerald: "#10B981",
          amber: "#F59E0B",
        },
        brandText: {
          DEFAULT: "#0F172A", // Deep slate
          secondary: "#475569",
          muted: "#94A3B8",
        },
        borderLight: "#E2E8F0",
        seat: {
          available: "#10B981", // Vibrant Emerald Green
          availableBg: "#ECFDF5",
          occupied: "#94A3B8", // Slate occupied
          occupiedBg: "#E2E8F0",
          selected: "#4F46E5", // Selected Purple/Indigo
          selectedBg: "#EEF2FF",
          women: "#EC4899", // Pink for Ladies Reserved
          womenBg: "#FDF2F8",
          special: "#0284C7", // Cyan for Differently-abled/Elderly
          specialBg: "#F0F9FF",
        },
        crowd: {
          low: "#10B981",
          lowBg: "#ECFDF5",
          moderate: "#F59E0B",
          moderateBg: "#FFFBEB",
          high: "#EF4444",
          highBg: "#FEF2F2",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      boxShadow: {
        soft: "0 4px 16px -2px rgba(15, 23, 42, 0.05), 0 2px 6px -1px rgba(15, 23, 42, 0.03)",
        card: "0 10px 25px -3px rgba(15, 23, 42, 0.08), 0 4px 10px -2px rgba(15, 23, 42, 0.04)",
        glow: "0 0 20px -3px rgba(79, 70, 229, 0.25)",
        glowGreen: "0 0 20px -3px rgba(16, 185, 129, 0.3)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "hero-glow": "radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.15) 0%, transparent 60%)",
      },
    },
  },
  plugins: [],
};
