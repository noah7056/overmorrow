# Overmorrow Canvas (Base)

This repository contains a minimal base for a collaborative drawing web app.

- A left toolbar to control brush color, size, opacity, and eraser.
- A drawing canvas on the right that reacts to mouse/touch input.
- A skeleton for real-time collaboration (e.g., Supabase or WebSocket).

How to run locally:
- Open index.html in a browser (no build step needed for this base).
- The app is fully client-side. Real-time collaboration requires a backend
  or a hosted service.

Real-time collaboration options (recommended approaches):
- Supabase Realtime:
  - Create a Supabase project and enable Realtime for a strokes table.
  - Use Supabase JS client in the frontend to subscribe to stroke events and
    presence, broadcasting drawing data to all connected clients in a room.
  - Add environment variables for SUPABASE_URL and SUPABASE_ANON_KEY and wire
    a simple join flow to enter a room id.
- WebSocket server:
  - Spin up a small WebSocket backend that fans out drawing coordinates to
    all clients in a room. This is simple to deploy with Node.js and ws or
    socket.io.

Notes:
- The current build is intentionally minimal to help you get a base canvas up
  quickly. The real-time backend integration is scaffolded in main.js as a
  placeholder; you can replace it with your preferred stack.
- Avatars and online presence are planned features; the real-time backend can
  expose a presence endpoint to broadcast online users and their avatars.

Next steps:
- Wire a real-time backend (Supabase or WebSocket) and implement a simple
  stroke message protocol: { room, id, color, size, opacity, eraser, path }.
- Add presence indicators (avatars) in the UI.
- Implement a small server to handle room creation, presence, and stroke events.
