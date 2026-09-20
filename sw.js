/* Declarer Challenge service worker. Relative paths, so it works in any folder.
   Strategy: show the saved copy straight away (fast, works offline, good on slow ship wifi),
   and quietly fetch a fresh copy in the background. A new version therefore appears the
   second time the app is opened after you upload it. */
var CACHE='declarer-challenge-v2';
var FILES=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon-maskable-512.png'];
self.addEventListener('install',function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(FILES);}).then(function(){return self.skipWaiting();}));
});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));}).then(function(){return self.clients.claim();}));
});
self.addEventListener('fetch',function(e){
  var req=e.request;
  if(req.method!=='GET') return;
  var u=new URL(req.url);
  if(u.origin!==location.origin) return;
  var key=new Request(u.origin+u.pathname);   /* ignore ?h=..&n=..&s=..&t=.. so challenge links open offline */
  e.respondWith(caches.match(key).then(function(hit){
    var net=fetch(req).then(function(res){
      if(res&&res.ok){ var copy=res.clone(); caches.open(CACHE).then(function(c){c.put(key,copy);}); }
      return res;
    }).catch(function(){return null;});
    return hit||net.then(function(r){return r||caches.match('./index.html');});
  }));
});
