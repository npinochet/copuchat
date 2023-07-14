/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        main: '#2e5a62',
      },
    },
    fontFamily: {
      sans: ["Montserrat", "system-ui", "sans-serif"],
    },
  },
  plugins: [],
};
