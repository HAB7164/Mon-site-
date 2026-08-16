/* ============================================================
   ADMIN-CRUD.JS — Moteur générique de gestion de contenu
   ------------------------------------------------------------
   Une seule implémentation générique (au lieu de dupliquer le
   code pour Services / Projets / Packs / Témoignages / Promotions).
   Chaque section décrit juste ses champs ("schema") et le moteur
   se charge du rendu, de l'enregistrement, de la suppression et
   du réordonnancement dans Firestore.
   ============================================================ */

function resizeImageToBase64(file, maxSize = 700, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxSize) { height = Math.round((height * maxSize) / width); width = maxSize; }
        else if (height > maxSize) { width = Math.round((width * maxSize) / height); height = maxSize; }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : String(str);
  return div.innerHTML;
}
function escapeAttr(str) { return escapeHtml(str).replace(/"/g, "&quot;"); }

function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2400);
}

/* ------------------------------------------------------------
   Construit une section CRUD complète.
   schema: [{ key, label, type: 'text'|'textarea'|'checkbox'|'select'|'image'|'categories'|'features',
              placeholder?, options?, required?, half? (affiche 2 colonnes) }]
   ------------------------------------------------------------ */
function createCrudSection({ db, collectionName, listElId, addBtnId, schema, defaults, requiredKeys = [], summaryKey }) {
  const list = document.getElementById(listElId);
  const addBtn = document.getElementById(addBtnId);

  const CATEGORY_OPTIONS = [
    { value: "design", label: "Design" },
    { value: "branding", label: "Branding" },
    { value: "web", label: "Web" },
    { value: "digital", label: "Digital" }
  ];

  function fieldControl(field, value) {
    const v = value == null ? "" : value;
    switch (field.type) {
      case "textarea":
        return `<textarea rows="${field.rows || 2}" class="w-full mt-1 px-3.5 py-2.5 f-${field.key}" placeholder="${escapeAttr(field.placeholder || "")}">${escapeHtml(v)}</textarea>`;
      case "checkbox":
        return `<label class="text-xs flex items-center gap-2 font-medium" style="color:var(--ink-soft)"><input type="checkbox" class="f-${field.key}" ${v ? "checked" : ""}/> ${escapeHtml(field.label)}</label>`;
      case "select":
        return `<select class="w-full mt-1 px-3.5 py-2.5 f-${field.key}">${(field.options || []).map(o => `<option value="${escapeAttr(o.value)}" ${String(v) === String(o.value) ? "selected" : ""}>${escapeHtml(o.label)}</option>`).join("")}</select>`;
      case "categories":
        return `<div class="flex flex-wrap gap-3 mt-1">${CATEGORY_OPTIONS.map(o => `<label class="text-xs flex items-center gap-1.5" style="color:var(--ink-soft)"><input type="checkbox" class="f-${field.key}-item" value="${o.value}" ${(v || "").split(" ").includes(o.value) ? "checked" : ""}/> ${o.label}</label>`).join("")}</div>`;
      case "features":
        return `<textarea rows="${field.rows || 4}" class="w-full mt-1 px-3.5 py-2.5 f-${field.key}" placeholder="Un avantage par ligne">${escapeHtml((v || []).join("\n"))}</textarea>`;
      case "image":
        return `
          <div class="gallery-thumb" style="aspect-ratio:4/3; max-width:180px;">
            <img class="f-${field.key}-preview" src="${escapeAttr(v || "https://placehold.co/400x300/ecebfc/2a1f99?text=Image")}" alt="Aperçu" />
          </div>
          <input type="file" accept="image/*" class="f-${field.key}-file w-full text-xs mt-2" />`;
      default:
        return `<input type="text" class="w-full mt-1 px-3.5 py-2.5 f-${field.key}" value="${escapeAttr(v)}" placeholder="${escapeAttr(field.placeholder || "")}" />`;
    }
  }

  function renderRow(item) {
    const row = document.createElement("div");
    row.className = "border rounded-2xl p-4 sm:p-5";
    row.style.borderColor = "var(--ring)";
    row.dataset.id = item.id || "";
    row.dataset.order = item.order || 99;

    const imageFields = schema.filter(f => f.type === "image");
    const otherFields = schema.filter(f => f.type !== "image");

    let html = `<div class="flex flex-col sm:flex-row gap-4 mb-4">`;

    if (imageFields.length) {
      html += `<div class="w-full sm:w-40 shrink-0 space-y-3">`;
      imageFields.forEach(f => { html += `<div>${fieldControl(f, item[f.key])}</div>`; });
      html += `</div>`;
    }

    html += `<div class="flex-1 grid gap-3">`;
    let i = 0;
    while (i < otherFields.length) {
      const f = otherFields[i];
      if (f.half && otherFields[i + 1] && otherFields[i + 1].half) {
        html += `<div class="grid sm:grid-cols-2 gap-3">
          <div class="field"><label>${escapeHtml(f.label)}</label>${fieldControl(f, item[f.key])}</div>
          <div class="field"><label>${escapeHtml(otherFields[i + 1].label)}</label>${fieldControl(otherFields[i + 1], item[otherFields[i + 1].key])}</div>
        </div>`;
        i += 2;
      } else if (f.type === "checkbox") {
        html += `<div class="field">${fieldControl(f, item[f.key])}</div>`;
        i += 1;
      } else {
        html += `<div class="field"><label>${escapeHtml(f.label)}</label>${fieldControl(f, item[f.key])}</div>`;
        i += 1;
      }
    }
    html += `</div></div>`;

    html += `<div class="flex flex-wrap items-center gap-4 justify-between pt-1">
      <label class="text-xs flex items-center gap-2 font-medium" style="color:var(--ink-soft)">
        <input type="checkbox" class="f-active" ${item.active !== false ? "checked" : ""}/> Actif (visible sur le site)
      </label>
      <div class="flex gap-2">
        <button class="btn-ghost px-3 py-1.5 text-xs act-up" title="Monter">↑</button>
        <button class="btn-ghost px-3 py-1.5 text-xs act-down" title="Descendre">↓</button>
        <button class="btn-grad px-4 py-1.5 text-xs act-save">Enregistrer</button>
        <button class="btn-ghost px-3 py-1.5 text-xs act-delete">Supprimer</button>
      </div>
    </div>`;

    row.innerHTML = html;

    imageFields.forEach(f => {
      row.querySelector(`.f-${f.key}-file`).addEventListener("change", async e => {
        const file = e.target.files[0];
        if (!file) return;
        const base64 = await resizeImageToBase64(file);
        row.dataset[f.key] = base64;
        row.querySelector(`.f-${f.key}-preview`).src = base64;
      });
      if (item[f.key]) row.dataset[f.key] = item[f.key];
    });

    row.querySelector(".act-save").addEventListener("click", () => saveRow(row));
    row.querySelector(".act-delete").addEventListener("click", () => deleteRow(row));
    row.querySelector(".act-up").addEventListener("click", () => moveRow(row, -1));
    row.querySelector(".act-down").addEventListener("click", () => moveRow(row, 1));

    list.appendChild(row);
  }

  function readPayload(row) {
    const payload = { active: row.querySelector(".f-active").checked, order: Number(row.dataset.order) || 1 };
    schema.forEach(f => {
      if (f.type === "checkbox") payload[f.key] = row.querySelector(`.f-${f.key}`).checked;
      else if (f.type === "categories") {
        const checked = [...row.querySelectorAll(`.f-${f.key}-item`)].filter(c => c.checked).map(c => c.value);
        payload[f.key] = checked.join(" ");
      } else if (f.type === "features") {
        payload[f.key] = row.querySelector(`.f-${f.key}`).value.split("\n").map(s => s.trim()).filter(Boolean);
      } else if (f.type === "image") {
        payload[f.key] = row.dataset[f.key] || "";
      } else {
        payload[f.key] = row.querySelector(`.f-${f.key}`).value.trim();
      }
    });
    return payload;
  }

  async function saveRow(row) {
    const payload = readPayload(row);
    for (const key of requiredKeys) {
      if (!payload[key]) { showToast(`Le champ « ${key} » est obligatoire`); return; }
    }
    try {
      if (row.dataset.id) {
        await db.collection(collectionName).doc(row.dataset.id).set(payload, { merge: true });
      } else {
        const ref = await db.collection(collectionName).add(payload);
        row.dataset.id = ref.id;
      }
      showToast("Enregistré ✓");
    } catch (err) {
      showToast("Erreur — vérifiez la configuration Firebase");
      console.error(err);
    }
  }

  async function deleteRow(row) {
    if (!confirm("Supprimer cet élément ?")) return;
    try {
      if (row.dataset.id) await db.collection(collectionName).doc(row.dataset.id).delete();
      row.remove();
      showToast("Supprimé");
    } catch (err) {
      showToast("Erreur lors de la suppression");
      console.error(err);
    }
  }

  function moveRow(row, direction) {
    const sibling = direction < 0 ? row.previousElementSibling : row.nextElementSibling;
    if (!sibling) return;
    if (direction < 0) list.insertBefore(row, sibling);
    else list.insertBefore(sibling, row);
    reindexOrders();
  }

  async function reindexOrders() {
    const rows = [...list.children];
    const updates = rows.map((row, i) => {
      row.dataset.order = i + 1;
      if (row.dataset.id) return db.collection(collectionName).doc(row.dataset.id).set({ order: i + 1 }, { merge: true });
      return Promise.resolve();
    });
    try { await Promise.all(updates); } catch (err) { console.warn("Erreur de réordonnancement :", err); }
  }

  async function loadAll() {
    list.innerHTML = "";
    try {
      const snap = await db.collection(collectionName).orderBy("order").get();
      snap.docs.forEach(doc => renderRow({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.warn(`Impossible de charger « ${collectionName} » :`, err);
    }
  }

  if (addBtn) {
    addBtn.addEventListener("click", () => {
      const count = list.children.length;
      renderRow({ id: "", ...defaults, order: count + 1, active: true });
    });
  }

  return { loadAll };
}
