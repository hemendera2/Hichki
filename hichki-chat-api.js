/* UI-neutral Hichki data helpers. Uses the same authenticated Supabase client as hichki-realtime.js. */
(() => {
  'use strict';
  const api = () => window.HichkiRealtime;
  const client = async () => { const rt = api(); if (!rt) throw Error('realtime_bridge_missing'); const c = await rt.init(); if (!c || !rt.user) throw Error('not_authenticated'); return c; };
  async function listPeople(search = '', limit = 30) {
    const c = await client(); let q = c.from('profiles').select('id,display_name,avatar_url,created_at').limit(Math.min(Math.max(limit,1),50)).order('display_name');
    if (search.trim()) q = q.ilike('display_name', `%${search.trim().replace(/[%_]/g,'') }%`);
    const { data, error } = await q; if (error) throw error; return data || [];
  }
  async function listMessages(conversationId, before = null, limit = 50) {
    const c = await client(); let q = c.from('chat_messages').select('id,conversation_id,sender_id,client_id,content,kind,meta,created_at,edited_at,deleted_at').eq('conversation_id',conversationId).order('created_at',{ascending:false}).limit(Math.min(Math.max(limit,1),100));
    if (before) q = q.lt('created_at', before);
    const { data, error } = await q; if (error) throw error; return (data || []).reverse();
  }
  async function listReceipts(messageIds) {
    const c = await client(); if (!messageIds?.length) return [];
    const { data, error } = await c.from('message_receipts').select('message_id,user_id,delivered_at,read_at,updated_at').in('message_id',messageIds.slice(0,100)); if (error) throw error; return data || [];
  }
  async function listMyConversations(limit = 50) {
    const c = await client(); const { data: memberships, error } = await c.from('conversation_members').select('conversation_id,created_at').eq('user_id',api().user.id).limit(Math.min(Math.max(limit,1),100)); if (error) throw error; if (!memberships?.length) return [];
    const ids = memberships.map(x=>x.conversation_id); const { data: conversations, error: ce } = await c.from('conversations').select('id,kind,created_at,updated_at').in('id',ids).order('updated_at',{ascending:false}); if (ce) throw ce; return conversations || [];
  }
  window.HichkiChatAPI = { listPeople, listMessages, listReceipts, listMyConversations };
})();
