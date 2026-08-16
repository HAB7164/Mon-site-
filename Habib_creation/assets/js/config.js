/* ============================================================
   CONFIGURATION CENTRALE — HABIB CRÉATION
   ------------------------------------------------------------
   👉 C'est LE fichier à modifier pour mettre à jour les infos
   du site (numéro WhatsApp, réseaux sociaux, email...).
   Il n'y a rien d'autre à toucher ailleurs dans le code pour ça.
   ============================================================ */

const SITE_CONFIG = {
  brand: {
    name: "Habib Création",
    tagline: "Studio créatif & digital",
    url: "https://habib-creation-service.web.app"
  },

  contact: {
    // ⚠️ À REMPLACER : numéro WhatsApp au format international, SANS "+" ni espaces.
    // Exemple réel : "22790000000"
    whatsapp: "227XXXXXXXX",
    // Message pré-rempli par défaut quand un visiteur clique sur un bouton WhatsApp générique
    whatsappDefaultMessage: "Bonjour Habib Création, je souhaite discuter d'un projet.",
    // ⚠️ À REMPLACER : numéro affiché pour les appels (peut être identique au WhatsApp)
    phone: "+227 XX XX XX XX",
    // ⚠️ À REMPLACER
    email: "contact@habibcreation.example",
    // ⚠️ À REMPLACER si vous avez une adresse/zone d'intervention à afficher
    location: "Niamey, Niger"
  },

  socials: {
    // Laissez la valeur vide "" pour masquer automatiquement l'icône correspondante.
    instagram: "", // ex: "https://instagram.com/habib.creation"
    facebook: "",  // ex: "https://facebook.com/habib.creation"
    tiktok: "",    // ex: "https://tiktok.com/@habib.creation"
    linkedin: ""   // ex: "https://linkedin.com/company/habib-creation"
  },

  seo: {
    defaultTitleSuffix: " · Habib Création",
    defaultDescription:
      "Habib Création — studio créatif & digital à Niamey. Graphisme, identité visuelle, création de sites web, e-commerce et solutions digitales pour les entreprises."
  }
};

/* ------------------------------------------------------------
   Construit un lien WhatsApp avec un message pré-rempli.
   Utilisé par tous les boutons "Discuter sur WhatsApp" du site.
   ------------------------------------------------------------ */
function buildWhatsAppLink(message) {
  const text = message || SITE_CONFIG.contact.whatsappDefaultMessage;
  return `https://wa.me/${SITE_CONFIG.contact.whatsapp}?text=${encodeURIComponent(text)}`;
}
