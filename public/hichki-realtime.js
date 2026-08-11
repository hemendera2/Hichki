/* Hichki realtime bridge v1 — additive integration layer for the existing product. */
(() => {
  const SUPABASE_URL = 'https://mzfwevtiydprksuwalpt.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_ME8_OdUUnXLhahBzdMKiIQ_o-I1WVDW';
  let clientPromise;

  const loadClient = async () => {
    if (!clientPromise) {
      clientPromise = import('https://esm.sh/@supabase/supabase-js@2').then(({ createClient }) =>
        createClient(SUPABASE_URL, SUPABASE_KEY, {
          auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
        })
      );
    }
    return clientPromise;
  };

  const clientId = () => `${crypto.randomUUID()}-${Date.now().toString(36)}`;

  window.HichkiRealtime = Object.freeze({
    async client() { return loadClient(); },
    async session() { const c = await loadClient(); return c.auth.getSession(); },
    async signUp(email, password, displayName = '') {
      const c = await loadClient();
      const result = await c.auth.signUp({ email, password, options: { data: { display_name: displayName.trim() } } });
      if (!result.error && result.data.user) {
        await c.from('profiles').upsert({ id: result.data.user.id, display_name: displayName.trim() || email.split('@')[0] });
      }
      return result;
    },
    async signIn(email, password) { const c = await loadClient(); return c.auth.signInWithPassword({ email, password }); },
    async signOut() { const c = await loadClient(); return c.auth.signOut(); },
    async currentUser() { const c = await loadClient(); const { data } = await c.auth.getUser(); return data.user ?? null; },
    async profile(userId) {
      const c = await loadClient();
      const { data, error } = await c.from('profiles').select('id,display_name,avatar_url').eq('id', userId).maybeSingle();
      return { data, error };
    },
    async findProfiles(search = '', limit = 20) {
      const c = await loadClient();
      const q = search.trim();
      let query = c.from('profiles').select('id,display_name,avatar_url').order('display_name').limit(limit);
      if (q) query = query.ilike('display_name', `%${q.replace(/[%_]/g, '\\$&')}%`);
      return query;
    },
    async directConversation(otherUserId) {
      const c = await loadClient();
      const { data: { session } } = await c.auth.getSession();
      if (!session) throw new Error('not_authenticated');
      const { data, error } = await c.functions.invoke('hichki-conversation-v1', { body: { other_user_id: otherUserId } });
      if (error) throw error;
      if (!data?.conversation_id) throw new Error('conversation_create_failed');
      return data.conversation_id;
    },
    async messages(conversationId, limit = 100) {
      const c = await loadClient();
      return c.from('chat_messages').select('id,client_id,conversation_id,sender_id,content,kind,meta,created_at,edited_at,deleted_at').eq('conversation_id', conversationId).order('created_at', { ascending: true }).limit(limit);
    },
    async send(conversationId, content, meta = {}) {
      const c = await loadClient();
      const { data: { user } } = await c.auth.getUser();
      if (!user) throw new Error('not_authenticated');
      const value = String(content ?? '').trim();
      if (!value) throw new Error('empty_message');
      const payload = { client_id: clientId(), conversation_id: conversationId, sender_id: user.id, content: value, kind: 'text', meta };
      const { data, error } = await c.from('chat_messages').insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    async subscribe(conversationId, onMessage) {
      const c = await loadClient();
      const channel = c.channel(`hichki:conversation:${conversationId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `conversation_id=eq.${conversationId}` }, payload => onMessage(payload.new))
        .subscribe();
      return () => { c.removeChannel(channel); };
    },
    async presence(conversationId, userId, onSync) {
      const c = await loadClient();
      const channel = c.channel(`hichki:presence:${conversationId}`, { config: { presence: { key: userId } } });
      channel.on('presence', { event: 'sync' }, () => onSync(channel.presenceState())).on('presence', { event: 'join' }, () => onSync(channel.presenceState())).on('presence', { event: 'leave' }, () => onSync(channel.presenceState()));
      await channel.subscribe(async status => { if (status === 'SUBSCRIBED') await channel.track({ online_at: new Date().toISOString() }); });
      return () => { c.removeChannel(channel); };
    },
    async registerPushToken(token, platform, deviceId) {
      const c = await loadClient();
      const { data: { user } } = await c.auth.getUser();
      if (!user || !token) return { data: null, error: new Error('not_authenticated') };
      return c.from('push_subscriptions').upsert({ user_id: user.id, token, platform, device_id: deviceId }, { onConflict: 'user_id,device_id' });
    },
  });
})();
