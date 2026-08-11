import { readFile, writeFile } from 'node:fs/promises';

const path = 'index.html';
let html = await readFile(path, 'utf8');
const marker = 'HICHKI_REALTIME_BRIDGE_V1';

if (!html.includes(marker)) {
  const bridge = `
<!-- ${marker} -->
<script src="/hichki-realtime.js" defer></script>
<script>
(() => {
  const register = async (token) => {
    if (!token || !window.HichkiRealtime) return;
    try {
      let deviceId = localStorage.getItem('hichki.deviceId');
      if (!deviceId) { deviceId = crypto.randomUUID(); localStorage.setItem('hichki.deviceId', deviceId); }
      const platform = /Android/i.test(navigator.userAgent) ? 'android' : /iPhone|iPad|iPod/i.test(navigator.userAgent) ? 'ios' : 'web';
      await window.HichkiRealtime.registerPushToken(token, platform, deviceId);
    } catch (error) { console.warn('Hichki push token sync:', error); }
  };

  window.addEventListener('hichki:native-push-token', event => register(event.detail));
  window.HichkiRegisterPushToken = register;

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(error => console.warn('Hichki service worker:', error));
  }
})();
</script>
`;
  html = html.replace('</body>', `${bridge}</body>`);
}

await writeFile(path, html, 'utf8');
console.log('Hichki realtime bridge injected');
