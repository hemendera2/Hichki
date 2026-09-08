/* Hichki UI-neutral offline adapter. Existing app can opt in without replacing its state model. */
(() => {
  'use strict';
  const KEY = 'hichki.pending.ui.v1';
  const ownerId = () => window.HichkiRealtime?.user?.id || null;
  const read = () => { try { const value = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(value) ? value : []; } catch { return []; } };
  const write = value => { try { localStorage.setItem(KEY, JSON.stringify(value.slice(-100))); } catch {} };
  const queue = payload => {
    const uid = ownerId();
    if (!uid) throw Error('not_authenticated');
    const items = read();
    items.push({ ...payload, owner_id: uid, queued_at: new Date().toISOString() });
    write(items);
    window.dispatchEvent(new CustomEvent('hichki:ui-message-queued', { detail: payload }));
  };
  const flush = async () => {
    const api = window.HichkiRealtime;
    const uid = api?.user?.id || null;
    if (!api || !uid) return;
    const items = read();
    if (!items.length) return;
    const remaining = [];
    let attempted = 0;
    for (const item of items) {
      // Never replay another account's queue. Legacy ownerless entries are
      // deliberately quarantined instead of being guessed/claimed by a user.
      if (item?.owner_id !== uid) { remaining.push(item); continue; }
      attempted += 1;
      try {
        const result = await api.sendMessage(item.conversation_id, item.content, item.kind || 'text', item.meta || {});
        if (result?.queued) remaining.push(item);
      } catch {
        remaining.push(item);
      }
    }
    write(remaining);
    if (attempted > 0 && !remaining.some(item => item?.owner_id === uid)) {
      window.dispatchEvent(new Event('hichki:ui-queue-empty'));
    }
  };
  window.HichkiOfflineQueue = {
    queue,
    flush,
    pending: () => {
      const uid = ownerId();
      return uid ? read().filter(item => item?.owner_id === uid).length : 0;
    },
  };
  window.addEventListener('online', flush);
  window.addEventListener('hichki:auth', flush);
})();
