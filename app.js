// 1. Inisialisasi Peta
const map = L.map('map', { zoomControl: false }).setView([-7.4935, 110.3950], 14);

// Basemap Layers
const esriSatelit = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: 'Esri' }).addTo(map);
const osmMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: 'OSM' });
let currentBasemap = 'satelit';

function toggleBasemap() {
    if (currentBasemap === 'satelit') {
        map.removeLayer(esriSatelit);
        map.addLayer(osmMap);
        currentBasemap = 'osm';
    } else {
        map.removeLayer(osmMap);
        map.addLayer(esriSatelit);
        currentBasemap = 'satelit';
    }
}

// 2. Icon Marker Keren
const userIcon = L.divIcon({
    className: 'custom-user-marker',
    html: `<div style="background:#2563eb; width:18px; height:18px; border-radius:50%; border:3px solid white; box-shadow:0 0 12px rgba(37,99,235,0.8);"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9]
});

let userMarker = null;
let routingControl = null;
let userCoords = null;

// 3. Load Batas Desa & Jalur Evakuasi
fetch('data/batas_desa.geojson').then(r => r.json()).then(data => {
    L.geoJSON(data, {
        style: { color: '#ef4444', weight: 2.5, dashArray: '4, 4', fillColor: '#ef4444', fillOpacity: 0.12 }
    }).addTo(map);
});

fetch('data/jalur_evakuasi.geojson').then(r => r.json()).then(data => {
    L.geoJSON(data, {
        style: { color: '#f97316', weight: 5, opacity: 0.85 }
    }).addTo(map);
});

// 4. Load Titik Kumpul + Animasi Pulse Marker
fetch('data/titik_kumpul.geojson').then(r => r.json()).then(data => {
    L.geoJSON(data, {
        pointToLayer: (feature, latlng) => L.circleMarker(latlng, { radius: 9, fillColor: "#22c55e", color: "#ffffff", weight: 2.5, fillOpacity: 0.95 }),
        onEachFeature: (feature, layer) => {
            const nama = feature.properties ? (feature.properties.nama || feature.properties.NAMOBJ || "Titik Evakuasi") : "Titik Evakuasi";
            const pj = feature.properties ? (feature.properties.penanggung_jawab || "-") : "-";
            const lat = layer.getLatLng().lat;
            const lng = layer.getLatLng().lng;

            layer.bindPopup(`
                <div style="text-align:center; padding: 4px;">
                    <b style="color:#15803d; font-size:14px;">${nama}</b><br>
                    <small style="color:#64748b;">PJ: ${pj}</small><br><br>
                    <button onclick="buatRute(${lat}, ${lng})" style="background:#ef4444; color:white; border:none; padding:8px 14px; border-radius:8px; cursor:pointer; font-weight:bold; font-size:12px; width:100%;">
                        🚀 Rute Evakuasi
                    </button>
                </div>
            `);
        }
    }).addTo(map);
});

// 5. GPS Realtime Tracking dengan Heading
function lacakLokasi() {
    if (!navigator.geolocation) return;

    document.getElementById('status-gps').innerHTML = `<i class="fa-solid fa-spinner fa-spin" style="color:#2563eb;"></i> Mencari GPS...`;

    navigator.geolocation.watchPosition(pos => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        userCoords = { lat, lng };

        document.getElementById('status-gps').innerHTML = `<i class="fa-solid fa-circle-dot" style="color:#22c55e;"></i> GPS Terhubung`;

        if (userMarker) {
            userMarker.setLatLng([lat, lng]);
        } else {
            userMarker = L.marker([lat, lng], { icon: userIcon }).addTo(map);
            map.flyTo([lat, lng], 16, { animate: true, duration: 1.5 });
        }
    }, err => {
        document.getElementById('status-gps').innerHTML = `<i class="fa-solid fa-circle-exclamation" style="color:#ef4444;"></i> GPS Mati`;
    }, { enableHighAccuracy: true, maximumAge: 0 });
}

// 6. Buat Rute Navigasi
function buatRute(destLat, destLng) {
    if (!userCoords) {
        alert("Pencet tombol lokasi di kanan bawah terlebih dahulu!");
        lacakLokasi();
        return;
    }

    if (routingControl) map.removeControl(routingControl);

    routingControl = L.Routing.control({
        waypoints: [L.latLng(userCoords.lat, userCoords.lng), L.latLng(destLat, destLng)],
        lineOptions: { styles: [{ color: '#2563eb', opacity: 0.9, weight: 6 }] },
        createMarker: () => null,
        addWaypoints: false,
        routeWhileDragging: false
    }).addTo(map);
}