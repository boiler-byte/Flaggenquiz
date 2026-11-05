// Vollständiger Offline-Cache (App-Shell + alle Flaggenbilder).
// Versionskennung bei Updates erhöhen: alter Cache wird automatisch gelöscht.
const CACHE_NAME = 'flaggen-quiz-v1.0.0';
const OFFLINE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/styles.css',
  './js/data/countries.js',
  './js/core/game.js',
  './js/core/storage.js',
  './js/core/audio.js',
  './js/ui/effects.js',
  './js/ui/app.js',
  './assets/icons/favicon.svg',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/flags/al.webp',
  './assets/flags/dz.webp',
  './assets/flags/ao.webp',
  './assets/flags/ar.webp',
  './assets/flags/am.webp',
  './assets/flags/au.webp',
  './assets/flags/bh.webp',
  './assets/flags/bd.webp',
  './assets/flags/be.webp',
  './assets/flags/bz.webp',
  './assets/flags/bj.webp',
  './assets/flags/bo.webp',
  './assets/flags/ba.webp',
  './assets/flags/bw.webp',
  './assets/flags/br.webp',
  './assets/flags/bg.webp',
  './assets/flags/cl.webp',
  './assets/flags/cn.webp',
  './assets/flags/cr.webp',
  './assets/flags/dk.webp',
  './assets/flags/de.webp',
  './assets/flags/do.webp',
  './assets/flags/ec.webp',
  './assets/flags/ci.webp',
  './assets/flags/sv.webp',
  './assets/flags/ee.webp',
  './assets/flags/et.webp',
  './assets/flags/fi.webp',
  './assets/flags/fr.webp',
  './assets/flags/ga.webp',
  './assets/flags/ge.webp',
  './assets/flags/gh.webp',
  './assets/flags/gr.webp',
  './assets/flags/gt.webp',
  './assets/flags/ht.webp',
  './assets/flags/hn.webp',
  './assets/flags/in.webp',
  './assets/flags/id.webp',
  './assets/flags/iq.webp',
  './assets/flags/ir.webp',
  './assets/flags/ie.webp',
  './assets/flags/is.webp',
  './assets/flags/il.webp',
  './assets/flags/it.webp',
  './assets/flags/jm.webp',
  './assets/flags/jp.webp',
  './assets/flags/ye.webp',
  './assets/flags/jo.webp',
  './assets/flags/kh.webp',
  './assets/flags/cm.webp',
  './assets/flags/ca.webp',
  './assets/flags/kz.webp',
  './assets/flags/qa.webp',
  './assets/flags/ke.webp',
  './assets/flags/co.webp',
  './assets/flags/hr.webp',
  './assets/flags/cu.webp',
  './assets/flags/kw.webp',
  './assets/flags/la.webp',
  './assets/flags/lv.webp',
  './assets/flags/lb.webp',
  './assets/flags/lt.webp',
  './assets/flags/lu.webp',
  './assets/flags/mg.webp',
  './assets/flags/my.webp',
  './assets/flags/ml.webp',
  './assets/flags/mt.webp',
  './assets/flags/ma.webp',
  './assets/flags/mu.webp',
  './assets/flags/mx.webp',
  './assets/flags/md.webp',
  './assets/flags/mn.webp',
  './assets/flags/me.webp',
  './assets/flags/mz.webp',
  './assets/flags/mm.webp',
  './assets/flags/na.webp',
  './assets/flags/np.webp',
  './assets/flags/nz.webp',
  './assets/flags/ni.webp',
  './assets/flags/nl.webp',
  './assets/flags/ng.webp',
  './assets/flags/kp.webp',
  './assets/flags/mk.webp',
  './assets/flags/no.webp',
  './assets/flags/om.webp',
  './assets/flags/at.webp',
  './assets/flags/pk.webp',
  './assets/flags/pa.webp',
  './assets/flags/py.webp',
  './assets/flags/pe.webp',
  './assets/flags/ph.webp',
  './assets/flags/pl.webp',
  './assets/flags/pt.webp',
  './assets/flags/ro.webp',
  './assets/flags/ru.webp',
  './assets/flags/sa.webp',
  './assets/flags/se.webp',
  './assets/flags/ch.webp',
  './assets/flags/sn.webp',
  './assets/flags/rs.webp',
  './assets/flags/sg.webp',
  './assets/flags/sk.webp',
  './assets/flags/si.webp',
  './assets/flags/so.webp',
  './assets/flags/es.webp',
  './assets/flags/lk.webp',
  './assets/flags/za.webp',
  './assets/flags/kr.webp',
  './assets/flags/sd.webp',
  './assets/flags/sy.webp',
  './assets/flags/tz.webp',
  './assets/flags/th.webp',
  './assets/flags/tg.webp',
  './assets/flags/tt.webp',
  './assets/flags/td.webp',
  './assets/flags/cz.webp',
  './assets/flags/tn.webp',
  './assets/flags/tr.webp',
  './assets/flags/ug.webp',
  './assets/flags/ua.webp',
  './assets/flags/hu.webp',
  './assets/flags/uy.webp',
  './assets/flags/uz.webp',
  './assets/flags/ve.webp',
  './assets/flags/ae.webp',
  './assets/flags/us.webp',
  './assets/flags/gb.webp',
  './assets/flags/vn.webp',
  './assets/flags/zm.webp',
  './assets/flags/cy.webp',
 ];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(OFFLINE_ASSETS);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith('flaggen-quiz-') && key !== CACHE_NAME).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put('./index.html', response.clone());
        }
        return response;
      } catch {
        return await caches.match('./index.html') || Response.error();
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    try {
      return await fetch(request);
    } catch {
      return Response.error();
    }
  })());
});
