// ------------------------
// Firebase Initialization
// ------------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

// Your Firebase config
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ------------------------
// Report Form Submission
// ------------------------
const reportForm = document.getElementById("reportForm");
reportForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value;
  const phone = document.getElementById("phone").value;
  const location = document.getElementById("location").value;
  const description = document.getElementById("description").value;

  try {
    await addDoc(collection(db, "reports"), {
      name,
      phone,
      location,
      description,
      status: "Pending",
      timestamp: new Date()
    });

    alert("Report submitted successfully!");
    reportForm.reset();
    loadReports();
  } catch (error) {
    console.error("Error submitting report:", error);
  }
});

// ------------------------
// Load Recent Reports
// ------------------------
const recentList = document.getElementById("recentList");
const totalReports = document.getElementById("totalReports");
const fixedReports = document.getElementById("fixedReports");
const pendingReports = document.getElementById("pendingReports");

async function loadReports() {
  recentList.innerHTML = "";
  const q = query(collection(db, "reports"), orderBy("timestamp", "desc"));
  const snapshot = await getDocs(q);

  let total = 0, fixed = 0, pending = 0;

  snapshot.forEach(doc => {
    const data = doc.data();
    total++;
    if(data.status === "Fixed") fixed++;
    else pending++;

    const li = document.createElement("li");
    li.innerHTML = `<strong>${data.location}</strong> - ${data.description} <span class="status">${data.status}</span>`;
    recentList.appendChild(li);
  });

  totalReports.textContent = total;
  fixedReports.textContent = fixed;
  pendingReports.textContent = pending;
}

// Initial load
loadReports();

// ------------------------
// Google Maps Initialization
// ------------------------
let map;
window.initMap = function() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 25.57, lng: 91.88 }, // default: Shillong
    zoom: 12
  });

  // Place markers from Firestore
  loadReportsForMap();
};

async function loadReportsForMap() {
  const snapshot = await getDocs(collection(db, "reports"));

  snapshot.forEach(doc => {
    const data = doc.data();
    if(data.location) {
      const marker = new google.maps.Marker({
        position: getLatLngFromLocation(data.location), // Replace with geocoding if needed
        map: map,
        title: data.description
      });
    }
  });
}

// Dummy function: convert location string to lat/lng
function getLatLngFromLocation(location) {
  // For real app: integrate Google Geocoding API
  // Placeholder: random nearby coords
  return { lat: 25.57 + Math.random() * 0.01, lng: 91.88 + Math.random() * 0.01 };
}

// ------------------------
// Phone Login
// ------------------------
const loginBtn = document.getElementById("loginBtn");

loginBtn.addEventListener("click", () => {
  const phoneNumber = prompt("Enter your phone number with country code (+91...)");
  if(!phoneNumber) return;

  window.recaptchaVerifier = new RecaptchaVerifier('loginBtn', {
    'size': 'invisible'
  }, auth);

  signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier)
    .then(confirmationResult => {
      const code = prompt("Enter the OTP sent to your phone");
      return confirmationResult.confirm(code);
    })
    .then(result => {
      alert("Logged in successfully!");
    })
    .catch(error => {
      console.error("Phone login error:", error);
    });
});
