/* Routes newly sent messages to the free Web Push function. Android/iOS FCM remains handled by hichki-push-v3. */
(() => {
  'use strict';
  const send = async event => {
    const message=event?.detail;if(!message||!window.HichkiRealtime)return;
    try {
      const c=await window.HichkiRealtime.init();if(!c)return;
      await c.functions.invoke('hichki-web-push-v1',{body:{conversation_id:message.conversation_id,title:'Hichki',body:String(message.content||'New message').slice(0,240),data:{conversation_id:message.conversation_id,message_id:message.id||''}}});
    } catch(error) { window.dispatchEvent(new CustomEvent('hichki:push-error',{detail:{channel:'web',error}})); }
  };
  window.addEventListener('hichki:message-sent',send);
})();
