import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://localhost:8004', // Updated port
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/predict': {
        target: 'http://localhost:8004', // Updated port
        changeOrigin: true
      },
      '/health': { // Added rule for /health
        target: 'http://localhost:8004',
        changeOrigin: true
      }
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
