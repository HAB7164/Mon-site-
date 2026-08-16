/* ============================================================
   FIREBASE-DATA.JS — Connecte la page publique à Firestore
   ------------------------------------------------------------
   Charge : réglages du site, services, projets, packs,
   témoignages, promotions, galerie.
   Si une collection est vide ou Firestore indisponible,
   le contenu par défaut ci-dessous reste affiché (rien ne casse).

   Les collections/documents attendus dans Firestore :
     config/site        → { whatsapp, phone, email, location,
                             instagram, facebook, tiktok, linkedin }
     services            (order, active, icon, title, description)
     projects             (order, active, title, category, description,
                             imageUrl, concept, whatsappMessage)
     packs                (order, active, name, forWho, priceLabel,
                             featured, features: string[])
     testimonials          (order, active, name, role, quote, rating, avatarUrl)
     promotions            (order, active, badge, title, description,
                             normalPrice, promoPrice, buttonText, imageUrl)
     gallery               (order, imageUrl)
   ============================================================ */

const firebaseConfig = {
  apiKey: "AIzaSyBBmz7Tg7ZhWde3f0WEYFDkDQE6h0B9Dlw",
  authDomain: "habib-creation-service.firebaseapp.com",
  projectId: "habib-creation-service",
  storageBucket: "habib-creation-service.firebasestorage.app",
  messagingSenderId: "676176613725",
  appId: "1:676176613725:web:22a617df879f846a5798b4"
};

let db = null;
try {
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
} catch (err) {
  console.warn("Firebase non initialisé — le site fonctionne avec le contenu par défaut.", err);
}

const SERVICE_ICONS = {
  palette: "bi-palette2", pen: "bi-vector-pen", code: "bi-code-slash",
  bag: "bi-bag-check", megaphone: "bi-megaphone", cpu: "bi-cpu",
  printer: "bi-printer-fill", camera: "bi-camera-fill", star: "bi-star-fill"
};

/* ---------- Contenu par défaut (identique à la maquette d'origine) ---------- */
const DEFAULT_SERVICES = [
  { icon: "palette", title: "Design graphique", description: "Affiches, flyers, cartes de visite, publications réseaux sociaux, packaging.", waMessage: "Bonjour Habib Création, je souhaite discuter d'un projet de design graphique." },
  { icon: "pen", title: "Identité visuelle", description: "Logo, palette de couleurs, typographie, charte graphique complète.", waMessage: "Bonjour Habib Création, je souhaite discuter d'un projet d'identité visuelle." },
  { icon: "code", title: "Création de sites web", description: "Sites vitrines, portfolios, landing pages, PWA — modernes et rapides.", waMessage: "Bonjour Habib Création, je souhaite discuter de la création de mon site web." },
  { icon: "bag", title: "E-commerce", description: "Boutiques en ligne complètes, catalogues digitaux, systèmes de commande.", waMessage: "Bonjour Habib Création, je souhaite discuter d'un projet e-commerce." },
  { icon: "megaphone", title: "Marketing & présence digitale", description: "Stratégie de contenu, visuels réseaux sociaux, cohérence de marque en ligne.", waMessage: "Bonjour Habib Création, je souhaite discuter de ma présence digitale." },
  { icon: "cpu", title: "Solutions digitales", description: "QR Code, automatisation, réservation, formulaires, outils personnalisés.", waMessage: "Bonjour Habib Création, je souhaite discuter d'une solution digitale sur mesure." }
];

const DEFAULT_PROJECTS = [
  { title: "Boutique de vêtements", category: "branding", description: "Identité de marque complète pour une boutique textile fictive.", imageUrl: "https://placehold.co/600x450/ece9ff/2a1f99?text=Boutique+Textile", concept: true },
  { title: "Site vitrine — Restaurant", category: "web", description: "Landing page moderne avec menu digital et réservation.", imageUrl: "https://placehold.co/600x450/14131c/ffffff?text=Site+Restaurant", concept: true },
  { title: "Campagne affiches — Librairie", category: "design", description: "Série d'affiches pour une campagne de rentrée littéraire.", imageUrl: "https://placehold.co/600x450/ff6a3d/ffffff?text=Affiches+Librairie", concept: true },
  { title: "QR Code menu digital", category: "digital", description: "Solution de menu digital sans contact pour un point de vente.", imageUrl: "https://placehold.co/600x450/4b3cf0/ffffff?text=QR+Menu", concept: true },
  { title: "Packaging — Marque locale", category: "branding design", description: "Système d'emballage cohérent avec l'identité visuelle de la marque.", imageUrl: "https://placehold.co/600x450/eeece5/14131c?text=Packaging", concept: true },
  { title: "Boutique en ligne", category: "web digital", description: "E-commerce complet avec catalogue produit et commande en ligne.", imageUrl: "https://placehold.co/600x450/2a1f99/ffffff?text=E-commerce", concept: true }
];

