/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      zIndex: {
        'devtools': '5',
        'hud': '10',
        'floating': '20',
        'sheet': '80',
        'overlay': '90',
        'modal': '100',
      },
      fontFamily: {
        'kr': ['Noto Sans KR', 'Inter', 'sans-serif'],
      },
      colors: {
        background: 'rgb(var(--background-rgb))',
        foreground: 'rgb(var(--foreground-rgb))',
      },
    },
  },
  plugins: [],
}
