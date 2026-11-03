import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        lonking: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#FCB710", // Màu vàng thương hiệu Lonking chính
          600: "#d99505", // Màu vàng đậm khi hover / active
          700: "#b47306",
          800: "#92540d",
          900: "#783f04",
          950: "#451a03",
        },
        primary: {
          DEFAULT: "#FCB710",
          hover: "#d99505",
          active: "#b47306",
          light: "#fffbeb",
        },
        industrial: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          800: "#1e293b",
          900: "#0f172a",
        },
        amber: {
          500: "#FCB710",
          600: "#d99505",
        }
      },
    },
  },
  plugins: [],
};

export default config;
