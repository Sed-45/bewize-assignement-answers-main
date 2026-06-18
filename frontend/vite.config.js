import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev server runs on http://localhost:5173 and talks to the Spring Boot API on :8080.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});
