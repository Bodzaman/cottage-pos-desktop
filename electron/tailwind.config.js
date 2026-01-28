/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  // Content paths point to frontend source files
  content: [
    "./index.html",
    "./main-electron.tsx",
    "../frontend/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Playfair Display', 'serif'],
        sans: ['Inter', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
        cinzel: ['Cinzel', 'serif'],
        lora: ['Lora', 'serif'],
        oldenglish: ['Cloister Black', 'serif'],
        'cloister-black': ['Cloister Black', 'serif']
      },
      colors: {
        /* ==========================================
           DESIGN SYSTEM THEME COLORS
           ========================================== */

        // Theme-aware colors (use with .theme-internal or .theme-customer wrapper)
        theme: {
          primary: "rgb(var(--theme-primary) / <alpha-value>)",
          "primary-light": "rgb(var(--theme-primary-light) / <alpha-value>)",
          "primary-dark": "rgb(var(--theme-primary-dark) / <alpha-value>)",
        },

        // Internal/Staff theme colors (Purple)
        internal: {
          primary: "rgb(var(--internal-primary) / <alpha-value>)",
          "primary-light": "rgb(var(--internal-primary-light) / <alpha-value>)",
          "primary-dark": "rgb(var(--internal-primary-dark) / <alpha-value>)",
        },

        // Customer/Public theme colors (Burgundy)
        customer: {
          primary: "rgb(var(--customer-primary) / <alpha-value>)",
          "primary-light": "rgb(var(--customer-primary-light) / <alpha-value>)",
          "primary-dark": "rgb(var(--customer-primary-dark) / <alpha-value>)",
        },

        // Shared surface/background colors
        surface: {
          primary: "rgb(var(--bg-primary) / <alpha-value>)",
          secondary: "rgb(var(--bg-secondary) / <alpha-value>)",
          tertiary: "rgb(var(--bg-tertiary) / <alpha-value>)",
          elevated: "rgb(var(--bg-elevated) / <alpha-value>)",
        },

        // Status colors
        status: {
          success: "rgb(var(--status-success) / <alpha-value>)",
          warning: "rgb(var(--status-warning) / <alpha-value>)",
          error: "rgb(var(--status-error) / <alpha-value>)",
          info: "rgb(var(--status-info) / <alpha-value>)",
        },

        /* ==========================================
           LEGACY COLORS (for backward compatibility)
           ========================================== */
        tandoor: {
          black: '#121212',
          charcoal: '#1E1E1E',
          platinum: '#E5E5E5',
          red: '#D32F2F',
          gold: '#FFC107',
        },
        // Custom luxury fashion-inspired colors
        luxury: {
          platinum: "#E5E5E5",
          ivory: "#F4F4F4",
          charcoal: "#101010",
          gunmetal: "#1C1C1C",
          silver: "#AFAFAF",
          mutedgrey: "#888888"
        },
        // Platinum-inspired restaurant theme colors
        "tandoor-platinum": "#E5E5E5",
        "tandoor-ivory": "#F4F4F4",
        "tandoor-offwhite": "#F5F5F5",
        "tandoor-charcoal": "#2A2A2A",
        "tandoor-black": "#0A0A0A",
        "tandoor-red": "#D9534F",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
      },
      height: {
        'dvh': '100dvh',
        'dvh-screen': 'calc(100 * var(--app-dvh))',
      },
      minHeight: {
        'dvh': '100dvh',
        'dvh-screen': 'calc(100 * var(--app-dvh))',
      },
      maxHeight: {
        'dvh-90': '90dvh',
        'dvh-85': '85dvh',
        'dvh-80': '80dvh',
        'modal': 'calc(90dvh - env(safe-area-inset-bottom, 0px))',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        // Theme-aware glows
        'theme-glow': '0 0 20px rgb(var(--theme-glow) / 0.3)',
        'theme-glow-strong': '0 0 30px rgb(var(--theme-glow) / 0.5)',
        // Internal (Purple) glows
        'internal-glow': '0 0 20px rgb(var(--internal-glow) / 0.3)',
        'internal-glow-strong': '0 0 30px rgb(var(--internal-glow) / 0.5)',
        // Customer (Burgundy) glows
        'customer-glow': '0 0 20px rgb(var(--customer-glow) / 0.3)',
        'customer-glow-strong': '0 0 30px rgb(var(--customer-glow) / 0.5)',
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "float": {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        "shimmer": {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "float": "float 6s ease-in-out infinite",
        "shimmer": "shimmer 8s ease-in-out infinite",
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'spice-pattern': "url('data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23AFAFAF' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')",
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
};
