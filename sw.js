/* Declarer Challenge service worker. Relative paths, so it works in any folder.
   Shows the saved copy straight away (fast, works offline, good on slow ship wifi) and refreshes it
   in the background; the app then offers a "New version ready" button. */
var CACHE='declarer-challenge-v3';
var FILES=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon-maskable-512.png'];
self.addEventListener('install',function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){
    /* cache:'reload' skips the browser's own HTTP cache, so a fresh copy is always saved */
    return Promise.all(FILES.map(function(u){return fetch(new Request(u,{cache:'reload'})).then(function(r){ if(!r.ok) throw new Error(u); return c.put(u,r); });}));
  }).then(function(){return self.skipWaiting();}));
});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));}).then(function(){return self.clients.claim();}));
});
self.addEventListener('fetch',function(e){
  var req=e.request;
  if(req.method!=='GET') return;
  var u=new URL(req.url);
  if(u.origin!==location.origin) return;
  var key=new Request(u.origin+u.pathname);   /* ignore ?set=..&n=..&s=..&t=.. so challenge links open offline */
  e.respondWith(caches.match(key).then(function(hit){
    var net=fetch(key.url,{cache:'no-cache'}).then(function(res){
      if(res&&res.ok){ var copy=res.clone(); caches.open(CACHE).then(function(c){c.put(key,copy);}); }
      return res;
    }).catch(function(){return null;});
    return hit||net.then(function(r){return r||caches.match('./index.html');});
  }));
});