const DEFAULT_PACKS = [
  { name: "Pack Start", forWho: "Pour les petites activités", priceLabel: "Sur devis", featured: false, features: ["Logo", "Carte de visite", "5 visuels réseaux sociaux", "QR Code"] },
  { name: "Pack Business", forWho: "Pour développer une présence professionnelle", priceLabel: "Sur devis", featured: true, features: ["Identité visuelle complète", "Site web", "WhatsApp Business", "QR Code", "Visuels réseaux sociaux"] },
  { name: "Pack Digital Pro", forWho: "Pour les entreprises qui veulent aller plus loin", priceLabel: "Sur devis", featured: false, features: ["Identité complète", "Site web avancé", "Catalogue digital", "Système de commande", "Automatisation & SEO"] }
];

const DEFAULT_TESTIMONIALS = []; // aucun témoignage réel pour l'instant → on affiche les placeholders déjà présents dans le HTML

const DEFAULT_SITE_SETTINGS = {}; // vide = on garde les valeurs de config.js

/* ---------- Chargement principal ---------- */
document.addEventListener("DOMContentLoaded", loadDynamicSiteContent);

async function loadDynamicSiteContent() {
  if (!db) { renderAllFallbacks(); return; }

  await Promise.allSettled([
    loadSiteSettings(),
    loadServices(),
    loadProjects(),
    loadPacks(),
    loadTestimonials(),
    loadPromotions(),
    loadGallery()
  ]);

  // Reconnecte les comportements (liens WhatsApp, filtres, textes de marque)
  // sur tout le contenu injecté dynamiquement.
  if (typeof injectDynamicContent === "function") injectDynamicContent();
  if (typeof initWhatsAppLinks === "function") initWhatsAppLinks();
  if (typeof initFilters === "function") initFilters();

  // Signale que SITE_CONFIG (WhatsApp, réseaux sociaux, coordonnées) est à jour,
  // pour toute page qui a besoin de réagir précisément à ce moment (ex: contact.html)
  // plutôt que de deviner un délai avec setTimeout.
  window.dispatchEvent(new CustomEvent("site-config-ready"));
}

function renderAllFallbacks() {
  renderServices(DEFAULT_SERVICES);
  renderProjects(DEFAULT_PROJECTS);
  renderPacks(DEFAULT_PACKS);
  if (typeof initWhatsAppLinks === "function") initWhatsAppLinks();
  if (typeof initFilters === "function") initFilters();
}

/* ---------- Réglages du site (écrase certaines valeurs de config.js) ---------- */
async function loadSiteSettings() {
  try {
    const snap = await db.collection("config").doc("site").get();
    if (!snap.exists) return;
    const data = snap.data();
    if (data.whatsapp) SITE_CONFIG.contact.whatsapp = data.whatsapp;
    if (data.phone) SITE_CONFIG.contact.phone = data.phone;
    if (data.email) SITE_CONFIG.contact.email = data.email;
    if (data.location) SITE_CONFIG.contact.location = data.location;
    ["instagram", "facebook", "tiktok", "linkedin"].forEach(key => {
      if (data[key]) SITE_CONFIG.socials[key] = data[key];
    });

    // Visuels du hero + comparateurs "avant/après" (modifiables depuis l'onglet
    // "Visuels" de l'admin, stockés dans le même document config/site).
    applyImage("hero-image-1", data.heroImage1);
    applyImage("hero-image-2", data.heroImage2);
    applyImage("compare1-before", data.compare1Before);
    applyImage("compare1-after", data.compare1After);
    applyImage("compare2-before", data.compare2Before);
    applyImage("compare2-after", data.compare2After);
    applyText("compare1-caption", data.compare1Caption);
    applyText("compare2-caption", data.compare2Caption);
  } catch (err) {
    console.warn("Réglages du site : contenu par défaut utilisé.", err);
  }
}

