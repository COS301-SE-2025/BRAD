import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ["capstone-brad.dns.net.za", "localhost", "127.0.0.1"],
  },
  server: {
    proxy: {
      "/api": {
        target: "http://api:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
