/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        farm: {
          base:    '#F4F6F5',
          surface: '#FFFFFF',
        },
        brand: {
          forest: '#06200F',
          lemon:  '#9ADF59',
        },
        status: {
          urgent:  '#E11D48',
          warning: '#F97316',
          success: '#16A34A',
          info:    '#2563EB',
        },
        ink: {
          title: '#111827',
          body:  '#4B5563',
          meta:  '#9CA3AF',
        }
      },
      borderRadius: {
        'card': '24px',
        'pill': '9999px',
      },
      boxShadow: {
        'float': '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
        'card': '0 10px 20px -5px rgba(0,0,0,0.05)',
      }
    },
  },
  plugins: [],
}
