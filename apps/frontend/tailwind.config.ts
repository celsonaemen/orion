import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        orion: {
          accent: "#0f766e",
          ink: "#111827",
          line: "#d1d5db",
          muted: "#4b5563",
          surface: "#f8fafc"
        }
      }
    }
  },
  plugins: []
};

export default config;
