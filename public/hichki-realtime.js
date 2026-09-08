/* Hichki realtime client bridge v6. Supabase is persistence/fallback; Socket.IO is the preferred low-latency relay when configured. */
(() => {
  'use strict';
  const CFG = window.HICHKI_CONFIG || {};
  const meta = name => document.querySelector(`meta[name="${name}"]`)?.content || '';
  const SUPABASE_URL = CFG.supabaseUrl || meta('hichki-supabase-url');
  const SUPABASE_ANON_KEY = CFG.supabaseAnonKey || meta('hichki-supabase-anon-key');
  const SOCKET_URL = (CFG.socketUrl || meta('hichki-socket-url') || '').replace(/\/$/, '');
  const DB = 'hichki-local-v6';
  const STORE = 'outbox';
  const state = {
    client: null,
    user: null,
    channels: new Map(),
    callbacks: new Map(),
    listeners: new Set(),
    online: navigator.onLine,
    flushing: false,
    socket: null,
    socketReady: false,
    socketConnecting: null,
    seen: new Map(),
  };
  const emit = (type, detail = {}) => {
    window.dispatchEvent(new CustomEvent(`hichki:${type}`, { detail }));
    state.listeners.forEach(fn => { try { fn(type, detail); } catch {} });
  };
  const uuid = () => crypto.randomUUID();
  const remember = key => {
    if (!key) return false;
    if (state.seen.has(key)) return true;
    state.seen.set(key, Date.now());
    if (state.seen.size > 1200) {
      const cutoff = Date.now() - 15 * 60 * 1000;
      for (const [k, at] of state.seen) if (at < cutoff || state.seen.size > 1000) state.seen.delete(k);
    }
    return false;
  };
  const messageKey = m => m?.id ? `id:${m.id}` : m?.client_id ? `client:${m.client_id}` : '';

  function openDB() {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) return resolve(null);
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE, { keyPath: 'client_id' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  async function queuePut(item) {
    const db = await openDB(); if (!db) return;
    await new Promise((r, j) => { const tx = db.transaction(STORE, 'readwrite'); tx.objectStore(STORE).put(item); tx.oncomplete = r; tx.onerror = () => j(tx.error); });
  }
  async function queueAll() {
    const db = await openDB(); if (!db) return [];
    return new Promise((r, j) => { const tx = db.transaction(STORE, 'readonly'); const q = tx.objectStore(STORE).getAll(); q.onsuccess = () => r(q.result || []); q.onerror = () => j(q.error); });
  }
  async function queueDelete(id) {
    const db = await openDB(); if (!db) return;
    await new Promise((r, j) => { const tx = db.transaction(STORE, 'readwrite'); tx.objectStore(STORE).delete(id); tx.oncomplete = r; tx.onerror = () => j(tx.error); });
  }
  async function loadSupabaseSDK() {
    if (window.supabase?.createClient) return window.supabase;
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
      s.onload = resolve; s.onerror = reject; document.head.appendChild(s);
    });
    return window.supabase;
  }
  async function loadSocketSDK() {
    if (!SOCKET_URL) return null;
    if (window.io) return window.io;
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = `${SOCKET_URL}/socket.io/socket.io.js`;
      s.crossOrigin = 'anonymous';
      s.onload = resolve; s.onerror = reject; document.head.appendChild(s);
    });
    return window.io || null;
  }
  async function sessionToken() {
    if (!state.client) return '';
    const { data } = await state.client.auth.getSession();
    return data.session?.access_token || '';
  }
  function dispatchMessage(message, source = 'realtime') {
    if (!message?.conversation_id) return;
    if (remember(messageKey(message))) return;
    const cb = state.callbacks.get(message.conversation_id);
    try { cb?.(message); } catch {}
    emit('message', { ...message, _hichki_source: source });
    if (message.sender_id !== state.user?.id) markDelivered(message.id).catch(() => {});
  }
  async function ensureSocket(force = false) {
    if (!SOCKET_URL || !state.user || !state.client || !state.online) return null;
    if (state.socket?.connected && !force) return state.socket;
    if (state.socketConnecting && !force) return state.socketConnecting;
    state.socketConnecting = (async () => {
      try {
        const io = await loadSocketSDK();
        const token = await sessionToken();
        if (!io || !token) return null;
        if (state.socket) { try { state.socket.removeAllListeners(); state.socket.disconnect(); } catch {} }
        const socket = io(SOCKET_URL, {
          auth: { token },
          transports: ['websocket', 'polling'],
          upgrade: true,
          reconnection: true,
          reconnectionAttempts: Infinity,
          reconnectionDelay: 600,
          reconnectionDelayMax: 5000,
          timeout: 10000,
          withCredentials: false,
        });
        state.socket = socket;
        socket.on('connect', () => {
          state.socketReady = true;
          emit('socket', { status: 'connected', id: socket.id });
          for (const conversationId of state.channels.keys()) socket.emit('conversation:join', { conversationId });
        });
        socket.on('disconnect', reason => { state.socketReady = false; emit('socket', { status: 'disconnected', reason }); });
        socket.on('connect_error', error => { state.socketReady = false; emit('socket-error', { code: 'connect_error', message: error?.message || String(error) }); });
        socket.on('message', payload => dispatchMessage(payload?.message || payload, 'socket'));
        socket.on('receipt', payload => emit('receipt', { ...(payload?.receipt || payload), _hichki_source: 'socket' }));
        socket.on('typing', payload => emit('typing', { ...(payload || {}), _hichki_source: 'socket' }));
        socket.on('presence', payload => emit('presence', { ...(payload || {}), _hichki_source: 'socket' }));
        socket.on('presence:join', payload => emit('presence-join', payload));
        socket.on('presence:leave', payload => emit('presence-leave', payload));
        return socket;
      } catch (error) {
        emit('socket-error', { code: 'init_failed', message: error?.message || String(error) });
        return null;
      } finally {
        state.socketConnecting = null;
      }
    })();
    return state.socketConnecting;
  }
  async function init() {
    if (state.client) return state.client;
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) { emit('realtime-error', { code: 'missing_config' }); return null; }
    try {
      const sdk = await loadSupabaseSDK();
      state.client = sdk.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
        realtime: { params: { eventsPerSecond: 20 } },
      });
      const { data } = await state.client.auth.getSession();
      state.user = data.session?.user || null;
      state.client.auth.onAuthStateChange((event, session) => {
        state.user = session?.user || null;
        emit('auth', { user: state.user, event });
        if (state.user) {
          flush();
          if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN' || !state.socket?.connected) ensureSocket(event === 'TOKEN_REFRESHED').catch(() => {});
        } else if (state.socket) {
          try { state.socket.disconnect(); } catch {}
          state.socket = null; state.socketReady = false;
        }
      });
      emit('ready', { user: state.user, socketConfigured: Boolean(SOCKET_URL) });
      if (state.user) { flush(); ensureSocket().catch(() => {}); }
      return state.client;
    } catch (error) {
      emit('realtime-error', { code: 'init_failed', error });
      return null;
    }
  }
  async function signIn(email, password) { const c = await init(); if (!c) throw Error('Hichki backend is not configured'); return c.auth.signInWithPassword({ email, password }); }
  async function signUp(email, password, displayName = '') { const c = await init(); if (!c) throw Error('Hichki backend is not configured'); return c.auth.signUp({ email, password, options: { data: { display_name: displayName } } }); }
  async function signOut() {
    const c = await init(); if (!c) return;
    if (state.socket) { try { state.socket.disconnect(); } catch {} state.socket = null; state.socketReady = false; }
    for (const [, ch] of state.channels) await c.removeChannel(ch);
    state.channels.clear(); state.callbacks.clear();
    return c.auth.signOut();
  }
  async function directConversation(otherUserId) {
    const c = await init(); if (!c || !state.user) throw Error('not_authenticated');
    const { data, error } = await c.functions.invoke('hichki-conversation-v3', { body: { other_user_id: otherUserId } });
    if (error) throw error; if (!data?.conversation_id) throw Error(data?.error || 'conversation_create_failed'); return data.conversation_id;
  }
  async function notifyPush(conversationId, message) {
    try {
      const c = state.client; if (!c) return;
      await c.functions.invoke('hichki-push-v3', { body: { conversation_id: conversationId, title: message?.sender_name || 'Hichki', body: message?.content || 'New message', data: { conversation_id: conversationId, message_id: message?.id || '' } } });
    } catch (error) { emit('push-error', { error }); }
  }
  async function relayMessage(message) {
    if (!message?.conversation_id) return;
    const socket = await ensureSocket();
    if (socket?.connected) socket.emit('message:relay', { conversationId: message.conversation_id, messageId: message.id });
  }
  async function insertMessage(item) {
    const c = state.client;
    const { data, error } = await c.from('chat_messages').insert(item).select().single();
    if (error) return { data: item, error, queued: true };
    remember(messageKey(data));
    emit('message-sent', data);
    relayMessage(data).catch(() => {});
    notifyPush(item.conversation_id, data);
    return { data, queued: false, error: null };
  }
  async function sendMessage(conversationId, content, kind = 'text', meta = {}) {
    const c = await init(); if (!c || !state.user) throw Error('not_authenticated');
    const text = String(content ?? '').trim(); if (!text && kind === 'text') throw Error('empty_message');
    const item = { client_id: uuid(), conversation_id: conversationId, content: String(content ?? ''), kind, meta, sender_id: state.user.id, created_at: new Date().toISOString() };
    if (!state.online) { await queuePut(item); emit('message-queued', item); return { data: item, queued: true, error: null }; }
    const result = await insertMessage(item);
    if (result.error) { await queuePut(item); emit('message-queued', { ...item, error: result.error }); }
    return result;
  }
  async function flush() {
    if (state.flushing || !state.online || !state.user) return;
    state.flushing = true;
    try {
      if (!state.client) await init(); if (!state.client) return;
      for (const item of await queueAll()) {
        const result = await insertMessage(item);
        if (!result.error || /duplicate|unique/i.test(result.error.message || '')) await queueDelete(item.client_id);
        else emit('message-retry-needed', { item, error: result.error });
      }
    } finally { state.flushing = false; }
  }
  async function relayReceipt(receipt) {
    const socket = await ensureSocket();
    if (socket?.connected) socket.emit('receipt:relay', { conversationId: receipt.conversation_id, messageId: receipt.message_id });
  }
  async function receiptContext(messageId) {
    const c = state.client;
    const { data } = await c.from('chat_messages').select('conversation_id').eq('id', messageId).maybeSingle();
    return data?.conversation_id || null;
  }
  async function markRead(messageId) {
    const c = await init(); if (!c || !state.user) throw Error('not_authenticated');
    const now = new Date().toISOString();
    const { data, error } = await c.from('message_receipts').upsert({ message_id: messageId, user_id: state.user.id, read_at: now, updated_at: now }, { onConflict: 'message_id,user_id' }).select().single();
    if (error) throw error;
    const conversationId = await receiptContext(messageId);
    emit('read', { messageId, userId: state.user.id });
    if (conversationId) relayReceipt({ ...data, conversation_id: conversationId }).catch(() => {});
  }
  async function markDelivered(messageId) {
    if (!messageId) return;
    const c = await init(); if (!c || !state.user) throw Error('not_authenticated');
    const now = new Date().toISOString();
    const { data, error } = await c.from('message_receipts').upsert({ message_id: messageId, user_id: state.user.id, delivered_at: now, updated_at: now }, { onConflict: 'message_id,user_id' }).select().single();
    if (error) throw error;
    const conversationId = await receiptContext(messageId);
    if (conversationId) relayReceipt({ ...data, conversation_id: conversationId }).catch(() => {});
  }
  async function subscribe(conversationId, callback) {
    const c = await init(); if (!c) throw Error('backend_not_configured');
    state.callbacks.set(conversationId, callback);
    if (state.channels.has(conversationId)) { const socket = await ensureSocket(); if (socket?.connected) socket.emit('conversation:join', { conversationId }); return state.channels.get(conversationId); }
    const channel = c.channel(`hichki:conversation:${conversationId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `conversation_id=eq.${conversationId}` }, payload => dispatchMessage(payload.new, 'supabase'))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'message_receipts' }, payload => emit('receipt', { ...payload.new, _hichki_source: 'supabase' }))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'message_receipts' }, payload => emit('receipt', { ...payload.new, _hichki_source: 'supabase' }))
      .on('broadcast', { event: 'typing' }, payload => emit('typing', { ...payload.payload, _hichki_source: 'supabase' }))
      .on('presence', { event: 'sync' }, () => emit('presence', { state: channel.presenceState(), _hichki_source: 'supabase' }))
      .on('presence', { event: 'join' }, p => emit('presence-join', p))
      .on('presence', { event: 'leave' }, p => emit('presence-leave', p));
    await channel.subscribe(async status => {
      if (status === 'SUBSCRIBED' && state.user) await channel.track({ user_id: state.user.id, online_at: new Date().toISOString() });
      emit('channel', { conversationId, status });
    });
    state.channels.set(conversationId, channel);
    const socket = await ensureSocket(); if (socket?.connected) socket.emit('conversation:join', { conversationId });
    return channel;
  }
  async function setTyping(conversationId, isTyping) {
    const ch = state.channels.get(conversationId); if (!state.user) return;
    const payload = { user_id: state.user.id, is_typing: Boolean(isTyping), at: Date.now() };
    const socket = await ensureSocket();
    if (socket?.connected) socket.emit('typing', { conversationId, ...payload });
    if (ch) await ch.send({ type: 'broadcast', event: 'typing', payload });
  }
  async function unsubscribe(conversationId) {
    const c = state.client, ch = state.channels.get(conversationId);
    state.callbacks.delete(conversationId);
    if (state.socket?.connected) state.socket.emit('conversation:leave', { conversationId });
    if (c && ch) { await c.removeChannel(ch); state.channels.delete(conversationId); }
  }
  async function registerPushToken(token, platform = 'web', deviceId = uuid()) {
    const c = await init(); if (!c || !state.user) throw Error('not_authenticated');
    const { error } = await c.from('push_subscriptions').upsert({ user_id: state.user.id, token, platform, device_id: deviceId, updated_at: new Date().toISOString() }, { onConflict: 'user_id,device_id' });
    if (error) throw error; emit('push-registered', { platform, deviceId });
  }
  function on(fn) { state.listeners.add(fn); return () => state.listeners.delete(fn); }
  window.HichkiRealtime = {
    init, signIn, signUp, signOut, directConversation, sendMessage, flush, subscribe, unsubscribe, setTyping,
    markRead, markDelivered, registerPushToken, ensureSocket, on,
    get user() { return state.user; }, get online() { return state.online; }, get socketConnected() { return Boolean(state.socket?.connected); }
  };
  window.addEventListener('online', () => { state.online = true; emit('online'); flush(); ensureSocket().catch(() => {}); });
  window.addEventListener('offline', () => { state.online = false; emit('offline'); try { state.socket?.disconnect(); } catch {} });
  window.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { flush(); ensureSocket().catch(() => {}); } });
  init().catch(() => {});
})();
