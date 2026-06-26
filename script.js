const fallbackFiles = [];

const state = {
  files: [],
  category: "全部",
  query: ""
};

const els = {
  grid: document.querySelector("#downloads-grid"),
  tabs: document.querySelector("#category-tabs"),
  search: document.querySelector("#search-input"),
  empty: document.querySelector("#empty-state"),
  total: document.querySelector("#total-count"),
  latestVersion: document.querySelector("#latest-version"),
  latestDate: document.querySelector("#latest-date"),
  timeline: document.querySelector("#timeline"),
  year: document.querySelector("#year")
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value) {
  if (!value) return "--";
  return value;
}

function isReadyUrl(url) {
  return Boolean(url && /^https?:\/\//i.test(url));
}

function shortChecksum(value) {
  const text = String(value || "SHA256: --");
  const match = text.match(/^(SHA256:\s*)([a-f0-9]{64})$/i);
  if (match) {
    return `${match[1]}${match[2].slice(0, 8)}...${match[2].slice(-8)}`;
  }
  return text.length > 38 ? `${text.slice(0, 26)}...${text.slice(-8)}` : text;
}

async function loadFiles() {
  try {
    const response = await fetch("./files.json", { cache: "no-store" });
    if (!response.ok) throw new Error("files.json unavailable");
    const data = await response.json();
    return Array.isArray(data.files) ? data.files : fallbackFiles;
  } catch {
    return fallbackFiles;
  }
}

function getFilteredFiles() {
  const query = state.query.trim().toLowerCase();
  return state.files.filter((file) => {
    const inCategory = state.category === "全部" || file.category === state.category;
    const haystack = [
      file.name,
      file.version,
      file.category,
      file.platform,
      file.size,
      file.updated,
      file.description
    ]
      .join(" ")
      .toLowerCase();
    return inCategory && (!query || haystack.includes(query));
  });
}

function renderTabs() {
  const categories = ["全部", ...new Set(state.files.map((file) => file.category).filter(Boolean))];
  els.tabs.innerHTML = categories
    .map(
      (category) => `
        <button class="tab-button ${category === state.category ? "is-active" : ""}" type="button" data-category="${escapeHtml(category)}">
          ${escapeHtml(category)}
        </button>
      `
    )
    .join("");
}

function renderFiles() {
  const files = getFilteredFiles();
  els.empty.hidden = files.length !== 0;
  els.grid.innerHTML = files
    .map((file) => {
      const ready = isReadyUrl(file.url);
      const checksum = file.checksum || "SHA256: --";
      const statusClass = file.status === "draft" ? "draft" : "";
      const statusText = file.status === "draft" ? "待上传" : "可下载";
      const downloadUrl = ready ? escapeHtml(file.url) : "#";
      const cardAttrs = ready ? `data-download-url="${downloadUrl}" tabindex="0" role="link" aria-label="下载 ${escapeHtml(file.name)}"` : "";
      const title = ready
        ? `<a class="file-title-link" href="${downloadUrl}" target="_blank" rel="noopener">${escapeHtml(file.name)}</a>`
        : escapeHtml(file.name);

      return `
        <article class="file-card ${ready ? "is-clickable" : ""}" ${cardAttrs}>
          <div class="file-top">
            <span class="file-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z" />
                <path d="M14 2v5h5" />
                <path d="M9 15h6" />
                <path d="M9 18h4" />
              </svg>
            </span>
            <span class="status-pill ${statusClass}">${statusText}</span>
          </div>
          <div class="file-body">
            <h3>${title}</h3>
            <p class="file-description">${escapeHtml(file.description)}</p>
            <div class="meta-row" aria-label="文件信息">
              <span>${escapeHtml(file.version)}</span>
              <span>${escapeHtml(file.platform)}</span>
              <span>${escapeHtml(file.size)}</span>
              <span>${formatDate(file.updated)}</span>
            </div>
          </div>
          <div class="file-actions">
            <span class="hash" title="${escapeHtml(checksum)}">${escapeHtml(shortChecksum(checksum))}</span>
            <a class="download-link ${ready ? "" : "is-disabled"}" href="${downloadUrl}" ${ready ? "target=\"_blank\" rel=\"noopener\"" : "aria-disabled=\"true\""}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 3v12m0 0 4-4m-4 4-4-4" />
                <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
              </svg>
              <span>${ready ? "下载" : "待上传"}</span>
            </a>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderSummary() {
  const sorted = [...state.files].sort((a, b) => String(b.updated).localeCompare(String(a.updated)));
  const latest = sorted[0];
  els.total.textContent = state.files.length;
  els.latestVersion.textContent = latest?.version || "--";
  els.latestDate.textContent = latest?.updated || "--";
}

function renderTimeline() {
  const items = [...state.files]
    .sort((a, b) => String(b.updated).localeCompare(String(a.updated)))
    .slice(0, 5);

  els.timeline.innerHTML = items
    .map(
      (file) => `
        <article class="timeline-item">
          <time class="timeline-date" datetime="${escapeHtml(file.updated)}">${formatDate(file.updated)}</time>
          <div>
            <h3 class="timeline-title">${escapeHtml(file.name)} ${escapeHtml(file.version)}</h3>
            <p class="timeline-text">${escapeHtml(file.description)}</p>
          </div>
        </article>
      `
    )
    .join("");
}

function bindEvents() {
  els.grid.addEventListener("click", (event) => {
    if (event.target.closest("a, button")) return;
    const card = event.target.closest("[data-download-url]");
    if (!card) return;
    window.open(card.dataset.downloadUrl, "_blank", "noopener");
  });

  els.grid.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    if (event.target.closest("a, button")) return;
    const card = event.target.closest("[data-download-url]");
    if (!card) return;
    event.preventDefault();
    window.open(card.dataset.downloadUrl, "_blank", "noopener");
  });

  els.tabs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-category]");
    if (!button) return;
    state.category = button.dataset.category;
    renderTabs();
    renderFiles();
  });

  els.search.addEventListener("input", (event) => {
    state.query = event.target.value;
    renderFiles();
  });
}

async function init() {
  els.year.textContent = new Date().getFullYear();
  state.files = await loadFiles();
  renderSummary();
  renderTimeline();
  renderTabs();
  renderFiles();
  bindEvents();
}

init();
