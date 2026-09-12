import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// This app is a fully standalone project — it does NOT live inside the RoadPilot
// repo and does not proxy through it. It talks to the already-running RoadPilot
// backend (default http://localhost:8787) directly over plain fetch(), which works
// because RoadPilot's backend already has `app.use(cors())` with no origin
// restriction (see backend/src/server.ts). No RoadPilot code needs to change.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5183,
    host: true, // so you can also load this on a phone on the same WiFi during the demo
  },
});
