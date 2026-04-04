// firebase-messaging-sw.js

// Ce fichier est requis par Firebase Cloud Messaging.
// Il doit être placé à la racine de votre site.

// Importe et initialise le SDK Firebase.
importScripts('https://www.gstatic.com/firebasejs/11.6.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.6.1/firebase-messaging-compat.js');

// --- Configuration Firebase ---
// NOTE : Ces informations sont sécuritaires à exposer côté client.
const firebaseConfig = {
  apiKey: "AIzaSyAjjlYYQve4h38Gz3EPkL_hbazty_mXQRM",
  authDomain: "recolt-iq-768a9.firebaseapp.com",
  projectId: "recolt-iq-768a9",
  storageBucket: "recolt-iq-768a9.firebasestorage.app", 
  messagingSenderId: "205280092454",
  appId: "1:205280092454:web:783c75310c71270c6321e7",
  measurementId: "G-4FFJLY724Q"
};

// Initialise l'application Firebase
firebase.initializeApp(firebaseConfig);

// Récupère une instance de Firebase Messaging pour pouvoir gérer
// les messages en arrière-plan.
const messaging = firebase.messaging();

// Gérer les notifications en arrière-plan.
messaging.onBackgroundMessage((payload) => {
  console.log(
    '[firebase-messaging-sw.js] Received background message ',
    payload,
  );
  
  // Personnalisez la notification ici.
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/apple-touch-icon.png', // Assurez-vous que cette icône existe
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});