/* Compatibility facade: HichkiRealtime is the single owner of offline retry state. */
(() => {
  'use strict';
  async function queue(payload){
    const api=window.HichkiRealtime;if(!api)throw Error('realtime_bridge_missing');
    return api.sendMessage(payload.conversation_id,payload.content,payload.kind||'text',payload.meta||{},payload.client_id||null);
  }
  async function flush(){return window.HichkiRealtime?.flush()}
  async function pending(){return window.HichkiRealtime?.pendingCount?.()||0}
  window.HichkiOfflineQueue={queue,flush,pending};
})();
