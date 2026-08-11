// ============================================================
// SERVICE WORKER — Habib Création
// À déposer à la RACINE de l'hébergement (même dossier que Client.html),
// car Chrome/Android exige un service worker enregistré pour proposer
// l'invite d'installation native (bouton "Installer" du site).
// ============================================================

const CACHE_NAME = "habib-creation-cache-v2";

// Fichiers de l'app shell mis en cache dès l'installation.
// (Les données du site — profil, promos, services… — viennent de Firebase
// en temps réel et ne sont donc pas mises en cache ici.)
const APP_SHELL = [
  "/Client.html",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch((err) => console.warn("Mise en cache initiale impossible :", err))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // On ne gère que les requêtes de lecture (GET) ; le reste (écritures Firestore, etc.) part directement sur le réseau.
  if (request.method !== "GET") return;

  // Navigation (chargement de page HTML) : réseau en priorité, cache en secours si hors connexion.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match("/Client.html")))
    );
    return;
  }

  // Autres ressources (styles, scripts, images, polices…) : cache en priorité pour la rapidité,
  // avec mise à jour silencieuse en arrière-plan à chaque visite.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
