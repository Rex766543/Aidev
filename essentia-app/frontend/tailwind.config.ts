import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#6366f1",   // indigo-500: メインアクセント
          secondary: "#8b5cf6", // violet-500: サブアクセント
        },
      },
    },
  },
  plugins: [],
};

export default config;
