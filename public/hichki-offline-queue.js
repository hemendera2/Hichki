/* Additive reliability layer. Depends on the existing HichkiRealtime bridge. */
(() => {
  const KEY = 'hichki.pendingMessages.v2';
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } };
  const write = (items) => localStorage.setItem(KEY, JSON.stringify(items.slice(-200)));
  const flush = async () => {
    if (!window.HichkiRealtime) return { sent: 0, remaining: read().length };
    const items = read(); if (!items.length) return { sent: 0, remaining: 0 };
    const remaining = []; let sent = 0;
    for (const item of items) {
      try { await window.HichkiRealtime.send(item.conversation_id, item.content, item.meta || {}); sent++; }
      catch (error) { remaining.push(item); break; }
    }
    write(remaining); window.dispatchEvent(new CustomEvent('hichki:offline-flush', { detail: { sent, remaining: remaining.length } }));
    return { sent, remaining: remaining.length };
  };
  window.HichkiOfflineQueue = Object.freeze({ enqueue(item) { write([...read(), item]); }, pendingCount() { return read().length; }, flush });
  window.addEventListener('online', () => void flush());
})();
