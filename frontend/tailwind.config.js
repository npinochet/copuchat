/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      // https://realtimecolors.com/?colors=d2f3fe-01222d-74d9fb-011319-07a9df
      colors: {
        text: "#d2f3fe",
        background: "#01222d",
        primary: "#74d9fb",
        secondary: "#011319",
        accent: "#07a9df",
        complement: "#082934",
      },
      boxShadow: {
        dup: "15px 15px 0px #01131988",
      },
    },
    fontFamily: {
      sans: ["Roboto", "Montserrat", "system-ui", "sans-serif"],
    },
  },
  plugins: [],
};
