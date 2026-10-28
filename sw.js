const CACHE_NAME = 'evakuasi-v2';
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './data/titik_kumpul.geojson',
    './data/jalur_evakuasi.geojson',
    './data/batas_desa.geojson'
];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS))));
self.addEventListener('fetch', e => e.respondWith(caches.match(e.request).then(r => r || fetch(e.request))));