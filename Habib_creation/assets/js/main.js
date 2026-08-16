/* ============================================================
   COMPORTEMENTS PARTAGÉS — HABIB CRÉATION
   Chargé sur toutes les pages, après config.js
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  injectDynamicContent();
  initNavbar();
  initMobileMenu();
  initReveal();
  initCompareSliders();
  initWhatsAppLinks();
  initFilters();
  document.querySelectorAll("[data-year]").forEach(el => el.textContent = new Date().getFullYear());
});

/* ---------- Remplit le nom de marque, tagline etc. depuis config.js ---------- */
function injectDynamicContent() {
  document.querySelectorAll("[data-brand-name]").forEach(el => el.textContent = SITE_CONFIG.brand.name);
  document.querySelectorAll("[data-brand-tagline]").forEach(el => el.textContent = SITE_CONFIG.brand.tagline);
  document.querySelectorAll("[data-contact-phone]").forEach(el => el.textContent = SITE_CONFIG.contact.phone);
  document.querySelectorAll("[data-contact-email]").forEach(el => el.textContent = SITE_CONFIG.contact.email);
  document.querySelectorAll("[data-contact-location]").forEach(el => el.textContent = SITE_CONFIG.contact.location);

  // Réseaux sociaux : n'affiche que ceux renseignés dans config.js
  document.querySelectorAll("[data-social-list]").forEach(container => {
    const icons = { instagram: "bi-instagram", facebook: "bi-facebook", tiktok: "bi-tiktok", linkedin: "bi-linkedin" };
    let html = "";
    Object.keys(icons).forEach(key => {
      const url = SITE_CONFIG.socials[key];
      if (!url) return;
      html += `<a href="${url}" target="_blank" rel="noopener" class="footer-social-btn" aria-label="${key}"><i class="bi ${icons[key]}"></i></a>`;
    });
    container.innerHTML = html || "";
  });
}

/* ---------- Navbar : devient opaque après un léger scroll ---------- */
function initNavbar() {
  const nav = document.querySelector(".navbar");
  if (!nav) return;
  const toggle = () => nav.classList.toggle("scrolled", window.scrollY > 24);
  toggle();
  window.addEventListener("scroll", toggle, { passive: true });
}

/* ---------- Menu mobile plein écran ---------- */
function initMobileMenu() {
  const burger = document.querySelector(".nav-burger");
  const menu = document.querySelector(".mobile-menu");
  if (!burger || !menu) return;
  const closeBtn = menu.querySelector(".mobile-menu-close");
  const links = menu.querySelectorAll("a");

  const open = () => { menu.classList.add("open"); document.body.style.overflow = "hidden"; burger.innerHTML = '<i class="bi bi-x-lg"></i>'; };
  const close = () => { menu.classList.remove("open"); document.body.style.overflow = ""; burger.innerHTML = '<i class="bi bi-list"></i>'; };

  burger.addEventListener("click", () => menu.classList.contains("open") ? close() : open());
  if (closeBtn) closeBtn.addEventListener("click", close);
  links.forEach(l => l.addEventListener("click", close));
}

/* ---------- Apparition au scroll (discrète, respecte prefers-reduced-motion) ---------- */
function initReveal() {
  const items = document.querySelectorAll("[data-reveal]");
  if (!items.length) return;
  if (!("IntersectionObserver" in window)) { items.forEach(el => el.classList.add("in")); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  items.forEach(el => io.observe(el));
}

/* ---------- Curseur "avant / après" (glisser pour comparer) ---------- */
function initCompareSliders() {
  document.querySelectorAll(".compare-wrap").forEach(wrap => {
    const after = wrap.querySelector(".compare-after");
    const divider = wrap.querySelector(".compare-divider");
    const handle = wrap.querySelector(".compare-handle");
    const range = wrap.querySelector(".compare-slider");
    if (!after || !range) return;
    const update = (val) => {
      after.style.clipPath = `inset(0 0 0 ${val}%)`;
      if (divider) divider.style.left = val + "%";
      if (handle) handle.style.left = val + "%";
    };
    range.addEventListener("input", (e) => update(e.target.value));
    update(range.value || 50);
  });
}

/* ---------- Câble tous les [data-wa-message] vers un lien WhatsApp pré-rempli ---------- */
function initWhatsAppLinks() {
  document.querySelectorAll("[data-wa-message]").forEach(el => {
    const msg = el.getAttribute("data-wa-message");
    el.setAttribute("href", buildWhatsAppLink(msg));
    el.setAttribute("target", "_blank");
    el.setAttribute("rel", "noopener");
  });
  document.querySelectorAll("[data-wa-generic]").forEach(el => {
    el.setAttribute("href", buildWhatsAppLink());
    el.setAttribute("target", "_blank");
    el.setAttribute("rel", "noopener");
  });
}

/* ---------- Helpers d'échappement (réutilisés par firebase-data.js) ---------- */
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : String(str);
  return div.innerHTML;
}
function escapeAttr(str) { return escapeHtml(str).replace(/"/g, "&quot;"); }

/* ---------- Filtres de catégories (projets) ----------
   Les éléments filtrés sont recherchés au moment du clic (et non au chargement
   de la page) afin de fonctionner même si le contenu a été ajouté après coup
   depuis Firestore (voir firebase-data.js). Ne pas mettre en cache la liste. */
function initFilters() {
  document.querySelectorAll("[data-filter-group]").forEach(group => {
    if (group.dataset.filterBound === "1") return; // évite les doublons si ré-appelé
    group.dataset.filterBound = "1";
    const buttons = group.querySelectorAll(".filter-btn");
    const targetSelector = group.getAttribute("data-filter-target");
    buttons.forEach(btn => {
      btn.addEventListener("click", () => {
        buttons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const value = btn.getAttribute("data-filter");
        document.querySelectorAll(targetSelector).forEach(item => {
          const cats = (item.getAttribute("data-category") || "").split(" ");
          item.style.display = (value === "all" || cats.includes(value)) ? "" : "none";
        });
      });
    });
  });
}
