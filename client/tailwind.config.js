/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#03195B',
          900: '#021244',
          800: '#03195B',
          700: '#07247D',
        },
        royal: {
          DEFAULT: '#0B2CB1',
          hover: '#092598',
        },
        electric: {
          DEFAULT: '#1951FC',
          hover: '#1343D6',
        },
        blue: {
          DEFAULT: '#3781FC',
          bright: '#3781FC',
        },
        sky: {
          DEFAULT: '#77C1FC',
          light: '#9AD2FD',
        },
        ice: {
          DEFAULT: '#CBE9FD',
          light: '#E5F4FE',
          pale: '#F5F9FF',
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(180deg, #03195B 0%, #0B2CB1 25%, #1951FC 50%, #3781FC 70%, #77C1FC 85%, #CBE9FD 100%)',
        'gradient-dark': 'linear-gradient(135deg, #03195B 0%, #0B2CB1 55%, #1951FC 100%)',
        'gradient-action': 'linear-gradient(135deg, #0B2CB1 0%, #1951FC 55%, #3781FC 100%)',
        'gradient-light-glass': 'linear-gradient(135deg, rgba(119, 193, 252, 0.30) 0%, rgba(203, 233, 253, 0.65) 100%)',
        'gradient-card': 'linear-gradient(145deg, rgba(255, 255, 255, 0.88), rgba(203, 233, 253, 0.45))',
      },
      boxShadow: {
        'glass': '0 8px 30px rgba(3, 25, 91, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
        'glass-hover': '0 14px 40px rgba(3, 25, 91, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.95)',
        'glass-dark': '0 12px 35px rgba(2, 18, 68, 0.5), inset 0 1px 0 rgba(119, 193, 252, 0.25)',
        'glow-electric': '0 0 25px rgba(25, 81, 252, 0.45)',
      },
      borderRadius: {
        'card': '22px',
        'control': '12px',
      },
    },
  },
  plugins: [],
}
