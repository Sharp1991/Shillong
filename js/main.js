// Initialize the Leaflet map
const map = L.map('map').setView([25.5788, 91.8933], 13); // Shillong default

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Store markers and reports
let reports = [];

// Add marker when user clicks on the map
map.on('click', function(e) {
  const { lat, lng } = e.latlng;
  const newMarker = L.marker([lat, lng], { icon: redIcon }).addTo(map);
  reports.push({ lat, lng, status: "reported" });
  updateStats();
});

// Custom marker icons
const redIcon = L.icon({
  iconUrl: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const greenIcon = L.icon({
  iconUrl: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

// ===== FORM HANDLING =====
const reportForm = document.querySelector("#reportForm");

reportForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const issueDesc = document.querySelector("#issueDesc").value.trim();
  const phone = document.querySelector("#phone").value.trim();
  const imageFile = document.querySelector("#image").files[0];

  if (!issueDesc || !phone) {
    alert("Please fill in all mandatory fields.");
    return;
  }

  // Image preview/upload simulation (to be replaced with Firebase)
  let imageUrl = "";
  if (imageFile) {
    imageUrl = URL.createObjectURL(imageFile);
  }

  // Add issue marker on map
  const center = map.getCenter();
  const marker = L.marker([center.lat, center.lng], { icon: redIcon })
    .addTo(map)
    .bindPopup(`<b>Issue:</b> ${issueDesc}<br><b>Phone:</b> ${phone}`)
    .openPopup();

  reports.push({ issueDesc, phone, lat: center.lat, lng: center.lng, status: "reported", imageUrl });

  // Clear form
  reportForm.reset();
  alert("Issue reported successfully!");
  updateStats();

  // (Next Step) — Send to Firebase or Email service here
});

// ===== STATISTICS =====
function updateStats() {
  const total = reports.length;
  const fixed = reports.filter(r => r.status === "fixed").length;
  const pending = total - fixed;

  document.getElementById("totalCount").textContent = total;
  document.getElementById("fixedCount").textContent = fixed;
  document.getElementById("pendingCount").textContent = pending;
}

// ===== INITIAL STATS =====
updateStats();
