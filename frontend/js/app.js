/* ============================================================
   Campus Lost & Found — frontend application logic
   Talks to the Django REST Framework API for all CRUD operations.
   ============================================================ */

// Automatically adapt between local separate frontend server and cloud production
const API_BASE =
  window.location.port === "5500"
    ? "http://127.0.0.1:8000/api"
    : `${window.location.origin}/api`;

const CATEGORIES = [
  "Electronics",
  "Documents",
  "Accessories",
  "Books & Stationery",
  "Clothing",
  "Bags",
  "ID Cards",
  "Keys",
  "Other",
];

const CATEGORY_ICONS = {
  Electronics: "💻",
  Documents: "📄",
  Accessories: "⌚",
  "Books & Stationery": "📚",
  Clothing: "👕",
  Bags: "🎒",
  "ID Cards": "🪪",
  Keys: "🔑",
  Other: "📦",
};

let state = {
  items: [],
  count: 0,
  next: null,
  previous: null,
  page: 1,
  view: "cards",
};

// ---------------------------------------------------------------
// Init
// ---------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  populateCategorySelects();
  setDefaultDates();
  wireNav();
  wireForms();
  wireBrowseControls();
  wireModals();
  navigateTo(currentHash() || "home");
  fetchItems();
});

function populateCategorySelects() {
  const selects = document.querySelectorAll(
    "#lost_category, #found_category, #edit_category"
  );
  selects.forEach((sel) => {
    sel.innerHTML =
      '<option value="">Select category</option>' +
      CATEGORIES.map((c) => `<option value="${c}">${c}</option>`).join("");
  });

  const filterCat = document.getElementById("filterCategory");
  filterCat.innerHTML =
    '<option value="">All Categories</option>' +
    CATEGORIES.map((c) => `<option value="${c}">${c}</option>`).join("");
}

function setDefaultDates() {
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("lost_date").max = today;
  document.getElementById("found_date").max = today;
  document.getElementById("edit_date").max = today;
}

// ---------------------------------------------------------------
// Navigation (single-page section switching)
// ---------------------------------------------------------------
function currentHash() {
  return window.location.hash.replace("#", "");
}

function wireNav() {
  document.querySelectorAll("[data-nav]").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const target = link.getAttribute("data-nav");
      window.location.hash = target;
      navigateTo(target);
      document.getElementById("navLinks").classList.remove("open");
    });
  });

  document.getElementById("navToggle").addEventListener("click", () => {
    document.getElementById("navLinks").classList.toggle("open");
  });

  window.addEventListener("hashchange", () => navigateTo(currentHash()));
}

function navigateTo(pageId) {
  const validPages = ["home", "report-lost", "report-found", "browse", "about"];
  if (!validPages.includes(pageId)) pageId = "home";

  document.querySelectorAll(".page").forEach((p) => p.classList.remove("active-page"));
  const target = document.getElementById(pageId);
  if (target) target.classList.add("active-page");

  document.querySelectorAll("[data-nav]").forEach((link) => {
    link.classList.toggle("active", link.getAttribute("data-nav") === pageId);
  });

  if (pageId === "browse") fetchItems();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ---------------------------------------------------------------
// Toast messages
// ---------------------------------------------------------------
let toastTimer;
function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3500);
}

// ---------------------------------------------------------------
// Form validation helpers
// ---------------------------------------------------------------
function clearFormErrors(form) {
  form.querySelectorAll(".field-error").forEach((el) => (el.textContent = ""));
  form.querySelectorAll(".invalid").forEach((el) => el.classList.remove("invalid"));
}

function applyServerErrors(form, errors) {
  Object.entries(errors).forEach(([field, messages]) => {
    const errEl = form.querySelector(`[data-error-for="${field}"]`);
    const inputEl = form.querySelector(`[name="${field}"]`);
    const msg = Array.isArray(messages) ? messages.join(" ") : String(messages);
    if (errEl) errEl.textContent = msg;
    if (inputEl) inputEl.classList.add("invalid");
  });
}

function validateClientSide(form) {
  const errors = {};
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const get = (name) => (form.querySelector(`[name="${name}"]`)?.value || "").trim();

  if (!get("item_name")) errors.item_name = ["Item name is required."];
  if (!get("category")) errors.category = ["Please select a category."];
  if (!get("location")) errors.location = ["Location is required."];
  if (!get("date")) errors.date = ["Date is required."];
  if (!get("contact_name")) errors.contact_name = ["Your name is required."];

  const email = get("contact_email");
  if (!email) {
    errors.contact_email = ["Email is required."];
  } else if (!emailRe.test(email)) {
    errors.contact_email = ["Enter a valid email address."];
  }

  return errors;
}

