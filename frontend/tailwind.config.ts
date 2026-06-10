import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",        // Removed /src
    "./components/**/*.{js,ts,jsx,tsx,mdx}", // Removed /src
  ],
  // ... rest of your config
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        'agri-green': '#16a34a',
      },
    },
  },
  plugins: [],
};
export default config;