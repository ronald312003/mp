import type { Config } from "tailwindcss";

// Color semántico basado en variables CSS (definidas en globals.css para
// claro y .dark). Así cada clase (bg-surface, text-muted…) es automáticamente
// consciente del tema sin duplicar con dark:.
const token = (name: string) => `rgb(var(${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        bg: token("--c-bg"),
        surface: token("--c-surface"),
        surface2: token("--c-surface-2"),
        line: token("--c-border"),
        content: token("--c-text"),
        muted: token("--c-muted"),
        accent: token("--c-accent"),
        "accent-strong": token("--c-accent-strong"),
        "accent-fg": token("--c-accent-fg"),
        inverse: token("--c-inverse"),
        "inverse-fg": token("--c-inverse-fg")
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"]
      },
      letterSpacing: {
        luxe: "0.28em",
        tightest: "-0.035em"
      },
      maxWidth: {
        shell: "1280px"
      },
      borderRadius: {
        editorial: "3px"
      },
      boxShadow: {
        // Ultra-difusa, muy baja opacidad (estética minimalista premium).
        soft: "0 2px 10px rgb(40 30 20 / 0.04)",
        lift: "0 6px 24px -10px rgb(40 30 20 / 0.10)"
      }
    }
  },
  plugins: []
};

export default config;
