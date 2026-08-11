/* Hichki UI-neutral offline adapter. Existing app can opt in without replacing its state model. */
(() => {
  'use strict';
  const KEY = 'hichki.pending.ui.v1';
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } };
  const write = value => { try { localStorage.setItem(KEY, JSON.stringify(value.slice(-100))); } catch {} };
  const queue = (payload) => { const items = read(); items.push({ ...payload, queued_at: new Date().toISOString() }); write(items); window.dispatchEvent(new CustomEvent('hichki:ui-message-queued', { detail: payload })); };
  const flush = async () => {
    const api = window.HichkiRealtime; if (!api || !api.user) return;
    const items = read(); if (!items.length) return;
    const remaining = [];
    for (const item of items) {
      try { const result = await api.sendMessage(item.conversation_id, item.content, item.kind || 'text', item.meta || {}); if (result?.queued) remaining.push(item); }
      catch { remaining.push(item); }
    }
    write(remaining); if (!remaining.length) window.dispatchEvent(new Event('hichki:ui-queue-empty'));
  };
  window.HichkiOfflineQueue = { queue, flush, pending: () => read().length };
  window.addEventListener('online', flush);
  window.addEventListener('hichki:auth', flush);
})();
