/* Hichki local-first Notes + Music library v1. Syncs through owner-scoped Supabase RLS when authenticated. */
(() => {
  'use strict';
  const DB = 'hichki-library-v1';
  const STORE = 'items';
  const state = { syncing: false, listeners: new Set() };
  const emit = (type, detail = {}) => {
    window.dispatchEvent(new CustomEvent(`hichki:library-${type}`, { detail }));
    state.listeners.forEach(fn => { try { fn(type, detail); } catch {} });
  };
  const uuid = () => crypto.randomUUID();
  const now = () => new Date().toISOString();
  const cleanText = value => String(value ?? '').trim();
  const cleanUrl = value => {
    const raw = cleanText(value);
    if (!raw) return '';
    try {
      const u = new URL(raw, location.href);
      if (!['http:', 'https:', 'blob:'].includes(u.protocol)) return '';
      return u.href;
    } catch { return ''; }
  };
  function openDB() {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) return resolve(null);
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: 'id' });
          store.createIndex('item_type', 'item_type', { unique: false });
          store.createIndex('updated_at', 'updated_at', { unique: false });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  async function putLocal(item) {
    const db = await openDB(); if (!db) return item;
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite'); tx.objectStore(STORE).put(item);
      tx.oncomplete = resolve; tx.onerror = () => reject(tx.error);
    });
    return item;
  }
  async function deleteLocal(id) {
    const db = await openDB(); if (!db) return;
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite'); tx.objectStore(STORE).delete(id);
      tx.oncomplete = resolve; tx.onerror = () => reject(tx.error);
    });
  }
  async function allLocal() {
    const db = await openDB(); if (!db) return [];
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly'); const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => resolve(req.result || []); req.onerror = () => reject(req.error);
    });
  }
  async function getLocal(id) {
    const db = await openDB(); if (!db) return null;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly'); const req = tx.objectStore(STORE).get(id);
      req.onsuccess = () => resolve(req.result || null); req.onerror = () => reject(req.error);
    });
  }
  const baseItem = input => {
    const type = input?.item_type === 'music' ? 'music' : 'note';
    const at = now();
    return {
      id: input?.id || uuid(),
      owner_id: input?.owner_id || window.HichkiRealtime?.user?.id || null,
      item_type: type,
      title: cleanText(input?.title) || (type === 'music' ? 'Untitled track' : 'Untitled note'),
      body: cleanText(input?.body),
      url: cleanUrl(input?.url),
      cover_url: cleanUrl(input?.cover_url || input?.cover),
      metadata: input?.metadata && typeof input.metadata === 'object' ? input.metadata : {},
      created_at: input?.created_at || at,
      updated_at: at,
      _dirty: true,
      _deleted: false,
    };
  };
  async function save(input) {
    const existing = input?.id ? await getLocal(input.id) : null;
    const item = baseItem({ ...existing, ...input, created_at: existing?.created_at || input?.created_at });
    await putLocal(item); emit('changed', item); sync().catch(() => {}); return item;
  }
  const addNote = ({ title = '', body = '', tags = [], metadata = {} } = {}) => save({ item_type: 'note', title, body, metadata: { ...metadata, tags: Array.isArray(tags) ? tags.slice(0, 20).map(cleanText).filter(Boolean) : [] } });
  const addMusic = ({ title = '', artist = '', url = '', cover = '', album = '', metadata = {} } = {}) => {
    const normalizedUrl = cleanUrl(url); if (!normalizedUrl) throw Error('valid_music_url_required');
    return save({ item_type: 'music', title, url: normalizedUrl, cover_url: cover, metadata: { ...metadata, artist: cleanText(artist), album: cleanText(album) } });
  };
  async function remove(id) {
    const item = await getLocal(id); if (!item) return false;
    await putLocal({ ...item, _dirty: true, _deleted: true, updated_at: now() });
    emit('changed', { id, deleted: true }); sync().catch(() => {}); return true;
  }
  async function list(type = null) {
    const items = (await allLocal()).filter(item => !item._deleted && (!type || item.item_type === type));
    return items.sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)));
  }
  async function remoteClient() {
    const rt = window.HichkiRealtime; if (!rt) return null;
    const client = await rt.init();
    return client && rt.user ? { client, user: rt.user } : null;
  }
  const remoteShape = (item, ownerId) => ({
    id: item.id, owner_id: ownerId, item_type: item.item_type, title: item.title || '', body: item.body || '',
    url: item.url || null, cover_url: item.cover_url || null, metadata: item.metadata || {}, created_at: item.created_at, updated_at: item.updated_at,
  });
  async function sync() {
    if (state.syncing || !navigator.onLine) return;
    const remote = await remoteClient(); if (!remote) return;
    state.syncing = true; emit('sync', { status: 'started' });
    try {
      const local = await allLocal();
      for (const item of local.filter(x => x._dirty)) {
        if (item._deleted) {
          const { error } = await remote.client.from('library_items').delete().eq('id', item.id).eq('owner_id', remote.user.id);
          if (error) throw error;
          await deleteLocal(item.id);
        } else {
          const shaped = remoteShape(item, remote.user.id);
          const { data, error } = await remote.client.from('library_items').upsert(shaped, { onConflict: 'id' }).select().single();
          if (error) throw error;
          await putLocal({ ...data, _dirty: false, _deleted: false });
        }
      }
      const { data, error } = await remote.client.from('library_items').select('id,owner_id,item_type,title,body,url,cover_url,metadata,created_at,updated_at').eq('owner_id', remote.user.id).order('updated_at', { ascending: false }).limit(500);
      if (error) throw error;
      const current = await allLocal(); const dirtyIds = new Set(current.filter(x => x._dirty).map(x => x.id));
      for (const item of data || []) if (!dirtyIds.has(item.id)) await putLocal({ ...item, _dirty: false, _deleted: false });
      emit('sync', { status: 'complete', count: (data || []).length });
    } catch (error) {
      emit('sync', { status: 'error', error });
      throw error;
    } finally { state.syncing = false; }
  }
  async function shareToChat(id, conversationId) {
    const item = await getLocal(id); if (!item || item._deleted) throw Error('library_item_not_found');
    const rt = window.HichkiRealtime; if (!rt) throw Error('realtime_bridge_missing');
    const meta = { hichki_library: { id: item.id, item_type: item.item_type, title: item.title, body: item.body, url: item.url, cover_url: item.cover_url, metadata: item.metadata } };
    const content = item.item_type === 'music' ? `${item.title}${item.metadata?.artist ? ` — ${item.metadata.artist}` : ''}${item.url ? `\n${item.url}` : ''}` : (item.body || item.title);
    return rt.sendMessage(conversationId, content, item.item_type, meta);
  }
  async function saveFromMessage(message) {
    const payload = message?.meta?.hichki_library; if (!payload) throw Error('message_has_no_library_item');
    return save({ ...payload, id: undefined, owner_id: undefined, metadata: { ...(payload.metadata || {}), imported_from_message: message.id || null } });
  }
  async function externalShare(id) {
    const item = await getLocal(id); if (!item || item._deleted) throw Error('library_item_not_found');
    const text = item.item_type === 'music' ? [item.title, item.metadata?.artist, item.url].filter(Boolean).join(' — ') : [item.title, item.body].filter(Boolean).join('\n');
    if (navigator.share) { await navigator.share({ title: item.title, text, url: item.url || undefined }); return { shared: true, method: 'share' }; }
    if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); return { shared: true, method: 'clipboard' }; }
    return { shared: false, method: 'unsupported', text };
  }
  function looksLikeMusic(url = '', text = '') {
    const value = `${url} ${text}`.toLowerCase();
    return /\.(mp3|m4a|aac|wav|ogg|opus|flac)(\?|#|$)/.test(value) || /(spotify\.com|music\.youtube\.com|soundcloud\.com|music\.apple\.com)/.test(value);
  }
  async function ingestShareTarget() {
    const params = new URLSearchParams(location.search);
    if (params.get('hichki_share') !== '1') return null;
    const title = cleanText(params.get('title'));
    const text = cleanText(params.get('text'));
    const url = cleanUrl(params.get('url'));
    const item = looksLikeMusic(url, text)
      ? await addMusic({ title: title || 'Shared music', url: url || (text.match(/https?:\/\/\S+/)?.[0] || ''), metadata: { source: 'share_target', shared_text: text } })
      : await addNote({ title: title || 'Shared to Hichki', body: [text, url].filter(Boolean).join('\n'), metadata: { source: 'share_target' } });
    params.delete('hichki_share'); params.delete('title'); params.delete('text'); params.delete('url');
    const query = params.toString(); history.replaceState({}, '', `${location.pathname}${query ? `?${query}` : ''}${location.hash}`);
    emit('incoming', item); return item;
  }
  function on(fn) { state.listeners.add(fn); return () => state.listeners.delete(fn); }
  window.HichkiLibrary = { save, addNote, addMusic, remove, list, sync, shareToChat, saveFromMessage, externalShare, ingestShareTarget, on };
  window.addEventListener('online', () => sync().catch(() => {}));
  window.addEventListener('hichki:auth', () => sync().catch(() => {}));
  const boot = () => { ingestShareTarget().catch(error => emit('incoming-error', { error })); sync().catch(() => {}); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
})();
