import http from 'node:http';
import { createClient } from '@supabase/supabase-js';
import { Server } from 'socket.io';

const PORT = Number(process.env.PORT || 8787);
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.HICHKI_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.HICHKI_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'https://hichki.netlify.app,http://localhost:5173')
  .split(',').map(x => x.trim()).filter(Boolean);
const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL/HICHKI_SUPABASE_URL or publishable/anon key.');
  process.exit(1);
}

const httpServer = http.createServer((req, res) => {
  if (req.url === '/healthz') {
    res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
    res.end(JSON.stringify({ ok: true, service: 'hichki-realtime', transport: 'socket.io' }));
    return;
  }
  res.writeHead(404, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ error: 'not_found' }));
});

const io = new Server(httpServer, {
  cors: {
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error('origin_not_allowed'));
    },
    methods: ['GET', 'POST'],
    credentials: false,
  },
  transports: ['websocket', 'polling'],
  maxHttpBufferSize: 64 * 1024,
  pingInterval: 25000,
  pingTimeout: 20000,
  connectionStateRecovery: { maxDisconnectionDuration: 2 * 60 * 1000, skipMiddlewares: false },
});

const room = conversationId => `conversation:${conversationId}`;
const isUuid = value => uuidRe.test(String(value || ''));
const rateOk = socket => {
  const now = Date.now();
  const bucket = socket.data.rate || { start: now, count: 0 };
  if (now - bucket.start > 10000) { bucket.start = now; bucket.count = 0; }
  bucket.count += 1; socket.data.rate = bucket;
  return bucket.count <= 80;
};
const ackError = (ack, code) => { if (typeof ack === 'function') ack({ ok: false, error: code }); };
const ackOk = (ack, extra = {}) => { if (typeof ack === 'function') ack({ ok: true, ...extra }); };

io.use(async (socket, next) => {
  try {
    const token = String(socket.handshake.auth?.token || '');
    if (!token) return next(new Error('missing_token'));
    const client = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data, error } = await client.auth.getUser(token);
    if (error || !data.user) return next(new Error('invalid_token'));
    socket.data.user = data.user;
    socket.data.client = client;
    socket.data.joined = new Set();
    next();
  } catch {
    next(new Error('auth_failed'));
  }
});

async function ensureMembership(socket, conversationId) {
  if (!isUuid(conversationId)) return false;
  if (socket.data.joined?.has(conversationId)) return true;
  const { data, error } = await socket.data.client
    .from('conversation_members')
    .select('conversation_id')
    .eq('conversation_id', conversationId)
    .eq('user_id', socket.data.user.id)
    .maybeSingle();
  return !error && data?.conversation_id === conversationId;
}

io.on('connection', socket => {
  const userId = socket.data.user.id;

  socket.on('conversation:join', async ({ conversationId } = {}, ack) => {
    if (!rateOk(socket)) return ackError(ack, 'rate_limited');
    if (!await ensureMembership(socket, conversationId)) return ackError(ack, 'forbidden');
    socket.data.joined.add(conversationId);
    await socket.join(room(conversationId));
    socket.to(room(conversationId)).emit('presence:join', { conversationId, user_id: userId, at: Date.now() });
    io.to(socket.id).emit('presence', { conversationId, user_id: userId, online: true, at: Date.now() });
    ackOk(ack);
  });

  socket.on('conversation:leave', async ({ conversationId } = {}, ack) => {
    if (!isUuid(conversationId)) return ackError(ack, 'invalid_conversation');
    socket.data.joined.delete(conversationId);
    await socket.leave(room(conversationId));
    socket.to(room(conversationId)).emit('presence:leave', { conversationId, user_id: userId, at: Date.now() });
    ackOk(ack);
  });

  socket.on('typing', async ({ conversationId, is_typing } = {}, ack) => {
    if (!rateOk(socket)) return ackError(ack, 'rate_limited');
    if (!await ensureMembership(socket, conversationId)) return ackError(ack, 'forbidden');
    socket.to(room(conversationId)).emit('typing', { conversationId, user_id: userId, is_typing: Boolean(is_typing), at: Date.now() });
    ackOk(ack);
  });

  socket.on('message:relay', async ({ conversationId, messageId } = {}, ack) => {
    if (!rateOk(socket)) return ackError(ack, 'rate_limited');
    if (!isUuid(messageId) || !await ensureMembership(socket, conversationId)) return ackError(ack, 'forbidden');
    const { data, error } = await socket.data.client
      .from('chat_messages')
      .select('id,conversation_id,sender_id,client_id,content,kind,meta,created_at,edited_at,deleted_at')
      .eq('id', messageId)
      .eq('conversation_id', conversationId)
      .eq('sender_id', userId)
      .maybeSingle();
    if (error || !data) return ackError(ack, 'message_not_found');
    socket.to(room(conversationId)).emit('message', data);
    ackOk(ack, { messageId: data.id });
  });

  socket.on('receipt:relay', async ({ conversationId, messageId } = {}, ack) => {
    if (!rateOk(socket)) return ackError(ack, 'rate_limited');
    if (!isUuid(messageId) || !await ensureMembership(socket, conversationId)) return ackError(ack, 'forbidden');
    const { data: message, error: messageError } = await socket.data.client
      .from('chat_messages').select('id,conversation_id').eq('id', messageId).eq('conversation_id', conversationId).maybeSingle();
    if (messageError || !message) return ackError(ack, 'message_not_found');
    const { data: receipt, error } = await socket.data.client
      .from('message_receipts').select('message_id,user_id,delivered_at,read_at,updated_at')
      .eq('message_id', messageId).eq('user_id', userId).maybeSingle();
    if (error || !receipt) return ackError(ack, 'receipt_not_found');
    socket.to(room(conversationId)).emit('receipt', { ...receipt, conversation_id: conversationId });
    ackOk(ack);
  });

  socket.on('disconnecting', () => {
    for (const conversationId of socket.data.joined || []) {
      socket.to(room(conversationId)).emit('presence:leave', { conversationId, user_id: userId, at: Date.now() });
    }
  });
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Hichki Socket.IO relay listening on :${PORT}`);
});
