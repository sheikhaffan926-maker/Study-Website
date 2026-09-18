export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      animation: {
        float: 'float 6s ease-in-out infinite',
        glow: 'glow 2.8s ease-in-out infinite alternate'
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        glow: {
          from: { boxShadow: '0 0 0px rgba(66,153,225,0.2)' },
          to: { boxShadow: '0 0 28px rgba(109,93,246,0.45)' }
        }
      }
    }
  },
  plugins: []
};
