const supabaseUrl = String(process.env.SUPABASE_URL || process.env.HICHKI_SUPABASE_URL || '').replace(/\/$/, '');
const publishableKey = String(process.env.SUPABASE_PUBLISHABLE_KEY || process.env.HICHKI_SUPABASE_ANON_KEY || '');
const socketUrl = String(process.env.HICHKI_SOCKET_URL || '').replace(/\/$/, '');
const users = [
  { email: process.env.E2E_EMAIL_A, password: process.env.E2E_PASSWORD_A, label: 'A' },
  { email: process.env.E2E_EMAIL_B, password: process.env.E2E_PASSWORD_B, label: 'B' },
];

const fail = message => { throw new Error(message); };
const uuid = () => crypto.randomUUID();
const jsonHeaders = token => ({
  apikey: publishableKey,
  authorization: `Bearer ${token}`,
  'content-type': 'application/json',
});

if (!supabaseUrl || !publishableKey || !socketUrl) fail('Missing Supabase or Socket.IO runtime configuration.');
for (const user of users) if (!user.email || !user.password) fail(`Missing E2E credentials for user ${user.label}.`);

async function jsonResponse(response, context) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) fail(`${context}: HTTP ${response.status} ${payload?.message || payload?.error || payload?.msg || 'request_failed'}`);
  return payload;
}

async function signIn(user) {
  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: publishableKey, 'content-type': 'application/json' },
    body: JSON.stringify({ email: user.email, password: user.password }),
  });
  const payload = await jsonResponse(response, `sign-in ${user.label}`);
  if (!payload?.access_token || !payload?.user?.id) fail(`sign-in ${user.label}: missing session`);
  return { id: payload.user.id, token: payload.access_token, label: user.label };
}

async function rest(session, path, { method = 'GET', body, prefer } = {}) {
  const headers = jsonHeaders(session.token);
  if (prefer) headers.Prefer = prefer;
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (response.status === 204) return null;
  return jsonResponse(response, `${method} ${path.split('?')[0]}`);
}

async function directConversation(actor, otherUserId) {
  const response = await fetch(`${supabaseUrl}/functions/v1/hichki-conversation-v3`, {
    method: 'POST',
    headers: jsonHeaders(actor.token),
    body: JSON.stringify({ other_user_id: otherUserId }),
  });
  const payload = await jsonResponse(response, 'direct conversation');
  if (!payload?.conversation_id) fail('direct conversation: missing conversation_id');
  return payload.conversation_id;
}

class RawSocketIo {
  constructor(baseUrl, token, label) {
    this.baseUrl = baseUrl;
    this.token = token;
    this.label = label;
    this.ws = null;
    this.listeners = new Map();
    this.connected = null;
  }

  async connect() {
    const wsUrl = new URL(this.baseUrl);
    wsUrl.protocol = wsUrl.protocol === 'https:' ? 'wss:' : 'ws:';
    wsUrl.pathname = '/socket.io/';
    wsUrl.search = 'EIO=4&transport=websocket';

    this.ws = new WebSocket(wsUrl);
    this.connected = new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`socket ${this.label}: connect timeout`)), 15000);
      this.ws.addEventListener('error', () => { clearTimeout(timer); reject(new Error(`socket ${this.label}: websocket error`)); }, { once: true });
      this.ws.addEventListener('message', event => {
        const packet = typeof event.data === 'string' ? event.data : String(event.data);
        if (packet.startsWith('0')) {
          this.ws.send(`40${JSON.stringify({ token: this.token })}`);
          return;
        }
        if (packet === '2') {
          this.ws.send('3');
          return;
        }
        if (packet.startsWith('40')) {
          clearTimeout(timer);
          resolve();
          return;
        }
        if (!packet.startsWith('42')) return;
        try {
          const data = JSON.parse(packet.slice(2));
          const [eventName, payload] = data;
          const waiting = this.listeners.get(eventName) || [];
          for (const entry of [...waiting]) {
            if (!entry.predicate || entry.predicate(payload)) {
              clearTimeout(entry.timer);
              this.listeners.set(eventName, waiting.filter(x => x !== entry));
              entry.resolve(payload);
            }
          }
        } catch {}
      });
    });
    await this.connected;
    return this;
  }

  emit(eventName, payload) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) fail(`socket ${this.label}: not open for ${eventName}`);
    this.ws.send(`42${JSON.stringify([eventName, payload])}`);
  }

  wait(eventName, predicate = null, timeoutMs = 12000) {
    return new Promise((resolve, reject) => {
      const entry = { predicate, resolve, reject, timer: null };
      entry.timer = setTimeout(() => {
        const waiting = this.listeners.get(eventName) || [];
        this.listeners.set(eventName, waiting.filter(x => x !== entry));
        reject(new Error(`socket ${this.label}: timed out waiting for ${eventName}`));
      }, timeoutMs);
      const waiting = this.listeners.get(eventName) || [];
      waiting.push(entry);
      this.listeners.set(eventName, waiting);
    });
  }

  close() {
    try { this.ws?.close(); } catch {}
  }
}

const cleanup = [];
let socketA;
let socketB;
let reconnectA;