// ---------------------------------------------------------------
// Report Lost / Report Found forms
// ---------------------------------------------------------------
function wireForms() {
  document.getElementById("lostForm").addEventListener("submit", (e) => handleReportSubmit(e, "lostForm"));
  document.getElementById("foundForm").addEventListener("submit", (e) => handleReportSubmit(e, "foundForm"));
  document.getElementById("editForm").addEventListener("submit", handleEditSubmit);
}

async function handleReportSubmit(e, formId) {
  e.preventDefault();
  const form = document.getElementById(formId);
  clearFormErrors(form);

  const clientErrors = validateClientSide(form);
  if (Object.keys(clientErrors).length) {
    applyServerErrors(form, clientErrors);
    showToast("Please fix the highlighted fields.", "error");
    return;
  }

  const formData = new FormData(form);
  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;

  try {
    const res = await fetch(`${API_BASE}/items/`, { method: "POST", body: formData });
    const data = await res.json();

    if (res.ok && data.success) {
      showToast(data.message || "Item reported successfully!", "success");
      form.reset();
      window.location.hash = "browse";
      navigateTo("browse");
      fetchItems();
    } else {
      applyServerErrors(form, data.errors || {});
      showToast("Please fix the highlighted fields.", "error");
    }
  } catch (err) {
    console.error(err);
    showToast("Could not reach the server. Is the backend running?", "error");
  } finally {
    submitBtn.disabled = false;
  }
}

// ---------------------------------------------------------------
// Browse: fetch, render, search, filter, sort, paginate
// ---------------------------------------------------------------
function wireBrowseControls() {
  const searchInput = document.getElementById("searchInput");
  const filterCategory = document.getElementById("filterCategory");
  const filterStatus = document.getElementById("filterStatus");
  const sortBy = document.getElementById("sortBy");

  let debounceTimer;
  searchInput.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      state.page = 1;
      fetchItems();
    }, 350);
  });

  [filterCategory, filterStatus, sortBy].forEach((el) =>
    el.addEventListener("change", () => {
      state.page = 1;
      fetchItems();
    })
  );

  document.getElementById("viewCardsBtn").addEventListener("click", () => setView("cards"));
  document.getElementById("viewTableBtn").addEventListener("click", () => setView("table"));
}

function setView(view) {
  state.view = view;
  document.getElementById("viewCardsBtn").classList.toggle("active", view === "cards");
  document.getElementById("viewTableBtn").classList.toggle("active", view === "table");
  document.getElementById("itemsCardView").classList.toggle("hidden", view !== "cards");
  document.getElementById("itemsTableView").classList.toggle("hidden", view !== "table");
}

function buildQuery(page = 1) {
  const params = new URLSearchParams();
  const search = document.getElementById("searchInput").value.trim();
  const category = document.getElementById("filterCategory").value;
  const status = document.getElementById("filterStatus").value;
  const ordering = document.getElementById("sortBy").value;

  if (search) params.set("search", search);
  if (category) params.set("category", category);
  if (status) params.set("status", status);
  if (ordering) params.set("ordering", ordering);
  params.set("page", page);

  return params.toString();
}

async function fetchItems(page = state.page) {
  const grid = document.getElementById("itemsCardView");
  grid.innerHTML = `<p style="color:#656b85;grid-column:1/-1;">Loading items…</p>`;

  try {
    const query = buildQuery(page);
    const res = await fetch(`${API_BASE}/items/?${query}`);
    const data = await res.json();

    state.items = data.results || [];
    state.count = data.count ?? state.items.length;
    state.next = data.next;
    state.previous = data.previous;
    state.page = page;

    renderItems();
    renderPagination();
    updateHeroStats();
  } catch (err) {
    console.error(err);
    grid.innerHTML = `<p style="color:#e0473f;grid-column:1/-1;">Could not load items. Is the backend server running at ${API_BASE}?</p>`;
    document.getElementById("itemsMeta").textContent = "";
  }
}

