/* Hichki Socket.IO transport. Authenticated by the current Supabase access token. */
(() => {
  'use strict';
  const CFG = window.HICHKI_CONFIG || {};
  const SOCKET_URL = String(CFG.socketUrl || document.querySelector('meta[name="hichki-socket-url"]')?.content || '').replace(/\/$/, '');
  const state = { socket:null, loading:null, token:'', joined:new Set(), listeners:new Set(), configured:Boolean(SOCKET_URL) };
  const emit = (type, detail={}) => {
    window.dispatchEvent(new CustomEvent(`hichki:socket-${type}`, { detail }));
    for (const fn of state.listeners) { try { fn(type, detail); } catch {} }
  };
  const timeout = (event, payload, ms=10000) => new Promise((resolve, reject) => {
    if (!state.socket?.connected) return reject(Error('socket_disconnected'));
    state.socket.timeout(ms).emit(event, payload, (error, response) => {
      if (error) return reject(Error('socket_timeout'));
      if (!response?.ok) return reject(Error(response?.error || `${event}_failed`));
      resolve(response);
    });
  });
  async function loadClient(){
    if (window.io) return window.io;
    if (!SOCKET_URL) throw Error('socket_not_configured');
    if (state.loading) return state.loading;
    state.loading = new Promise((resolve,reject)=>{
      const s=document.createElement('script');
      s.src=`${SOCKET_URL}/socket.io/socket.io.js`;
      s.async=true;s.crossOrigin='anonymous';
      s.onload=()=>window.io?resolve(window.io):reject(Error('socket_client_missing'));
      s.onerror=()=>reject(Error('socket_client_load_failed'));
      document.head.appendChild(s);
    }).finally(()=>{state.loading=null});
    return state.loading;
  }
  async function connect(accessToken){
    const nextToken=String(accessToken||'');
    const tokenChanged=Boolean(state.token&&nextToken&&state.token!==nextToken);
    state.token=nextToken;
    if (!SOCKET_URL || !state.token) return null;
    const io = await loadClient();
    if (state.socket) {
      state.socket.auth={accessToken:state.token};
      if (tokenChanged&&state.socket.connected){state.socket.disconnect();state.socket.connect();}
      else if (!state.socket.connected) state.socket.connect();
      return state.socket;
    }
    const socket=io(SOCKET_URL,{auth:{accessToken:state.token},transports:['websocket','polling'],upgrade:true,reconnection:true,reconnectionAttempts:Infinity,reconnectionDelay:500,reconnectionDelayMax:5000,timeout:10000});
    state.socket=socket;
    socket.on('connect',()=>{emit('connected',{socket_id:socket.id}); for(const id of [...state.joined]) timeout('conversation:join',{conversation_id:id}).catch(()=>{});});
    socket.on('disconnect',reason=>emit('disconnected',{reason}));
    socket.on('connect_error',error=>emit('error',{code:'connect_error',message:error?.message||'connect_error'}));
    socket.on('session:ready',detail=>emit('ready',detail));
    socket.on('message:new',message=>emit('message',message));
    socket.on('receipt:update',receipt=>emit('receipt',receipt));
    socket.on('typing:update',detail=>emit('typing',detail));
    socket.on('presence:update',detail=>emit('presence',detail));
    return socket;
  }
  function disconnect(){ if(state.socket){state.socket.disconnect();state.socket=null;} state.joined.clear(); }
  async function joinConversation(conversationId){ state.joined.add(conversationId); if(!state.socket?.connected) return {ok:false,pending:true}; return timeout('conversation:join',{conversation_id:conversationId}); }
  async function leaveConversation(conversationId){ state.joined.delete(conversationId); if(!state.socket?.connected) return {ok:true}; return timeout('conversation:leave',{conversation_id:conversationId}); }
  async function sendMessage(item){ const res=await timeout('message:send',item,12000); return res.message; }
  function setTyping(conversationId,isTyping){ if(state.socket?.connected&&state.joined.has(conversationId)) state.socket.emit('typing:set',{conversation_id:conversationId,is_typing:Boolean(isTyping)}); }
  async function updateReceipt(conversationId,messageId,flags={}){ return timeout('receipt:update',{conversation_id:conversationId,message_id:messageId,delivered:Boolean(flags.delivered),read:Boolean(flags.read)}); }
  function on(fn){state.listeners.add(fn);return()=>state.listeners.delete(fn)}
  window.HichkiSocket={connect,disconnect,joinConversation,leaveConversation,sendMessage,setTyping,updateReceipt,on,get connected(){return Boolean(state.socket?.connected)},get configured(){return state.configured},get url(){return SOCKET_URL}};
})();