try {
  const [a, b] = await Promise.all(users.map(signIn));
  console.log('E2E_AUTH_OK', `A=${a.id}`, `B=${b.id}`);

  const conversationId = await directConversation(a, b.id);
  const members = await rest(a, `conversation_members?conversation_id=eq.${conversationId}&select=user_id`);
  if (!Array.isArray(members) || !members.some(x => x.user_id === a.id) || !members.some(x => x.user_id === b.id)) fail('conversation membership invariant failed');
  console.log('E2E_CONVERSATION_OK', conversationId);

  socketA = await new RawSocketIo(socketUrl, a.token, 'A').connect();
  socketB = await new RawSocketIo(socketUrl, b.token, 'B').connect();

  const bPresence = socketB.wait('presence', p => p?.conversationId === conversationId && p?.online === true);
  socketB.emit('conversation:join', { conversationId });
  await bPresence;

  const aPresence = socketA.wait('presence', p => p?.conversationId === conversationId && p?.online === true);
  const joinSeenByB = socketB.wait('presence:join', p => p?.conversationId === conversationId && p?.user_id === a.id);
  socketA.emit('conversation:join', { conversationId });
  await Promise.all([aPresence, joinSeenByB]);
  console.log('E2E_PRESENCE_OK');

  const clientId = uuid();
  const content = `Hichki production smoke ${new Date().toISOString()}`;
  const inserted = await rest(a, 'chat_messages?select=id,conversation_id,sender_id,client_id,content,kind,created_at', {
    method: 'POST',
    prefer: 'return=representation',
    body: { conversation_id: conversationId, sender_id: a.id, client_id: clientId, content, kind: 'text', meta: { e2e: true } },
  });
  const message = inserted?.[0];
  if (!message?.id) fail('message insert did not return id');
  cleanup.push(() => rest(a, `chat_messages?id=eq.${message.id}`, { method: 'DELETE' }).catch(() => {}));

  const bDurable = await rest(b, `chat_messages?id=eq.${message.id}&select=id,content,sender_id`);
  if (bDurable?.[0]?.id !== message.id || bDurable[0].content !== content) fail('durable Supabase fallback read failed');

  const messageOnB = socketB.wait('message', p => p?.id === message.id && p?.content === content);
  socketA.emit('message:relay', { conversationId, messageId: message.id });
  await messageOnB;
  console.log('E2E_MESSAGE_RELAY_OK', message.id);

  const typingOnB = socketB.wait('typing', p => p?.conversationId === conversationId && p?.user_id === a.id && p?.is_typing === true);
  socketA.emit('typing', { conversationId, is_typing: true });
  await typingOnB;
  console.log('E2E_TYPING_OK');

  const now = new Date().toISOString();
  const receiptRows = await rest(b, 'message_receipts?on_conflict=message_id,user_id&select=message_id,user_id,delivered_at,read_at,updated_at', {
    method: 'POST',
    prefer: 'resolution=merge-duplicates,return=representation',
    body: { message_id: message.id, user_id: b.id, delivered_at: now, read_at: now, updated_at: now },
  });
  if (receiptRows?.[0]?.user_id !== b.id) fail('receipt upsert failed');
  const receiptOnA = socketA.wait('receipt', p => p?.message_id === message.id && p?.user_id === b.id && Boolean(p?.read_at));
  socketB.emit('receipt:relay', { conversationId, messageId: message.id });
  await receiptOnA;
  console.log('E2E_RECEIPT_OK');

  const noteRows = await rest(a, 'library_items?select=id,owner_id,item_type,title,body', {
    method: 'POST',
    prefer: 'return=representation',
    body: { owner_id: a.id, item_type: 'note', title: 'Hichki E2E note', body: 'Production smoke note', metadata: { e2e: true } },
  });
  const note = noteRows?.[0];
  if (!note?.id) fail('note insert failed');
  cleanup.push(() => rest(a, `library_items?id=eq.${note.id}`, { method: 'DELETE' }).catch(() => {}));
  const hiddenNote = await rest(b, `library_items?id=eq.${note.id}&select=id`);
  if (hiddenNote.length !== 0) fail('library owner isolation failed for note');

  const musicRows = await rest(a, 'library_items?select=id,owner_id,item_type,title,url', {
    method: 'POST',
    prefer: 'return=representation',
    body: { owner_id: a.id, item_type: 'music', title: 'Hichki E2E track', body: '', url: 'https://example.com/hichki-e2e-track', metadata: { e2e: true } },
  });
  const music = musicRows?.[0];
  if (!music?.id) fail('music insert failed');
  cleanup.push(() => rest(a, `library_items?id=eq.${music.id}`, { method: 'DELETE' }).catch(() => {}));
  const hiddenMusic = await rest(b, `library_items?id=eq.${music.id}&select=id`);
  if (hiddenMusic.length !== 0) fail('library owner isolation failed for music');
  console.log('E2E_LIBRARY_RLS_OK');

  const leaveSeenByB = socketB.wait('presence:leave', p => p?.conversationId === conversationId && p?.user_id === a.id);
  socketA.close();
  await leaveSeenByB;
  reconnectA = await new RawSocketIo(socketUrl, a.token, 'A-reconnect').connect();
  const rePresence = reconnectA.wait('presence', p => p?.conversationId === conversationId && p?.online === true);
  reconnectA.emit('conversation:join', { conversationId });
  await rePresence;
  console.log('E2E_RECONNECT_OK');

  console.log('HICHKI_PRODUCTION_SMOKE_PASS');
} finally {
  reconnectA?.close();
  socketA?.close();
  socketB?.close();
  for (const fn of cleanup.reverse()) await fn();
}
