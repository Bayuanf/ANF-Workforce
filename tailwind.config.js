/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F7F8FA",
        surface: "#FFFFFF",
        primary: {
          DEFAULT: "#27364B",
          hover: "#1D2939",
          light: "#E9ECF0",
        },
        secondary: {
          DEFAULT: "#64748B",
          hover: "#475569",
          light: "#F1F5F9",
        },
        border: "#E7EAF0",
        success: {
          DEFAULT: "#247A57",
          light: "#EBF7F1",
        },
        warning: {
          DEFAULT: "#B77932",
          light: "#FEF7EE",
        },
        danger: {
          DEFAULT: "#B94A48",
          light: "#FDF2F2",
        },
      },
      fontFamily: {
        sans: ["Inter", "Plus Jakarta Sans", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
