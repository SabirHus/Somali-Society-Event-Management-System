// web/vite.config.js - Vite Build Configuration

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Plugin: React support for JSX and Fast Refresh
  plugins: [react()], 
  
  // Server Configuration (primarily for local development)
  server: {
    port: 5173,        // Preferred port for the web client
    strictPort: false, // Allows Vite to try another port if 5173 is busy
  },
});