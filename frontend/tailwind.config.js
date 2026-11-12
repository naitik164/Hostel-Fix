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
        // Official HostelFix Botanical Green Palette
        forest: {
          DEFAULT: '#2A3F38', // Deep Forest
          dark: '#202E22',    // Deep Forest Dark
          light: '#364F46',
        },
        botanical: {
          DEFAULT: '#22503B', // Botanical Green
          hover: '#1B402F',
          dark: '#163526',
        },
        olive: {
          DEFAULT: '#6A8A64', // Muted Olive
          muted: '#6A8A64',
          dark: '#547050',
          light: '#7E9E78',
        },
        sage: {
          DEFAULT: '#A7B88C', // Sage Green
          light: '#C1CEA6',   // Light Sage
          pale: '#DADFB9',    // Pale Sage
          dark: '#8E9F74',
        },
        lime: {
          DEFAULT: '#C3DC9B', // Soft Lime
          soft: '#C3DC9B',
          accent: '#B0CE82',
        },
        ivory: {
          DEFAULT: '#EBECDE', // Warm Ivory
          warm: '#EBECDE',
          cream: '#E8EFD3',   // Pale Cream
        },
        cream: {
          DEFAULT: '#E8EFD3', // Pale Cream
          pale: '#E8EFD3',
        },
        softwhite: '#F9FBF6', // Soft White

        // Semantic Aliases mapped to Botanical Green Palette for backward and global UI compatibility
        navy: {
          DEFAULT: '#2A3F38', // Deep Forest
          900: '#202E22',     // Deep Forest Dark
          800: '#2A3F38',     // Deep Forest
          700: '#22503B',     // Botanical Green
        },
        royal: {
          DEFAULT: '#22503B', // Botanical Green
          hover: '#1B402F',
        },
        electric: {
          DEFAULT: '#22503B', // Botanical Green
          hover: '#2A3F38',   // Deep Forest
        },
        blue: {
          DEFAULT: '#6A8A64', // Muted Olive
          bright: '#22503B',  // Botanical Green
        },
        sky: {
          DEFAULT: '#A7B88C', // Sage Green
          light: '#C1CEA6',   // Light Sage
        },
        ice: {
          DEFAULT: '#DADFB9', // Pale Sage
          light: '#E8EFD3',   // Pale Cream
          pale: '#EBECDE',    // Warm Ivory
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(180deg, #202E22 0%, #2A3F38 30%, #22503B 60%, #6A8A64 85%, #C1CEA6 100%)',
        'gradient-dark': 'linear-gradient(135deg, #202E22 0%, #2A3F38 55%, #22503B 100%)',
        'gradient-action': 'linear-gradient(135deg, #22503B 0%, #2A3F38 100%)',
        'gradient-light-glass': 'linear-gradient(135deg, rgba(235, 236, 222, 0.75) 0%, rgba(249, 251, 246, 0.90) 100%)',
        'gradient-card': 'linear-gradient(145deg, rgba(249, 251, 246, 0.95), rgba(232, 239, 211, 0.55))',
        'gradient-forest': 'linear-gradient(135deg, #202E22 0%, #2A3F38 100%)',
        'gradient-ivory': 'linear-gradient(180deg, #EBECDE 0%, #E8EFD3 100%)',
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