async function updateHeroStats() {
  try {
    const [totalRes, lostRes, foundRes] = await Promise.all([
      fetch(`${API_BASE}/items/?page_size=1`),
      fetch(`${API_BASE}/items/?status=Lost&page_size=1`),
      fetch(`${API_BASE}/items/?status=Found&page_size=1`),
    ]);
    const [total, lost, found] = await Promise.all([totalRes.json(), lostRes.json(), foundRes.json()]);
    document.getElementById("statTotal").textContent = total.count ?? 0;
    document.getElementById("statLost").textContent = lost.count ?? 0;
    document.getElementById("statFound").textContent = found.count ?? 0;
  } catch (err) {
    // Non-critical — hero stats simply stay at 0 if this fails.
  }
}

function renderItems() {
  const grid = document.getElementById("itemsCardView");
  const tableBody = document.getElementById("itemsTableBody");
  const emptyState = document.getElementById("emptyState");
  const meta = document.getElementById("itemsMeta");

  if (!state.items.length) {
    grid.innerHTML = "";
    tableBody.innerHTML = "";
    emptyState.classList.remove("hidden");
    meta.textContent = "";
    return;
  }

  emptyState.classList.add("hidden");
  meta.textContent = `Showing ${state.items.length} of ${state.count} item${state.count === 1 ? "" : "s"}`;

  grid.innerHTML = state.items.map(renderCard).join("");
  tableBody.innerHTML = state.items.map(renderTableRow).join("");

  grid.querySelectorAll("[data-edit]").forEach((btn) =>
    btn.addEventListener("click", () => openEditModal(btn.dataset.edit))
  );
  grid.querySelectorAll("[data-delete]").forEach((btn) =>
    btn.addEventListener("click", () => openDeleteModal(btn.dataset.delete, btn.dataset.name))
  );
  tableBody.querySelectorAll("[data-edit]").forEach((btn) =>
    btn.addEventListener("click", () => openEditModal(btn.dataset.edit))
  );
  tableBody.querySelectorAll("[data-delete]").forEach((btn) =>
    btn.addEventListener("click", () => openDeleteModal(btn.dataset.delete, btn.dataset.name))
  );
}

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderCard(item) {
  const icon = CATEGORY_ICONS[item.category] || "📦";
  const media = item.image
    ? `<img src="${item.image}" alt="${escapeHtml(item.item_name)}" />`
    : icon;

  return `
    <div class="item-card">
      <div class="item-card-media">
        <span class="status-badge ${item.status}">${item.status}</span>
        ${media}
      </div>
      <div class="item-card-body">
        <h4>${escapeHtml(item.item_name)}</h4>
        <span class="item-tag">${escapeHtml(item.category)}</span>
        <div class="item-meta-row">📍 ${escapeHtml(item.location)}</div>
        <div class="item-meta-row">📅 ${formatDate(item.date)}</div>
        ${item.description ? `<p class="item-desc">${escapeHtml(item.description)}</p>` : ""}
      </div>
      <div class="item-card-footer">
        <div class="item-contact">${escapeHtml(item.contact_name)}<br/>${escapeHtml(item.contact_email)}</div>
        <div class="item-actions">
          <button class="icon-btn" data-edit="${item.id}" title="Edit">✏️</button>
          <button class="icon-btn danger" data-delete="${item.id}" data-name="${escapeHtml(item.item_name)}" title="Delete">🗑️</button>
        </div>
      </div>
    </div>
  `;
}

function renderTableRow(item) {
  return `
    <tr>
      <td>${escapeHtml(item.item_name)}</td>
      <td>${escapeHtml(item.category)}</td>
      <td><span class="status-badge ${item.status}" style="position:static;display:inline-block;">${item.status}</span></td>
      <td>${escapeHtml(item.location)}</td>
      <td>${formatDate(item.date)}</td>
      <td>${escapeHtml(item.contact_name)}<br/><small>${escapeHtml(item.contact_email)}</small></td>
      <td class="actions-cell">
        <button class="icon-btn" data-edit="${item.id}" title="Edit">✏️</button>
        <button class="icon-btn danger" data-delete="${item.id}" data-name="${escapeHtml(item.item_name)}" title="Delete">🗑️</button>
      </td>
    </tr>
  `;
}

