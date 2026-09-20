/* Declarer Challenge service worker. All paths are relative so it works in any folder. */
var CACHE='declarer-challenge-v1';   /* change the number whenever you upload a new index.html */
var FILES=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon-maskable-512.png'];
self.addEventListener('install',function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(FILES);}).then(function(){return self.skipWaiting();}));
});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));}).then(function(){return self.clients.claim();}));
});
self.addEventListener('fetch',function(e){
  if(e.request.method!=='GET') return;
  /* ignoreSearch: challenge links carry ?h=..&n=..&s=..&t=.. and must still open the cached page offline */
  e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(function(hit){
    return hit||fetch(e.request).catch(function(){ return caches.match('./index.html'); });
  }));
});
