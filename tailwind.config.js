/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#0f2cbd",
        "primary-hover": "#0a1f8a",
        "royal-gray": "#334155",
        "royal-gray-dark": "#1e293b",
        "background-light": "#f8fafc", // Slate 50
        "background-dark": "#101322",
        "surface-light": "#ffffff",
        "surface-dark": "#1e293b", // Slate 800
        "text-main-light": "#0f172a", // Slate 900
        "text-main-dark": "#f1f5f9", // Slate 100
        "text-secondary-light": "#64748b", // Slate 500
        "text-secondary-dark": "#94a3b8", // Slate 400
        "border-light": "#cbd5e1", // Slate 300
        "border-dark": "#334155", // Slate 700
      },
      fontFamily: {
        "display": ["Heebo", "sans-serif"]
      },
      borderRadius: {
        "DEFAULT": "0.125rem", // 2px
        "lg": "0.25rem", // 4px
        "xl": "0.375rem", // 6px
        "full": "9999px"
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-down": {
          "0%": { opacity: "0", transform: "translateY(-20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "slide-out-right": {
          "0%": { transform: "translateX(0)", opacity: "1" },
          "100%": { transform: "translateX(100%)", opacity: "0" },
        },
        "slide-in-left": {
          "0%": { transform: "translateX(-100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "backdrop-fade": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "bounce-subtle": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
        "progress-fill": {
          "0%": { width: "0%" },
          "100%": { width: "var(--progress-width)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "wiggle": {
          "0%, 100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(-3deg)" },
          "75%": { transform: "rotate(3deg)" },
        },
        // Modal animations
        "modal-enter": {
          "0%": { opacity: "0", transform: "scale(0.95) translateY(10px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        "modal-exit": {
          "0%": { opacity: "1", transform: "scale(1) translateY(0)" },
          "100%": { opacity: "0", transform: "scale(0.95) translateY(10px)" },
        },
        "overlay-enter": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        // Slide up for bottom sheets/modals
        "slide-up": {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "slide-down": {
          "0%": { transform: "translateY(0)", opacity: "1" },
          "100%": { transform: "translateY(100%)", opacity: "0" },
        },
        // Stagger fade for list items
        "stagger-fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        // Success checkmark
        "checkmark": {
          "0%": { transform: "scale(0) rotate(-45deg)", opacity: "0" },
          "50%": { transform: "scale(1.2) rotate(-45deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(-45deg)", opacity: "1" },
        },
        // Error shake
        "shake": {
          "0%, 100%": { transform: "translateX(0)" },
          "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-4px)" },
          "20%, 40%, 60%, 80%": { transform: "translateX(4px)" },
        },
        // Ripple effect
        "ripple": {
          "0%": { transform: "scale(0)", opacity: "0.5" },
          "100%": { transform: "scale(4)", opacity: "0" },
        },
        // Count up number animation
        "count-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        // Skeleton loading pulse
        "skeleton": {
          "0%": { opacity: "0.6" },
          "50%": { opacity: "0.8" },
          "100%": { opacity: "0.6" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
        "fade-in-up": "fade-in-up 0.4s ease-out",
        "fade-in-down": "fade-in-down 0.4s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "slide-out-right": "slide-out-right 0.3s ease-out",
        "slide-in-left": "slide-in-left 0.3s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "backdrop-fade": "backdrop-fade 0.2s ease-out",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        "bounce-subtle": "bounce-subtle 0.5s ease-in-out",
        "progress-fill": "progress-fill 1s ease-out forwards",
        "shimmer": "shimmer 2s linear infinite",
        "wiggle": "wiggle 0.3s ease-in-out",
        // New animations
        "modal-enter": "modal-enter 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        "modal-exit": "modal-exit 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        "overlay-enter": "overlay-enter 0.2s ease-out",
        "slide-up": "slide-up 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "slide-down": "slide-down 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        "stagger-fade-in": "stagger-fade-in 0.3s ease-out forwards",
        "checkmark": "checkmark 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        "shake": "shake 0.5s ease-in-out",
        "ripple": "ripple 0.6s linear",
        "count-up": "count-up 0.4s ease-out",
        "skeleton": "skeleton 1.5s ease-in-out infinite",
      },
      transitionTimingFunction: {
        "bounce-in": "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        "smooth": "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  plugins: [],
}
