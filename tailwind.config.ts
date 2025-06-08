import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // True Airbnb color palette
        primary: {
          50: '#fef7f7',
          100: '#fdeaea',
          200: '#fbd5d5',
          300: '#f8b4b4',
          400: '#f98080',
          500: '#FF5A5F', // Airbnb Rausch (main coral)
          600: '#E00007', // Darker coral
          700: '#C13515',
          800: '#A0291C',
          900: '#7A1F1A',
        },
        secondary: {
          50: '#f0fdf9',
          100: '#ccfdf7',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6', // Airbnb teal accent
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        neutral: {
          50: '#fafafa',
          100: '#f7f7f7', // Airbnb light gray
          200: '#ebebeb',
          300: '#dddddd',
          400: '#b0b0b0',
          500: '#717171', // Airbnb medium gray
          600: '#484848', // Airbnb dark gray
          700: '#222222', // Airbnb charcoal
          800: '#1a1a1a',
          900: '#0f0f0f',
        },
        accent: {
          purple: '#8B5CF6',
          blue: '#3B82F6',
          green: '#10B981',
          yellow: '#F59E0B',
          orange: '#F97316',
        },
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'airbnb': '0 6px 16px rgba(0, 0, 0, 0.12)',
        'airbnb-hover': '0 10px 28px rgba(0, 0, 0, 0.25)',
        'airbnb-search': '0 2px 8px rgba(0, 0, 0, 0.12)',
        'airbnb-card': '0 6px 20px rgba(0, 0, 0, 0.15)',
        'airbnb-float': '0 8px 28px rgba(0, 0, 0, 0.28)',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
