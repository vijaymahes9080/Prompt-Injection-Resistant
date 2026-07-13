/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Support toggling dark mode classes
  theme: {
    extend: {
      colors: {
        // Safe, clean security palettes: Dark slate slate backdrops, neon cyan, warning amber, threat red
        terminal: {
          bg: '#0a0f1d',
          card: '#131c31',
          border: '#1f2e4d',
          accent: '#06b6d4', // Cyan accent
          warning: '#f59e0b', // Amber alert
          error: '#ef4444', // Red threat
          success: '#10b981' // Green pass
        }
      }
    },
  },
  plugins: [],
}
