/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Afflatus Brand Colors
        primary: '#38b6ff',      // Sky Blue - Primary Accent/CTA
        error: '#ff362c',        // Bright Red - Error/Urgent Alerts
        promo: '#fdf207',        // Bright Yellow - Promo Highlights
        background: '#fdf6f5',   // Pale Pink - Subtle Backgrounds
        secondary: '#f48e1b',    // Orange - Secondary Promo
        
        // Structural Neutrals
        'brown': {
          100: '#efc282',
          200: '#df7036', 
          400: '#b83a18',
          600: '#932f17',
          900: '#3a1109',
          800: '#932f17',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-soft': 'pulse 3s infinite',
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
}