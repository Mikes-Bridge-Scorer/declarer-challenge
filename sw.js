/* Declarer Challenge service worker. Relative paths, so it works in any folder.
   The app (index.html) and hands.json are fetched fresh first, so a new build shows at once.
   SHIP WIFI: on a ship's wifi without an internet package the phone thinks it is online, but requests
   hang or are answered by the ship's login page. So the network only gets WAIT_MS to answer with a
   real reply; otherwise the saved copy is used straight away (and the late reply still updates the
   saved copy for next time). Icons/manifest are cache-first. */
var CACHE='declarer-challenge-v6';
var WAIT_MS=3500;
var FILES=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon-maskable-512.png'];
self.addEventListener('install',function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){
    return Promise.all(FILES.map(function(u){return fetch(new Request(u,{cache:'reload'})).then(function(r){ if(!r.ok) throw new Error(u); return c.put(u,r); });}));
  }).then(function(){return self.skipWaiting();}));
});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));}).then(function(){return self.clients.claim();}));
});
function good(res){ return res && res.ok && !res.redirected && res.type!=='opaqueredirect'; }
function save(key,res){ var copy=res.clone(); caches.open(CACHE).then(function(c){c.put(key,copy);}); }
function saved(key){ return caches.match(key).then(function(hit){ return hit||caches.match('./index.html'); }); }
self.addEventListener('fetch',function(e){
  var req=e.request;
  if(req.method!=='GET') return;
  var u=new URL(req.url);
  if(u.origin!==location.origin) return;
  var key=new Request(u.origin+u.pathname);   /* ignore ?set=..&lesson=.. so links open offline */
  var isShell = req.mode==='navigate' || /\/$/.test(u.pathname) || /index\.html$/.test(u.pathname) || /\.json$/.test(u.pathname);

  if(isShell){
    var net=fetch(key.url,{cache:'no-cache'}).then(function(res){ if(good(res)){ save(key,res); return res; } throw new Error('bad reply'); });
    e.waitUntil(net.catch(function(){}));
    e.respondWith(new Promise(function(resolve){
      var done=false;
      var useSaved=function(){ if(done) return; saved(key).then(function(hit){ if(hit){ done=true; resolve(hit); } else net.then(function(r){done=true;resolve(r);},function(){done=true;resolve(Response.error());}); }); };
      var t=setTimeout(useSaved,WAIT_MS);
      net.then(function(res){ if(!done){ done=true; clearTimeout(t); resolve(res); } },function(){ clearTimeout(t); useSaved(); });
    }));
    return;
  }

  /* static assets: cache-first, refreshed in the background for next time */
  e.respondWith(caches.match(key).then(function(hit){
    var net=fetch(key.url,{cache:'no-cache'}).then(function(res){ if(good(res)) save(key,res); return res; }).catch(function(){return null;});
    if(hit){ e.waitUntil(net); return hit; }
    return net.then(function(r){return r||caches.match('./index.html');});
  }));
});
