/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        encre: 'rgb(var(--encre) / <alpha-value>)',
        encreClair: 'rgb(var(--encre-claire) / <alpha-value>)',
        papier: 'rgb(var(--papier) / <alpha-value>)',
        or: 'rgb(var(--or) / <alpha-value>)',
        grenat: 'rgb(var(--grenat) / <alpha-value>)',
        ligne: 'rgb(var(--ligne) / var(--ligne-alpha))',
      },
      fontFamily: {
        display: ['"Unbounded"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      backgroundImage: {
        grain: 'radial-gradient(circle at 1px 1px, rgb(var(--papier) / var(--grain-alpha)) 1px, transparent 0)',
      },
    },
  },
  plugins: [],
}
