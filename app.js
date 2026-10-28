// 1. Inisialisasi Peta (Pusat Desa Ketep)
const map = L.map('map').setView([-7.4935, 110.3950], 14);

// Basemap Satelit Esri & OSM Street Map
const esriSatelit = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri'
}).addTo(map);

const osmMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: 'OSM'
});

L.control.layers({ "Satelit (Esri)": esriSatelit, "Peta Jalan": osmMap }).addTo(map);

// Variabel Penampung Marker Lokasi Pengguna & Rute
let userMarker = null;
let routingControl = null;
let userCoords = null;

// Icon Biru untuk Posisi Pengguna
const userIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// 2. Load Batas Wilayah Desa Ketep (Polygon Merah)
fetch('data/batas_desa.geojson')
    .then(r => r.json())
    .then(data => {
        L.geoJSON(data, {
            style: {
                color: '#991b1b',
                weight: 3,
                dashArray: '6, 6',
                fillColor: '#ef4444',
                fillOpacity: 0.15
            },
            onEachFeature: (feature, layer) => {
                const nama = feature.properties.NAMOBJ || "Desa Ketep";
                layer.bindTooltip(`<b>${nama}</b>`);
            }
        }).addTo(map);
    })
    .catch(err => console.log('Sistem menunggu file batas_desa.geojson...'));

// 3. Load Jalur Evakuasi (Garis Oranye)
fetch('data/jalur_evakuasi.geojson')
    .then(r => r.json())
    .then(data => {
        L.geoJSON(data, { style: { color: '#e65100', weight: 5, opacity: 0.9 } }).addTo(map);
    })
    .catch(err => console.log('Sistem menunggu file jalur_evakuasi.geojson...'));

// 4. Load Titik Kumpul (Marker Hijau + Tombol Navigasi)
fetch('data/titik_kumpul.geojson')
    .then(r => r.json())
    .then(data => {
        L.geoJSON(data, {
            pointToLayer: (feature, latlng) => L.circleMarker(latlng, { radius: 9, fillColor: "#2e7d32", color: "#fff", weight: 2, fillOpacity: 0.95 }),
            onEachFeature: (feature, layer) => {
                const nama = feature.properties.nama || feature.properties.NAMOBJ || "Titik Evakuasi";
                const pj = feature.properties.penanggung_jawab || "-";
                const lat = layer.getLatLng().lat;
                const lng = layer.getLatLng().lng;

                const popupContent = `
                    <div style="text-align:center; padding: 4px;">
                        <b style="color:#2e7d32; font-size:14px;">${nama}</b><br>
                        <small style="color:#555;">PJ: ${pj}</small><br><br>
                        <button onclick="buatRute(${lat}, ${lng})" style="background:#d32f2f; color:white; border:none; padding:7px 12px; border-radius:5px; cursor:pointer; font-weight:bold; font-size:12px;">
                            🚗 Navigasi ke Sini
                        </button>
                    </div>
                `;
                layer.bindPopup(popupContent);
            }
        }).addTo(map);
    })
    .catch(err => console.log('Sistem menunggu file titik_kumpul.geojson...'));

// 5. Fungsi Lacak Posisi Pengguna via GPS HP
function lacakLokasi() {
    map.locate({ setView: true, maxZoom: 16, enableHighAccuracy: true });
}

map.on('locationfound', e => {
    userCoords = e.latlng;
    
    if (userMarker) {
        userMarker.setLatLng(e.latlng);
    } else {
        userMarker = L.marker(e.latlng, { icon: userIcon }).addTo(map).bindPopup("<b>Lokasi Anda Sekarang</b>");
    }
    userMarker.openPopup();
});

map.on('locationerror', () => {
    alert("Gagal membaca lokasi GPS. Pastikan fitur Lokasi/GPS di HP Anda sudah dinyalakan!");
});

// 6. Fungsi Pembuat Rute Navigasi (Persis Google Maps)
function buatRute(destLat, destLng) {
    if (!userCoords) {
        alert("Silakan klik tombol 'Posisi Saya' di pojok kanan atas terlebih dahulu agar sistem mengetahui titik awal Anda!");
        lacakLokasi();
        return;
    }

    // Hapus rute lama jika sudah ada
    if (routingControl) {
        map.removeControl(routingControl);
    }

    // Buat Rute Baru
    routingControl = L.Routing.control({
        waypoints: [
            L.latLng(userCoords.lat, userCoords.lng),
            L.latLng(destLat, destLng)
        ],
        lineOptions: {
            styles: [{ color: '#2563eb', opacity: 0.9, weight: 6 }]
        },
        createMarker: () => null,
        addWaypoints: false,
        routeWhileDragging: false
    }).addTo(map);
}