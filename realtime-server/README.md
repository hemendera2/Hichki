# Hichki Socket.IO relay

This service is an optional low-latency relay for Hichki. Supabase remains the durable database and authorization source, and the browser keeps Supabase Realtime as a fallback transport.

## Security contract

- Clients authenticate with their current Supabase access token in the Socket.IO handshake.
- The server validates the token with Supabase Auth.
- Conversation membership is checked through RLS before a socket can join or relay events.
- Messages are written by the browser to `chat_messages` first. The relay only rebroadcasts a canonical persisted message owned by the authenticated sender.
- Receipts are written to `message_receipts` first and then relayed.
- No `service_role` key is required or accepted by the browser runtime.

## Runtime

Node 22+. Configure the variables from `.env.example`, then run `npm install` and `npm start`. The browser build only enables this transport when `HICHKI_SOCKET_URL` is configured. Without that value Hichki continues through Supabase Realtime.

A persistent WebSocket-capable Node host is required. A static Netlify deploy alone is not a Socket.IO server.
