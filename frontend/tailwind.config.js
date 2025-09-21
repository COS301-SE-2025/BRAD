/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,jsx,ts,tsx}",
    "./src/pages/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
    "./src/lib/**/*.{js,jsx,ts,tsx}",
    "./public/**/*.html"
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brad: {
          50: "#f0f7ff",
          100: "#d9eeff",
          200: "#b3dbff",
          300: "#80c2ff",
          400: "#4aa6ff",
          500: "#1b82ff",
          600: "#1366d9",
          700: "#0f4ca3",
          800: "#0b346f",
          900: "#061f42"
        }
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"]
      }
    }
  },
  plugins: []
};
