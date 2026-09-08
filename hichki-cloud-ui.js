/* Hichki authenticated UI adapter v1. Keeps the existing Hichki surfaces while binding them to the governed realtime backend. */
(() => {
  'use strict';

  const state = {
    client: null,
    user: null,
    booted: false,
    activeConversationId: null,
    subscriptions: new Map(),
    peerPresence: new Map(),
    typingTimers: new Map(),
    inputTypingTimer: null,
    original: {},
  };
  const uuid = () => crypto.randomUUID();
  const RT = () => window.HichkiRealtime;
  const isRemote = p => Boolean(p?.remoteCloud && p?.conversationId && p?.peerUserId && p?.ownerId);
  const activeRemote = () => typeof A !== 'undefined' && A && isRemote(A) ? A : null;
  const safeToast = msg => { try { toast(msg); } catch { console.info(msg); } };
  const colorFor = id => {
    const palette = ['#FFBC94','#F7BBD8','#8BE3AE','#FFD93D','#CFC8F7','#A6D8F0','#FFA69E'];
    let n = 0; for (const ch of String(id || '')) n = ((n * 31) + ch.charCodeAt(0)) >>> 0;
    return palette[n % palette.length];
  };
  const currentMessageList = p => p ? notes(p.id) : [];
  const messageClientId = m => m?.clientId || m?.client_id || '';
  const messageServerId = m => m?.serverId || m?.idRemote || '';
  const messageTime = m => Number(m?.t || 0);

  function cloudPrefs() {
    DB.cloud = DB.cloud || { hidden: {} };
    DB.cloud.hidden = DB.cloud.hidden || {};
    return DB.cloud;
  }
  function hiddenFor(ownerId, peerId) {
    return Boolean(cloudPrefs().hidden?.[ownerId]?.[peerId]);
  }
  function setHidden(ownerId, peerId, hidden) {
    const cloud = cloudPrefs();
    cloud.hidden[ownerId] = cloud.hidden[ownerId] || {};
    if (hidden) cloud.hidden[ownerId][peerId] = true;
    else delete cloud.hidden[ownerId][peerId];
    save();
  }
  function nextLocalId() {
    const ids = (DB.circle || []).map(p => Number(p.id)).filter(Number.isFinite);
    return Math.max(0, ...ids, Number(idCounter || 0)) + 1;
  }
  function pruneForeignRemote(ownerId) {
    if (!DB?.circle) return;
    const removed = DB.circle.filter(p => p.remoteCloud && p.ownerId !== ownerId);
    if (!removed.length) return;
    for (const p of removed) delete DB.notes[p.id];
    DB.circle = DB.circle.filter(p => !(p.remoteCloud && p.ownerId !== ownerId));
    if (typeof A !== 'undefined' && A?.remoteCloud && A.ownerId !== ownerId) A = null;
    save();
  }
  function remotePersonByConversation(conversationId) {
    return (DB.circle || []).find(p => p.remoteCloud && p.ownerId === state.user?.id && p.conversationId === conversationId) || null;
  }
  function remotePersonByPeer(peerUserId) {
    return (DB.circle || []).find(p => p.remoteCloud && p.ownerId === state.user?.id && p.peerUserId === peerUserId) || null;
  }
  function upsertRemotePerson(peer, conversationId) {
    let p = remotePersonByPeer(peer.id);
    if (!p) {
      p = {
        id: nextLocalId(), n: peer.display_name || 'Hichki user', who: 'inner circle',
        c: colorFor(peer.id), addedAt: Date.now(), remoteCloud: true,
        ownerId: state.user.id, peerUserId: peer.id, conversationId,
      };
      DB.circle.push(p);
      idCounter = Math.max(Number(idCounter || 0), Number(p.id) + 1);
    } else {
      p.n = peer.display_name || p.n || 'Hichki user';
      p.conversationId = conversationId;
      p.ownerId = state.user.id;
      p.remoteCloud = true;
    }
    save();
    return p;
  }

  async function ensureProfile() {
    if (!state.client || !state.user) return;
    const displayName = String(state.user.user_metadata?.display_name || DB?.me?.name || state.user.email?.split('@')[0] || 'Hichki user').trim().slice(0, 80) || 'Hichki user';
    const { error } = await state.client.from('profiles').upsert({ id: state.user.id, display_name: displayName, updated_at: new Date().toISOString() }, { onConflict: 'id' });
    if (error) console.warn('Hichki profile sync:', error.message || error);
  }

  async function syncCircle() {
    if (!state.client || !state.user || !DB) return;
    pruneForeignRemote(state.user.id);
    const { data: rows, error } = await state.client.from('conversation_members').select('conversation_id,user_id,created_at').limit(200);
    if (error) throw error;
    const byConversation = new Map();
    for (const row of rows || []) {
      if (!byConversation.has(row.conversation_id)) byConversation.set(row.conversation_id, []);
      byConversation.get(row.conversation_id).push(row.user_id);
    }
    const peers = [];
    for (const [conversationId, ids] of byConversation) {
      if (!ids.includes(state.user.id)) continue;
      const peerId = ids.find(id => id !== state.user.id);
      if (peerId && !hiddenFor(state.user.id, peerId)) peers.push({ conversationId, peerId });
    }
    const peerIds = [...new Set(peers.map(x => x.peerId))];
    let profiles = [];
    if (peerIds.length) {
      const q = await state.client.from('profiles').select('id,display_name,avatar_url').in('id', peerIds);
      if (q.error) throw q.error;
      profiles = q.data || [];
    }
    const map = new Map(profiles.map(p => [p.id, p]));
    for (const item of peers) {
      const person = upsertRemotePerson(map.get(item.peerId) || { id: item.peerId, display_name: 'Hichki user' }, item.conversationId);
      await subscribePerson(person);
      hydrateConversation(person).catch(error => console.warn('Hichki history:', error.message || error));
    }
    try { home(); } catch {}
  }

  function wireToLocal(message) {
    const mine = message.sender_id === state.user?.id;
    const kind = message.kind || 'text';
    const lib = message.meta?.hichki_library || {};
    const media = message.meta?.hichki_media || null;
    const base = {
      s: mine ? 'm' : 't',
      k: 'text', x: message.content || '', t: Date.parse(message.created_at || '') || Date.now(),
      clientId: message.client_id || '', serverId: message.id || '', remoteCloud: true,
      status: mine ? 'sent' : 'received', meta: message.meta || {},
    };
    if (kind === 'note') Object.assign(base, { k: 'note', title: lib.title || 'Shared note', text: lib.body || message.content || '', mood: lib.metadata?.mood || '#FFD93D', noteId: 0 });
    else if (kind === 'music') Object.assign(base, { k: 'song', title: lib.title || 'Shared music', artist: lib.metadata?.artist || '', url: lib.url || '', c: '#CFC8F7', songId: 0 });
    else if (kind === 'image') Object.assign(base, { k: 'img', src: '', x: message.content || '', remoteMediaPath: media?.path || '' });
    else if (kind === 'video') Object.assign(base, { k: 'vid', name: media?.name || message.content || 'Video', size: media?.size ? bytes(media.size) : '', sid: `cloud-${message.id || message.client_id}`, remoteMediaPath: media?.path || '' });
    else if (kind === 'audio' || kind === 'file') Object.assign(base, { k: 'file', name: media?.name || message.content || (kind === 'audio' ? 'Audio' : 'File'), size: media?.size ? bytes(media.size) : '', remoteMediaPath: media?.path || '', remoteMime: media?.type || '' });
    return base;
  }

  async function resolveMedia(local, person) {
    if (!local?.remoteMediaPath || !RT()?.mediaUrl) return;
    try {
      const url = await RT().mediaUrl(local.remoteMediaPath);
      if (!url) return;
      if (local.k === 'img') local.src = url;
      else if (local.k === 'vid' && local.sid) sessionBlobs[local.sid] = url;
      else local.remoteUrl = url;
      save();
      if (typeof A !== 'undefined' && A?.id === person.id) draw();
    } catch (error) { console.warn('Hichki media URL:', error.message || error); }
  }

  function mergeServerMessage(person, message, redraw = true) {
    const list = currentMessageList(person);
    let i = list.findIndex(m => message.id && messageServerId(m) === message.id);
    if (i < 0 && message.client_id) i = list.findIndex(m => messageClientId(m) === message.client_id);
    const mapped = wireToLocal(message);
    if (i >= 0) list[i] = { ...list[i], ...mapped, status: list[i].status === 'read' ? 'read' : mapped.status };
    else list.push(mapped);
    list.sort((a, b) => messageTime(a) - messageTime(b));
    save();
    resolveMedia(i >= 0 ? list[i] : mapped, person);
    if (!mapped.s || mapped.s === 't') markReadIfVisible(mapped, person);
    if (redraw) {
      if (typeof A !== 'undefined' && A?.id === person.id) draw();
      else try { home(); } catch {}
    }
  }

  async function hydrateConversation(person) {
    if (!state.client || !state.user || !isRemote(person)) return;
    const { data, error } = await state.client.from('chat_messages')
      .select('id,conversation_id,sender_id,client_id,content,kind,meta,created_at,edited_at,deleted_at')
      .eq('conversation_id', person.conversationId)
      .order('created_at', { ascending: true }).limit(250);
    if (error) throw error;
    const existing = currentMessageList(person);
    const serverClientIds = new Set((data || []).map(m => m.client_id).filter(Boolean));
    const pending = existing.filter(m => m.remoteCloud && messageClientId(m) && !messageServerId(m) && !serverClientIds.has(messageClientId(m)));
    DB.notes[person.id] = [...(data || []).map(wireToLocal), ...pending].sort((a,b) => messageTime(a) - messageTime(b));
    save();
    for (const m of DB.notes[person.id]) resolveMedia(m, person);
    if (typeof A !== 'undefined' && A?.id === person.id) {
      draw();
      markConversationRead(person);
    }
  }

  async function subscribePerson(person) {
    if (!RT() || !isRemote(person) || state.subscriptions.has(person.conversationId)) return;
    try {
      const ch = await RT().subscribe(person.conversationId, message => mergeServerMessage(person, message));
      state.subscriptions.set(person.conversationId, ch || true);
    } catch (error) { console.warn('Hichki subscription:', error.message || error); }
  }

  async function markReadIfVisible(local, person) {
    if (!local?.serverId || local.s !== 't') return;
    if (document.visibilityState !== 'visible' || typeof A === 'undefined' || A?.id !== person.id) return;
    try { await RT()?.markRead(local.serverId); } catch {}
  }
  function markConversationRead(person) {
    for (const m of currentMessageList(person)) markReadIfVisible(m, person);
  }

  function serializeLocal(msg) {
    if (msg.k === 'note') return {
      kind: 'note', content: String(msg.text || msg.title || 'Shared note'),
      meta: { hichki_library: { item_type: 'note', title: msg.title || 'Shared note', body: msg.text || '', metadata: { mood: msg.mood || '' } } },
    };
    if (msg.k === 'song') return {
      kind: 'music', content: [msg.title, msg.artist, msg.url].filter(Boolean).join(' — ') || 'Shared music',
      meta: { hichki_library: { item_type: 'music', title: msg.title || 'Shared music', url: msg.url || '', metadata: { artist: msg.artist || '' } } },
    };
    return { kind: 'text', content: String(msg.x || ''), meta: msg.q ? { reply_to_local_time: msg.q } : {} };
  }

  function updateOptimistic(person, clientId, patch) {
    const m = currentMessageList(person).find(x => messageClientId(x) === clientId);
    if (!m) return;
    Object.assign(m, patch); save();
    if (typeof A !== 'undefined' && A?.id === person.id) draw();
  }

  async function sendRemoteMessage(person, msg) {
    if (!state.user || person.ownerId !== state.user.id) throw Error('not_authenticated');
    const clientId = uuid();
    if (typeof REPLY !== 'undefined' && REPLY) msg.q = REPLY.t;
    const local = { ...msg, s: 'm', t: msg.t || Date.now(), clientId, remoteCloud: true, status: navigator.onLine ? 'sending' : 'queued' };
    currentMessageList(person).push(local);
    try { cancelReply(); } catch {}
    save(); draw();
    try { playTone(880,.08); haptic('medium'); } catch {}
    const wire = serializeLocal(local);
    try {
      const result = await RT().sendMessage(person.conversationId, wire.content, wire.kind, wire.meta, clientId);
      if (result?.data?.id) mergeServerMessage(person, result.data);
      else updateOptimistic(person, clientId, { status: result?.queued ? 'queued' : 'sent' });
    } catch (error) {
      updateOptimistic(person, clientId, { status: 'failed' });
      safeToast(error?.message === 'not_authenticated' ? 'Sign in to send this note' : 'Message saved locally — retry when connected');
    }
  }

  async function sendRemoteFile(person, file, caption = '') {
    if (!state.user || !isRemote(person)) return;
    const clientId = uuid();
    const kind = file.type?.startsWith('image/') ? 'image' : file.type?.startsWith('video/') ? 'video' : file.type?.startsWith('audio/') ? 'audio' : 'file';
    const sid = `local-${clientId}`;
    const local = {
      s:'m', k: kind === 'image' ? 'img' : kind === 'video' ? 'vid' : 'file',
      x: caption, name: file.name, size: bytes(file.size), t: Date.now(), clientId,
      remoteCloud:true, status:navigator.onLine ? 'sending' : 'queued', sid,
    };
    if (kind === 'image') local.src = URL.createObjectURL(file);
    else if (kind === 'video') sessionBlobs[sid] = URL.createObjectURL(file);
    currentMessageList(person).push(local); save(); draw();
    try {
      const result = await RT().sendMedia(person.conversationId, file, { kind, content: caption || file.name || kind, clientId });
      if (result?.data?.id) mergeServerMessage(person, result.data);
      else updateOptimistic(person, clientId, { status: 'queued' });
    } catch (error) {
      updateOptimistic(person, clientId, { status: 'failed' });
      safeToast(error?.message === 'media_size_not_allowed' ? 'Files must be 25 MB or smaller' : 'Attachment queued for retry');
    }
  }

  function decorateMessageStates() {
    const person = typeof A !== 'undefined' ? A : null;
    if (!isRemote(person)) return;
    const own = currentMessageList(person).filter(m => m.s === 'm');
    const nodes = document.querySelectorAll('#panel .msg.me');
    nodes.forEach((node, i) => {
      const m = own[i]; if (!m) return;
      let s = node.querySelector('.hk-msg-state');
      if (!s) { s = document.createElement('div'); s.className = 'hk-msg-state'; node.querySelector('.wr')?.appendChild(s); }
      const label = m.status === 'read' ? 'Read' : m.status === 'delivered' ? 'Delivered' : m.status === 'queued' ? 'Queued' : m.status === 'failed' ? 'Retry needed' : m.status === 'sending' ? 'Sending…' : 'Sent';
      s.textContent = label;
      s.dataset.state = m.status || 'sent';
    });
  }

  function installMessageHooks() {
    state.original.pushMsg = pushMsg;
    pushMsg = function(msg) {
      const person = typeof A !== 'undefined' ? A : null;
      if (!isRemote(person)) return state.original.pushMsg(msg);
      if (person.readOnly) return;
      if (!state.user) { safeToast('Sign in to send to your Inner Circle'); openAccountSettings(); return; }
      sendRemoteMessage(person, msg).catch(error => console.warn(error));
    };
    state.original.draw = draw;
    draw = function() { const value = state.original.draw(); decorateMessageStates(); return value; };
    state.original.open = open_;
    open_ = function(id) {
      const value = state.original.open(id);
      const person = typeof A !== 'undefined' ? A : null;
      if (isRemote(person)) {
        state.activeConversationId = person.conversationId;
        subscribePerson(person);
        hydrateConversation(person).catch(error => console.warn(error));
        renderPresence(person);
        markConversationRead(person);
      } else state.activeConversationId = null;
      return value;
    };
    state.original.removePerson = removePerson;
    removePerson = function(id) {
      const p = findPerson(id);
      if (!isRemote(p)) return state.original.removePerson(id);
      hichkiConfirm(`Remove ${p.n} from this device's circle? Your server conversation is not deleted.`, () => {
        setHidden(state.user.id, p.peerUserId, true);
        DB.circle = DB.circle.filter(x => x.id !== p.id); delete DB.notes[p.id]; save();
        if (typeof A !== 'undefined' && A?.id === p.id) { A = null; go('h'); } else home();
        safeToast(`${p.n.split(' ')[0]} removed from this circle`);
      });
    };
  }

  function installAttachmentHooks() {
    const bind = (id) => {
      const input = document.getElementById(id); if (!input) return;
      input.onchange = function() {
        const file = this.files?.[0]; this.value = '';
        const person = activeRemote();
        if (!person) return state.original.attachmentHandlers?.[id]?.call(this);
        if (!file || person.readOnly) return;
        const caption = document.getElementById('inp')?.value?.trim() || '';
        if (caption) { document.getElementById('inp').value = ''; try { tog(); } catch {} }
        sendRemoteFile(person, file, caption).catch(error => console.warn(error));
      };
    };
    state.original.attachmentHandlers = {};
    for (const id of ['fPhoto','fCam','fVid','fAny']) {
      const input = document.getElementById(id); if (input) state.original.attachmentHandlers[id] = input.onchange;
      bind(id);
    }
  }

  async function searchPeople(query) {
    if (!state.client || !state.user) throw Error('not_authenticated');
    const q = String(query || '').trim();
    if (q.length < 2) return [];
    const { data, error } = await state.client.from('profiles').select('id,display_name,avatar_url').ilike('display_name', `%${q.replace(/[%_]/g,'')}%`).neq('id', state.user.id).limit(12);
    if (error) throw error;
    return data || [];
  }
  async function addCloudPerson(peer) {
    if (!state.user) throw Error('not_authenticated');
    const visibleCount = (DB.circle || []).filter(p => !p.readOnly).length;
    if (!remotePersonByPeer(peer.id) && visibleCount >= 5) { safeToast('Your Inner Circle already has five people'); return; }
    setHidden(state.user.id, peer.id, false);
    const conversationId = await RT().directConversation(peer.id);
    const person = upsertRemotePerson(peer, conversationId);
    await subscribePerson(person); await hydrateConversation(person);
    closeSheet(); home(); open_(person.id);
  }
  function renderPeopleResults(items) {
    const host = document.getElementById('hkPeopleResults'); if (!host) return;
    if (!items.length) { host.innerHTML = '<p class="sub" style="text-align:center;padding:14px">No matching Hichki profiles.</p>'; return; }
    host.innerHTML = items.map(p => `<button type="button" class="iceR hk-person-result" data-peer="${esc(p.id)}"><div style="width:36px;height:36px;border-radius:50%;display:grid;place-items:center;font-weight:800;font-size:12px;background:${colorFor(p.id)};font-family:'Fraunces',serif">${esc((p.display_name||'H').slice(0,1).toUpperCase())}</div><div class="t">${esc(p.display_name||'Hichki user')}<small>Hichki account</small></div><span>＋</span></button>`).join('');
    host.querySelectorAll('[data-peer]').forEach(b => b.onclick = async () => {
      b.disabled = true;
      try { const p = items.find(x => x.id === b.dataset.peer); await addCloudPerson(p); }
      catch (error) { safeToast(error?.message === 'not_authenticated' ? 'Sign in first' : 'Could not add this person'); b.disabled = false; }
    });
  }
  function openCloudPersonSheet() {
    if (!state.user) { openAccountSettings(); return; }
    document.getElementById('scr').classList.add('on');
    document.getElementById('sT').textContent = 'Add someone';
    document.getElementById('sB').innerHTML = `<div class="field"><label>Find a Hichki profile</label><input id="hkPeopleSearch" placeholder="Type their display name" maxlength="80" autocomplete="off"/></div><p class="sub" style="margin:4px 0 12px">Only authenticated Hichki profiles can be added to live chat.</p><div id="hkPeopleResults"></div>`;
    const input = document.getElementById('hkPeopleSearch');
    let seq = 0;
    input.oninput = async () => {
      const mine = ++seq;
      try { const rows = await searchPeople(input.value); if (mine === seq) renderPeopleResults(rows); }
      catch { if (mine === seq) renderPeopleResults([]); }
    };
    setTimeout(() => input.focus(), 100);
  }
  function installSheetHook() {
    state.original.sheet = sheet;
    sheet = function(k, payload) {
      if (k === 'addPerson' && state.user) return openCloudPersonSheet();
      return state.original.sheet(k, payload);
    };
  }

  function accountMarkup() {
    const user = state.user;
    if (user) return `<div class="setGroup hk-account" id="hkAccountSection"><div class="lbl">Hichki account</div><div class="hk-account-card"><div><b>${esc(user.user_metadata?.display_name || DB?.me?.name || 'Signed in')}</b><small>${esc(user.email || 'Authenticated account')}</small></div><span class="hk-cloud-dot"></span></div><button class="cta secondary" type="button" id="hkSignOut">Sign out</button></div>`;
    return `<div class="setGroup hk-account" id="hkAccountSection"><div class="lbl">Hichki account</div><p class="sub" style="margin:0 0 10px">Sign in for private live chat, sync and your Inner Circle.</p><div class="field"><label>Email</label><input id="hkAuthEmail" type="email" autocomplete="email" placeholder="you@example.com"/></div><div class="field"><label>Password</label><input id="hkAuthPassword" type="password" autocomplete="current-password" minlength="8" placeholder="At least 8 characters"/></div><div style="display:flex;gap:8px"><button class="cta slim" type="button" id="hkSignIn">Sign in</button><button class="cta slim secondary" type="button" id="hkSignUp">Create account</button></div></div>`;
  }
  function renderAccountCard() {
    const screen = document.getElementById('s'); if (!screen) return;
    const scroll = screen.querySelector(':scope > div[style*="overflow-y:auto"]') || screen.children[1]; if (!scroll) return;
    document.getElementById('hkAccountSection')?.remove();
    const holder = document.createElement('div'); holder.innerHTML = accountMarkup();
    const section = holder.firstElementChild;
    const firstGroup = scroll.querySelector('.setGroup');
    if (firstGroup) scroll.insertBefore(section, firstGroup); else scroll.appendChild(section);
    document.getElementById('hkSignIn')?.addEventListener('click', () => authAction('signin'));
    document.getElementById('hkSignUp')?.addEventListener('click', () => authAction('signup'));
    document.getElementById('hkSignOut')?.addEventListener('click', async () => { await RT()?.signOut(); safeToast('Signed out'); });
  }
  async function authAction(mode) {
    const email = document.getElementById('hkAuthEmail')?.value?.trim();
    const password = document.getElementById('hkAuthPassword')?.value || '';
    if (!email || password.length < 8) { safeToast('Enter a valid email and password'); return; }
    try {
      if (mode === 'signup') {
        const result = await RT().signUp(email, password, DB?.me?.name || 'Hichki user');
        if (result.error) throw result.error;
        if (!result.data?.session) safeToast('Check your email to confirm your Hichki account');
        else safeToast('Hichki account created');
      } else {
        const result = await RT().signIn(email, password);
        if (result.error) throw result.error;
        safeToast('Signed in');
      }
    } catch (error) { safeToast(error?.message || 'Could not sign in'); }
  }
  function openAccountSettings() { try { go('s'); renderSettings(); renderAccountCard(); } catch {} }
  function installSettingsHook() {
    state.original.renderSettings = renderSettings;
    renderSettings = function() { const value = state.original.renderSettings(); renderAccountCard(); return value; };
  }

  function renderPresence(person) {
    const who = document.getElementById('who'); if (!who || !isRemote(person)) return;
    let badge = who.querySelector('.hk-presence');
    if (!badge) { badge = document.createElement('small'); badge.className = 'hk-presence'; who.appendChild(badge); }
    badge.textContent = state.peerPresence.get(person.peerUserId) ? 'online' : '';
  }
  function onRealtimeEvent(type, detail) {
    if (type === 'auth') return onAuth(detail.user);
    if (type === 'message-sent' && detail?.conversation_id) {
      const p = remotePersonByConversation(detail.conversation_id); if (p) mergeServerMessage(p, detail);
    }
    if (type === 'message-queued' && detail?.conversation_id) {
      const p = remotePersonByConversation(detail.conversation_id); if (p) updateOptimistic(p, detail.client_id, { status:'queued' });
    }
    if (type === 'message-retry-needed' && detail?.item?.conversation_id) {
      const p = remotePersonByConversation(detail.item.conversation_id); if (p) updateOptimistic(p, detail.item.client_id, { status:'failed' });
    }
    if (type === 'media-queued' && detail?.conversation_id) {
      const p = remotePersonByConversation(detail.conversation_id); if (p) updateOptimistic(p, detail.client_id, { status:'queued' });
    }
    if (type === 'receipt') {
      const p = remotePersonByConversation(detail.conversation_id) || (DB.circle || []).find(x => x.remoteCloud && currentMessageList(x).some(m => messageServerId(m) === detail.message_id));
      if (!p || detail.user_id === state.user?.id) return;
      const m = currentMessageList(p).find(x => messageServerId(x) === detail.message_id);
      if (m) { m.status = detail.read_at ? 'read' : detail.delivered_at ? 'delivered' : m.status; save(); if (typeof A !== 'undefined' && A?.id === p.id) draw(); }
    }
    if (type === 'typing') {
      const p = remotePersonByConversation(detail.conversationId || detail.conversation_id);
      if (!p || detail.user_id === state.user?.id) return;
      const who = document.getElementById('who');
      if (typeof A !== 'undefined' && A?.id === p.id && who) {
        let badge = who.querySelector('.hk-presence') || document.createElement('small'); badge.className='hk-presence';
        if (!badge.parentNode) who.appendChild(badge);
        badge.textContent = detail.is_typing ? 'typing…' : (state.peerPresence.get(p.peerUserId) ? 'online' : '');
      }
    }
    if (type === 'presence-join' || type === 'presence-leave') {
      const p = remotePersonByConversation(detail.conversationId || detail.conversation_id);
      if (!p || detail.user_id === state.user?.id) return;
      state.peerPresence.set(detail.user_id, type === 'presence-join'); renderPresence(p);
    }
    if (type === 'presence' && detail?.state) {
      const p = activeRemote(); if (!p) return;
      const flat = JSON.stringify(detail.state); state.peerPresence.set(p.peerUserId, flat.includes(p.peerUserId)); renderPresence(p);
    }
  }

  function installTypingHook() {
    const input = document.getElementById('inp'); if (!input) return;
    input.addEventListener('input', () => {
      const p = activeRemote(); if (!p || !state.user) return;
      RT()?.setTyping(p.conversationId, true).catch(()=>{});
      clearTimeout(state.inputTypingTimer);
      state.inputTypingTimer = setTimeout(() => RT()?.setTyping(p.conversationId, false).catch(()=>{}), 1000);
    });
    input.addEventListener('blur', () => { const p = activeRemote(); if (p) RT()?.setTyping(p.conversationId, false).catch(()=>{}); });
    document.addEventListener('visibilitychange', () => { const p = activeRemote(); if (p && document.visibilityState === 'visible') markConversationRead(p); });
  }

  function installRemoteMediaOpen() {
    state.original.bubbleBody = bubbleBody;
    bubbleBody = function(m, i) {
      if (m?.remoteUrl && m.k === 'file') return `<a class="fileBub" href="${esc(m.remoteUrl)}" target="_blank" rel="noopener" onclick="event.stopPropagation()"><div class="fi">↗</div><div style="min-width:0"><div class="mBubName">${esc(m.name||'File')}</div><div class="mBubSub">${esc(m.size||'Open securely')}</div></div></a>`;
      if (m?.k === 'song' && m?.remoteCloud && m?.url) return `<a class="songBub" href="${esc(m.url)}" target="_blank" rel="noopener" onclick="event.stopPropagation()"><div class="sv" style="--sc:${m.c||'#FFD93D'}"></div><div style="min-width:0;flex:1"><div class="mBubName">${esc(m.title||'Music')}</div><div class="mBubSub">${esc(m.artist||'Open link')}</div></div><div class="pl">↗</div></a>`;
      if (m?.k === 'note' && m?.remoteCloud && !m.noteId) return `<div class="noteBub" style="--nc:${m.mood||'#FFD93D'}"><div class="nl">Shared note</div><div class="nt">${esc(m.title||'Untitled')}</div><div class="np">${esc(m.text||'')}</div>${m.serverId ? `<button type="button" class="hk-save-shared" data-save-msg="${esc(m.serverId)}" onclick="event.stopPropagation();HichkiCloudUI.saveShared('${esc(m.serverId)}')">Save to Notes</button>`:''}</div>`;
      return state.original.bubbleBody(m, i);
    };
  }

  async function saveShared(serverId) {
    const p = activeRemote(); if (!p) return;
    const local = currentMessageList(p).find(m => m.serverId === serverId); if (!local) return;
    try { await window.HichkiLibrary?.saveFromMessage({ id:serverId, meta:local.meta }); safeToast('Saved to Notes & Music'); }
    catch { safeToast('Could not save this shared item'); }
  }

  async function onAuth(user) {
    state.user = user || null;
    state.client = await RT()?.init() || state.client;
    pruneForeignRemote(state.user?.id || null);
    if (!state.user) {
      state.subscriptions.clear(); state.peerPresence.clear();
      try { home(); } catch {}
      renderAccountCard();
      return;
    }
    await ensureProfile();
    await syncCircle().catch(error => console.warn('Hichki circle sync:', error.message || error));
    renderAccountCard();
  }

  async function boot() {
    if (state.booted || !window.HichkiRealtime || typeof DB === 'undefined') return;
    state.booted = true;
    injectStyles();
    installMessageHooks(); installAttachmentHooks(); installSheetHook(); installSettingsHook(); installTypingHook(); installRemoteMediaOpen();
    RT().on(onRealtimeEvent);
    state.client = await RT().init(); state.user = RT().user || null;
    pruneForeignRemote(state.user?.id || null);
    if (state.user) { await ensureProfile(); await syncCircle().catch(error => console.warn(error)); }
    try { home(); } catch {}
  }

  function injectStyles() {
    if (document.getElementById('hkCloudUiStyles')) return;
    const style = document.createElement('style'); style.id='hkCloudUiStyles';
    style.textContent = `.hk-msg-state{font-size:9px;color:var(--pmut);margin-top:3px;text-align:right}.hk-msg-state[data-state="failed"]{color:var(--coral)}.hk-msg-state[data-state="read"]{color:var(--sky)}.hk-presence{font-size:9px;font-weight:700;color:var(--g);margin-left:5px}.hk-account-card{display:flex;align-items:center;justify-content:space-between;background:var(--card);border-radius:16px;padding:13px 15px;box-shadow:var(--sh);margin-bottom:8px}.hk-account-card b,.hk-account-card small{display:block}.hk-account-card small{font-size:10px;color:var(--mut);margin-top:2px}.hk-cloud-dot{width:8px;height:8px;border-radius:50%;background:var(--g)}.hk-person-result{width:100%;text-align:left}.hk-save-shared{margin-top:8px;font-size:10px;font-weight:800;text-decoration:underline}.fileBub[href],.songBub[href]{color:inherit;text-decoration:none}`;
    document.head.appendChild(style);
  }

  window.HichkiCloudUI = { boot, syncCircle, openAccountSettings, saveShared, get user(){return state.user;} };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => boot().catch(error => console.warn('Hichki cloud UI:', error)), { once:true });
  else boot().catch(error => console.warn('Hichki cloud UI:', error));
})();
