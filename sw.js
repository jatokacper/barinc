/* Bar Inc. 5.15 - network-first documents, offline fallback, preserved local storage. */
const CACHE='barinc-v515-progress-rebalance';
const ASSETS=['./index.html','./manifest.webmanifest','./icons/icon-180.png','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  await cache.addAll(ASSETS);
  await self.skipWaiting();
 })());
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  const names=await caches.keys();
  await Promise.all(names.filter(name=>name.startsWith('barinc-')&&name!==CACHE).map(name=>caches.delete(name)));
  await self.clients.claim();
 })());
});
self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='GET')return;
 const url=new URL(req.url);
 if(url.origin!==self.location.origin)return;
 const isDocument=req.mode==='navigate'||url.pathname.endsWith('/index.html')||url.pathname.endsWith('/');
 if(isDocument){
  event.respondWith((async()=>{
   try{
    const response=await fetch(req,{cache:'no-store'});
    if(response.ok){const cache=await caches.open(CACHE);await cache.put('./index.html',response.clone())}
    return response;
   }catch(e){
    const cache=await caches.open(CACHE);
    return await cache.match('./index.html')||Response.error();
   }
  })());
 }else{
  event.respondWith((async()=>{
   try{
    const response=await fetch(req);
    if(response.ok){const cache=await caches.open(CACHE);await cache.put(req,response.clone())}
    return response;
   }catch(e){return await caches.match(req)||Response.error()}
  })());
 }
});
