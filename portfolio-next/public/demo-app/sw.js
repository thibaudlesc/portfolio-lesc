const CACHE_NAME = 'recoltiq-cache-v21'; // J'augmente ENCORE la version, c'est crucial

self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting()); // On force l'installation
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        // On supprime TOUS les anciens caches de l'application
        cacheNames.filter(name => name.startsWith('recoltiq-cache-')).map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// On laisse le réseau gérer les requêtes pour le moment pour être sûr de tout débloquer
self.addEventListener('fetch', event => {
  return;
});