/** @type {import('tailwindcss').Config} */
import daisyui from 'daisyui'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'mono': ['Monaco', 'Menlo', 'Ubuntu Mono', 'monospace'],
      },
      colors: {
        'terminal-bg': '#1a1a1a',
        'terminal-green': '#00ff00',
        'terminal-yellow': '#ffff00',
        'terminal-red': '#ff0000',
      }
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      "dark",
      "dracula",
      "halloween",
      "retro",
      "light"
    ],
    logs: false
  }
}
