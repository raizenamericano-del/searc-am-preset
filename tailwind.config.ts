import type { Config } from "tailwindcss";

/**
 * Design tokens — every colour / radius / shadow / motion value used in the
 * UI lives here (or as CSS variables in globals.css). Components should use
 * these tokens instead of ad-hoc values.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./hooks/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "rgb(var(--bg) / <alpha-value>)",
          soft: "rgb(var(--bg-soft) / <alpha-value>)",
          elevated: "rgb(var(--bg-elevated) / <alpha-value>)",
          raised: "rgb(var(--bg-raised) / <alpha-value>)",
        },
        ink: {
          DEFAULT: "rgb(var(--ink) / <alpha-value>)",
          muted: "rgb(var(--ink-muted) / <alpha-value>)",
          dim: "rgb(var(--ink-dim) / <alpha-value>)",
        },
        neon: {
          cyan: "rgb(var(--neon-cyan) / <alpha-value>)",
          violet: "rgb(var(--neon-violet) / <alpha-value>)",
          blue: "rgb(var(--neon-blue) / <alpha-value>)",
        },
        line: "rgb(var(--line) / <alpha-value>)",
        success: "rgb(var(--success) / <alpha-value>)",
        warn: "rgb(var(--warn) / <alpha-value>)",
        danger: "rgb(var(--danger) / <alpha-value>)",
        platform: {
          am: "rgb(var(--p-am) / <alpha-value>)",
          xml: "rgb(var(--p-xml) / <alpha-value>)",
          capcut: "rgb(var(--p-capcut) / <alpha-value>)",
          vn: "rgb(var(--p-vn) / <alpha-value>)",
          other: "rgb(var(--p-other) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-body)", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      borderRadius: {
        sm: "0.5rem",
        md: "0.75rem",
        lg: "1rem",
        xl: "1.25rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      spacing: {
        "safe-b": "env(safe-area-inset-bottom)",
        nav: "4.5rem",
      },
      boxShadow: {
        card: "0 1px 0 0 rgb(255 255 255 / 0.04) inset, 0 12px 32px -12px rgb(0 0 0 / 0.6)",
        "glow-cyan": "0 0 0 1px rgb(var(--neon-cyan) / 0.35), 0 0 24px -4px rgb(var(--neon-cyan) / 0.45)",
        "glow-violet": "0 0 0 1px rgb(var(--neon-violet) / 0.35), 0 0 24px -4px rgb(var(--neon-violet) / 0.45)",
        sheet: "0 -12px 48px -12px rgb(0 0 0 / 0.8)",
      },
      transitionTimingFunction: {
        out: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      transitionDuration: {
        fast: "150ms",
        base: "220ms",
        slow: "400ms",
      },
      keyframes: {
        shimmer: { "100%": { transform: "translateX(100%)" } },
        pulseDot: { "0%,100%": { opacity: "1" }, "50%": { opacity: "0.35" } },
        drift: { "0%,100%": { transform: "translate3d(0,0,0)" }, "50%": { transform: "translate3d(0,-12px,0)" } },
        scan: { "0%": { transform: "translateY(-100%)" }, "100%": { transform: "translateY(100%)" } },
      },
      animation: {
        shimmer: "shimmer 1.6s infinite",
        "pulse-dot": "pulseDot 1.8s ease-in-out infinite",
        drift: "drift 9s ease-in-out infinite",
        scan: "scan 2.4s linear infinite",
      },
      maxWidth: {
        prose: "65ch",
        shell: "76rem",
      },
    },
  },
  plugins: [],
};

export default config;