function applyImage(id, src) {
  if (!src) return;
  const el = document.getElementById(id);
  if (el) el.src = src;
}
function applyText(id, text) {
  if (!text) return;
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

/* ---------- Services ---------- */
async function loadServices() {
  const grid = document.getElementById("services-grid");
  if (!grid) return;
  try {
    const snap = await db.collection("services").orderBy("order").get();
    const items = snap.docs.map(d => d.data()).filter(s => s.active !== false);
    renderServices(items.length ? items : DEFAULT_SERVICES);
  } catch (err) {
    console.warn("Services : contenu par défaut utilisé.", err);
    renderServices(DEFAULT_SERVICES);
  }
}

function renderServices(services) {
  const grid = document.getElementById("services-grid");
  if (!grid) return;
  grid.innerHTML = services.map(s => `
    <a href="#" data-wa-message="${escapeAttr(s.waMessage || ("Bonjour Habib Création, je souhaite discuter du service : " + (s.title || "")))}" class="service-card">
      <div class="service-icon"><i class="bi ${SERVICE_ICONS[s.icon] || SERVICE_ICONS.star}"></i></div>
      <h3>${escapeHtml(s.title || "")}</h3>
      <p>${escapeHtml(s.description || "")}</p>
      <span class="service-cta">Discuter du projet <i class="bi bi-arrow-right"></i></span>
    </a>
  `).join("");
}

/* ---------- Projets ---------- */
async function loadProjects() {
  const grid = document.getElementById("home-projects");
  if (!grid) return;
  try {
    const snap = await db.collection("projects").orderBy("order").get();
    const items = snap.docs.map(d => d.data()).filter(p => p.active !== false);
    renderProjects(items.length ? items : DEFAULT_PROJECTS);
  } catch (err) {
    console.warn("Projets : contenu par défaut utilisé.", err);
    renderProjects(DEFAULT_PROJECTS);
  }
}

function renderProjects(projects) {
  const grid = document.getElementById("home-projects");
  if (!grid) return;
  grid.innerHTML = projects.map(p => `
    <div class="project-card" data-category="${escapeAttr(p.category || "")}">
      <div class="project-media">
        <img src="${escapeAttr(p.imageUrl || "https://placehold.co/600x450/eeece5/8f8d9c?text=Projet")}" alt="${escapeAttr(p.title || "Projet")}" loading="lazy">
        <span class="project-tag">${escapeHtml(capitalize((p.category || "").split(" ")[0]))}</span>
        ${p.concept !== false ? '<span class="project-concept-badge">Concept</span>' : ""}
      </div>
      <div class="project-body">
        <h3>${escapeHtml(p.title || "")}</h3>
        <p>${escapeHtml(p.description || "")}</p>
        <a href="#" data-wa-message="${escapeAttr(p.whatsappMessage || ("Bonjour Habib Création, le projet « " + (p.title || "") + " » m'intéresse, je souhaite un projet similaire."))}" class="project-link">Voir le projet <i class="bi bi-arrow-up-right"></i></a>
      </div>
    </div>
  `).join("");
}
function capitalize(str) { return str ? str.charAt(0).toUpperCase() + str.slice(1) : ""; }

/* ---------- Packs ---------- */
async function loadPacks() {
  const grid = document.getElementById("packs-grid");
  if (!grid) return;
  try {
    const snap = await db.collection("packs").orderBy("order").get();
    const items = snap.docs.map(d => d.data()).filter(p => p.active !== false);
    renderPacks(items.length ? items : DEFAULT_PACKS);
  } catch (err) {
    console.warn("Packs : contenu par défaut utilisé.", err);
    renderPacks(DEFAULT_PACKS);
  }
}

function renderPacks(packs) {
  const grid = document.getElementById("packs-grid");
  if (!grid) return;
  grid.innerHTML = packs.map(p => `
    <div class="pack-card ${p.featured ? "featured" : ""}">
      ${p.featured ? '<span class="pack-featured-badge">Le plus demandé</span>' : ""}
      <p class="pack-for">${escapeHtml(p.forWho || "")}</p>
      <h3>${escapeHtml(p.name || "")}</h3>
      <p class="pack-price">${escapeHtml(p.priceLabel || "Sur devis")}</p>
      <ul class="pack-list">
        ${(p.features || []).map(f => `<li>${escapeHtml(f)}</li>`).join("")}
      </ul>
      <a href="#" data-wa-message="Bonjour Habib Création, le ${escapeAttr(p.name || "pack")} m'intéresse, pouvez-vous me donner plus d'informations ?" class="btn ${p.featured ? "btn-accent" : "btn-ghost"} btn-block">Demander ce pack</a>
    </div>
  `).join("");
}

/* ---------- Témoignages ---------- */
async function loadTestimonials() {
  const grid = document.getElementById("testi-grid");
  if (!grid) return;
  try {
    const snap = await db.collection("testimonials").orderBy("order").get();
    const items = snap.docs.map(d => d.data()).filter(t => t.active !== false);
    if (items.length) renderTestimonials(items);
    // sinon : on laisse les placeholders déjà présents dans le HTML
  } catch (err) {
    console.warn("Témoignages : placeholders conservés.", err);
  }
}

function renderTestimonials(testimonials) {
  const grid = document.getElementById("testi-grid");
  const note = document.getElementById("testi-note");
  if (!grid) return;
  if (note) note.style.display = "none";
  grid.innerHTML = testimonials.map(t => `
    <div class="testi-card">
      <div class="testi-stars">${"★".repeat(Math.max(1, Math.min(5, t.rating || 5)))}${"☆".repeat(5 - Math.max(1, Math.min(5, t.rating || 5)))}</div>
      <p class="quote">« ${escapeHtml(t.quote || "")} »</p>
      <div class="testi-person">
        <div class="testi-avatar"><img src="${escapeAttr(t.avatarUrl || "https://placehold.co/80x80/eeece5/8f8d9c?text=%3F")}" alt="${escapeAttr(t.name || "Client")}"></div>
        <div><div class="testi-name">${escapeHtml(t.name || "")}</div><div class="testi-role">${escapeHtml(t.role || "")}</div></div>
      </div>
    </div>
  `).join("");
}

/* ---------- Promotions (bandeau flottant + section dédiée) ---------- */
const PROMO_DISMISS_KEY = "promo-dismissed-id";

async function loadPromotions() {
  try {
    const snap = await db.collection("promotions").orderBy("order").get();
    const items = snap.docs.map(d => d.data()).filter(p => p.active !== false);
    if (items.length) renderPromoFloat(items);
  } catch (err) {
    console.warn("Promotions : aucune promotion affichée.", err);
  }
}

function renderPromoFloat(promotions) {
  const el = document.getElementById("promo-float");
  if (!el) return;
  const promo = promotions[0];
  const promoId = [promo.title, promo.promoPrice].join("|");
  if (sessionStorage.getItem(PROMO_DISMISS_KEY) === promoId) return;

  el.querySelector(".promo-img").src = promo.imageUrl || "https://placehold.co/600x400/4b3cf0/ffffff?text=Promotion";
  el.querySelector(".promo-badge").textContent = promo.badge || "Promo";
  el.querySelector(".promo-title").textContent = promo.title || "Offre spéciale";
  const descEl = el.querySelector(".promo-desc");
  descEl.textContent = promo.description || "";
  descEl.style.display = promo.description ? "" : "none";
  const oldEl = el.querySelector(".promo-price-old");
  oldEl.textContent = promo.normalPrice || "";
  oldEl.style.display = promo.normalPrice ? "" : "none";
  el.querySelector(".promo-price-new").textContent = promo.promoPrice || "";
  const cta = el.querySelector(".promo-cta");
  cta.textContent = promo.buttonText || "Profiter de l'offre";
  cta.href = buildWhatsAppLink(`Bonjour Habib Création, l'offre « ${promo.title || "promotion"} » m'intéresse.`);
  cta.target = "_blank"; cta.rel = "noopener";

  el.querySelector(".promo-close").addEventListener("click", () => {
    sessionStorage.setItem(PROMO_DISMISS_KEY, promoId);
    el.classList.remove("enter");
    setTimeout(() => el.classList.remove("show"), 300);
  });

  el.classList.add("show");
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("enter")));
}

/* ---------- Galerie (réservée à un usage futur — chargée mais pas encore affichée) ---------- */
async function loadGallery() {
  try {
    const snap = await db.collection("gallery").orderBy("order").get();
    window.__habibGallery = snap.docs.map(d => d.data());
  } catch (err) {
    window.__habibGallery = [];
  }
}
