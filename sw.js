/* Declarer Challenge service worker. Relative paths, so it works in any folder.
   The app shell (index.html / '/') is always fetched fresh from the network first, falling back
   to the cached copy only when offline — so a new build shows up the very next time the app is
   opened, instead of one launch late. Icons/manifest rarely change, so those stay cache-first
   for speed, refreshed quietly in the background. */
var CACHE='declarer-challenge-v4';
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
  var isShell = req.mode==='navigate' || u.pathname==='/' || /\/$/.test(u.pathname) || /index\.html$/.test(u.pathname);

  if(isShell){
    /* network-first: always try to get the latest build; only use the cache when offline */
    e.respondWith(
      fetch(key.url,{cache:'no-cache'}).then(function(res){
        if(res&&res.ok){ var copy=res.clone(); caches.open(CACHE).then(function(c){c.put(key,copy);}); }
        return res;
      }).catch(function(){
        return caches.match(key).then(function(hit){ return hit||caches.match('./index.html'); });
      })
    );
    return;
  }

  /* static assets: cache-first, refreshed in the background for next time */
  e.respondWith(caches.match(key).then(function(hit){
    var net=fetch(key.url,{cache:'no-cache'}).then(function(res){
      if(res&&res.ok){ var copy=res.clone(); caches.open(CACHE).then(function(c){c.put(key,copy);}); }
      return res;
    }).catch(function(){return null;});
    return hit||net.then(function(r){return r||caches.match('./index.html');});
  }));
});