function formatDate(isoDate) {
  if (!isoDate) return "—";
  const d = new Date(isoDate + "T00:00:00");
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function renderPagination() {
  const pagEl = document.getElementById("pagination");
  const pageSize = 12;
  const totalPages = Math.max(1, Math.ceil(state.count / pageSize));

  if (totalPages <= 1) {
    pagEl.innerHTML = "";
    return;
  }

  let html = "";
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="${i === state.page ? "active" : ""}" data-page="${i}">${i}</button>`;
  }
  pagEl.innerHTML = html;

  pagEl.querySelectorAll("button").forEach((btn) =>
    btn.addEventListener("click", () => {
      state.page = Number(btn.dataset.page);
      fetchItems(state.page);
      window.scrollTo({ top: document.getElementById("browse").offsetTop - 80, behavior: "smooth" });
    })
  );
}

// ---------------------------------------------------------------
// Edit modal
// ---------------------------------------------------------------
function wireModals() {
  document.getElementById("closeModalBtn").addEventListener("click", closeEditModal);
  document.getElementById("cancelEditBtn").addEventListener("click", closeEditModal);
  document.getElementById("editModal").addEventListener("click", (e) => {
    if (e.target.id === "editModal") closeEditModal();
  });

  document.getElementById("closeDeleteModalBtn").addEventListener("click", closeDeleteModal);
  document.getElementById("cancelDeleteBtn").addEventListener("click", closeDeleteModal);
  document.getElementById("deleteModal").addEventListener("click", (e) => {
    if (e.target.id === "deleteModal") closeDeleteModal();
  });
}

function openEditModal(id) {
  const item = state.items.find((i) => String(i.id) === String(id));
  if (!item) return;

  const form = document.getElementById("editForm");
  clearFormErrors(form);
  form.id.value = item.id;
  form.item_name.value = item.item_name;
  form.category.value = item.category;
  form.status.value = item.status;
  form.location.value = item.location;
  form.date.value = item.date;
  form.description.value = item.description || "";
  form.contact_name.value = item.contact_name;
  form.contact_email.value = item.contact_email;

  document.getElementById("editModal").classList.remove("hidden");
}

function closeEditModal() {
  document.getElementById("editModal").classList.add("hidden");
}

async function handleEditSubmit(e) {
  e.preventDefault();
  const form = e.target;
  clearFormErrors(form);

  const clientErrors = validateClientSide(form);
  if (Object.keys(clientErrors).length) {
    applyServerErrors(form, clientErrors);
    return;
  }

  const id = form.id.value;
  const payload = {
    item_name: form.item_name.value.trim(),
    category: form.category.value,
    status: form.status.value,
    location: form.location.value.trim(),
    date: form.date.value,
    description: form.description.value.trim(),
    contact_name: form.contact_name.value.trim(),
    contact_email: form.contact_email.value.trim(),
  };

  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;

  try {
    const res = await fetch(`${API_BASE}/items/${id}/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (res.ok && data.success) {
      showToast(data.message || "Item updated successfully!", "success");
      closeEditModal();
      fetchItems();
    } else {
      applyServerErrors(form, data.errors || {});
      showToast("Please fix the highlighted fields.", "error");
    }
  } catch (err) {
    console.error(err);
    showToast("Could not reach the server. Is the backend running?", "error");
  } finally {
    submitBtn.disabled = false;
  }
}

// ---------------------------------------------------------------
// Delete modal
// ---------------------------------------------------------------
let pendingDeleteId = null;

function openDeleteModal(id, name) {
  pendingDeleteId = id;
  document.getElementById("deleteModalText").textContent =
    `Are you sure you want to delete "${name}"? This action cannot be undone.`;
  document.getElementById("deleteModal").classList.remove("hidden");

  const confirmBtn = document.getElementById("confirmDeleteBtn");
  confirmBtn.onclick = confirmDelete;
}

function closeDeleteModal() {
  pendingDeleteId = null;
  document.getElementById("deleteModal").classList.add("hidden");
}

async function confirmDelete() {
  if (!pendingDeleteId) return;
  const confirmBtn = document.getElementById("confirmDeleteBtn");
  confirmBtn.disabled = true;

  try {
    const res = await fetch(`${API_BASE}/items/${pendingDeleteId}/`, { method: "DELETE" });
    const data = await res.json();

    if (res.ok && data.success) {
      showToast(data.message || "Item deleted.", "success");
      closeDeleteModal();
      fetchItems();
    } else {
      showToast(data.message || "Could not delete item.", "error");
    }
  } catch (err) {
    console.error(err);
    showToast("Could not reach the server. Is the backend running?", "error");
  } finally {
    confirmBtn.disabled = false;
  }
}
