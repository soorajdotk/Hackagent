/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#0B0C10',
        darkCard: '#1F2833',
        cyberCyan: '#66FCF1',
        cyberBlue: '#45A29E',
        neonPurple: '#BD00FF',
        successGreen: '#00E676',
        cardBg: 'rgba(31, 40, 51, 0.45)',
        cardBorder: 'rgba(102, 252, 241, 0.15)',
      },
      boxShadow: {
        glow: '0 0 15px rgba(102, 252, 241, 0.35)',
        neonPurple: '0 0 15px rgba(189, 0, 255, 0.35)',
      },
    },
  },
  plugins: [],
}
