/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Plus Jakarta Sans Fallback"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Oxygen', 'Ubuntu', 'sans-serif'],
        heading: ['Outfit', '"Plus Jakarta Sans"', '"Plus Jakarta Sans Fallback"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      colors: {
        // Official HostelFix Forest Green & Sage Palette
        forest: {
          DEFAULT: '#20543F', // Deep Forest Green
          dark: '#173D30',    // Dark Green
          light: '#2E6F54',
        },
        darkGreen: {
          DEFAULT: '#173D30', // Dark Green
        },
        emerald: {
          DEFAULT: '#00A878', // Emerald Green
          dark: '#008760',
          light: '#33BA93',
        },
        botanical: {
          DEFAULT: '#20543F', // Deep Forest Green
          hover: '#173D30',   // Dark Green
          dark: '#173D30',
        },
        olive: {
          DEFAULT: '#173D30', // Dark Green
          muted: '#A8B99A',
          dark: '#173D30',
          light: '#A8B99A',
        },
        sage: {
          DEFAULT: '#A8B99A', // Sage Green
          light: '#E9EDDA',   // Light Sage
          pale: '#F7F8F0',    // Soft Cream
          dark: '#8C9F7D',
        },
        lime: {
          DEFAULT: '#00A878', // Emerald Accent
          soft: '#A8B99A',
          accent: '#00A878',
        },
        ivory: {
          DEFAULT: '#E9EDDA', // Light Sage
          warm: '#E9EDDA',
          cream: '#F7F8F0',   // Soft Cream
        },
        cream: {
          DEFAULT: '#F7F8F0', // Soft Cream
          pale: '#F7F8F0',
        },
        softwhite: '#F7F8F0', // Soft Cream

        // Semantic Aliases mapped to Forest Green & Sage Palette for backward and global UI compatibility
        navy: {
          DEFAULT: '#20543F', // Deep Forest Green
          900: '#173D30',     // Dark Green
          800: '#20543F',     // Deep Forest Green
          700: '#20543F',     
        },
        royal: {
          DEFAULT: '#20543F', // Deep Forest Green
          hover: '#173D30',   // Dark Green
        },
        electric: {
          DEFAULT: '#20543F', // Deep Forest Green
          hover: '#173D30',   // Dark Green
        },
        blue: {
          DEFAULT: '#A8B99A', // Sage Green
          50: '#F7F8F0',      // Soft Cream
          100: '#E9EDDA',     // Light Sage
          200: '#D5DFCE',
          300: '#BDCDB2',
          400: '#A8B99A',     // Sage Green
          500: '#20543F',     // Deep Forest Green
          600: '#173D30',     // Dark Green
          700: '#133328',
          800: '#0F2820',
          900: '#0B1E18',
          bright: '#20543F',  // Deep Forest Green
        },
        sky: {
          DEFAULT: '#A8B99A', // Sage Green
          light: '#E9EDDA',   // Light Sage
        },
        ice: {
          DEFAULT: '#E9EDDA', // Light Sage
          light: '#F7F8F0',   // Soft Cream
          pale: '#F7F8F0',    // Soft Cream
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(180deg, #173D30 0%, #20543F 30%, #20543F 60%, #A8B99A 85%, #E9EDDA 100%)',
        'gradient-dark': 'linear-gradient(135deg, #173D30 0%, #20543F 55%, #173D30 100%)',
        'gradient-action': 'linear-gradient(135deg, #20543F 0%, #173D30 100%)',
        'gradient-light-glass': 'linear-gradient(135deg, rgba(233, 237, 218, 0.75) 0%, rgba(247, 248, 240, 0.90) 100%)',
        'gradient-card': 'linear-gradient(145deg, rgba(247, 248, 240, 0.95), rgba(233, 237, 218, 0.65))',
        'gradient-forest': 'linear-gradient(135deg, #173D30 0%, #20543F 100%)',
        'gradient-ivory': 'linear-gradient(180deg, #E9EDDA 0%, #F7F8F0 100%)',
      },
      boxShadow: {
        'glass': '0 8px 30px rgba(42, 63, 56, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
        'glass-hover': '0 14px 40px rgba(42, 63, 56, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.95)',
        'glass-dark': '0 12px 35px rgba(32, 46, 34, 0.45), inset 0 1px 0 rgba(195, 220, 155, 0.25)',
        'glow-lime': '0 0 25px rgba(195, 220, 155, 0.45)',
        'glow-botanical': '0 0 25px rgba(34, 80, 59, 0.35)',
      },
      borderRadius: {
        'card': '22px',
        'control': '12px',
      },
    },
  },
  plugins: [],
}
