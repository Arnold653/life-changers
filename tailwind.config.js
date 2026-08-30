/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        encre: '#050f24',       // fond principal, bleu marine très profond
        encreClair: '#0d2044',  // surfaces légèrement surélevées (cartes)
        papier: '#eef1f5',      // texte clair
        or: '#FDAE1F',          // accent primaire — orange du logo Life Changers
        grenat: '#002079',      // accent secondaire — bleu marine du logo
        ligne: 'rgba(238,241,245,0.09)', // séparateurs
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        body: ['"Spectral"', 'serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      backgroundImage: {
        grain: "radial-gradient(circle at 1px 1px, rgba(239,232,216,0.035) 1px, transparent 0)",
      },
    },
  },
  plugins: [],
}
