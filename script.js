const fallbackFiles = [];

const state = {
  files: [],
  category: "全部",
  query: "",
  sort: "updated-desc",
  layout: "cards"
};

const SORT_OPTIONS = new Set(["updated-desc", "updated-asc", "name-asc", "version-desc", "size-desc", "size-asc"]);
const LAYOUT_OPTIONS = new Set(["cards", "icons"]);

const els = {
  grid: document.querySelector("#downloads-grid"),
  tabs: document.querySelector("#category-tabs"),
  search: document.querySelector("#search-input"),
  sort: document.querySelector("#sort-select"),
  layoutButtons: [...document.querySelectorAll("[data-layout]")],
  empty: document.querySelector("#empty-state"),
  total: document.querySelector("#total-count"),
  latestVersion: document.querySelector("#latest-version"),
  latestDate: document.querySelector("#latest-date"),
  resultCount: document.querySelector("#result-count"),
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

function readPreference(key, allowed, fallback) {
  try {
    const value = localStorage.getItem(key);
    return allowed.has(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

function savePreference(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // 浏览器禁用本地存储时仍可正常使用当前页面。
  }
}

function parseFileSize(value) {
  const match = String(value || "").replaceAll(",", "").match(/([\d.]+)\s*(B|KB|MB|GB|TB)/i);
  if (!match) return -1;
  const units = { B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3, TB: 1024 ** 4 };
  return Number(match[1]) * units[match[2].toUpperCase()];
}

function fileExtension(file) {
  const source = String(file.assetName || file.url || "").split(/[?#]/)[0];
  const filename = source.split("/").pop() || "";
  const extension = filename.includes(".") ? filename.split(".").pop() : "FILE";
  return String(extension || "FILE").slice(0, 5).toUpperCase();
}

function sortFiles(files) {
  const collator = new Intl.Collator("zh-CN", { numeric: true, sensitivity: "base" });
  const compare = {
    "updated-desc": (a, b) => String(b.updated || "").localeCompare(String(a.updated || "")),
    "updated-asc": (a, b) => String(a.updated || "").localeCompare(String(b.updated || "")),
    "name-asc": (a, b) => collator.compare(String(a.name || ""), String(b.name || "")),
    "version-desc": (a, b) => collator.compare(String(b.version || ""), String(a.version || "")),
    "size-desc": (a, b) => parseFileSize(b.size) - parseFileSize(a.size),
    "size-asc": (a, b) => parseFileSize(a.size) - parseFileSize(b.size)
  }[state.sort];
  return files
    .map((file, index) => ({ file, index }))
    .sort((a, b) => compare(a.file, b.file) || a.index - b.index)
    .map(({ file }) => file);
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
  const filtered = state.files.filter((file) => {
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
  return sortFiles(filtered);
}

function renderTabs() {
  const categories = ["全部", ...new Set(state.files.map((file) => file.category).filter(Boolean))];
  els.tabs.innerHTML = categories
    .map(
      (category) => `
        <button class="tab-button ${category === state.category ? "is-active" : ""}" type="button" data-category="${escapeHtml(category)}" aria-pressed="${category === state.category}">
          ${escapeHtml(category)}
        </button>
      `
    )
    .join("");
}

function renderFiles() {
  const files = getFilteredFiles();
  els.grid.dataset.layout = state.layout;
  els.empty.hidden = files.length !== 0;
  els.resultCount.textContent = `${files.length} 个结果`;
  els.grid.innerHTML = files
    .map((file) => {
      const ready = isReadyUrl(file.url);
      const checksum = file.checksum || "SHA256: --";
      const statusClass = file.status === "draft" ? "draft" : "";
      const statusText = file.status === "draft" ? "待上传" : "可下载";
      const downloadUrl = ready ? escapeHtml(file.url) : "#";
      const title = ready
        ? `<a class="file-title-link" href="${downloadUrl}" target="_blank" rel="noopener">${escapeHtml(file.name)}</a>`
        : escapeHtml(file.name);

      return `
        <article class="file-card ${ready ? "is-clickable" : ""}">
          <div class="file-top">
            <span class="file-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z" />
                <path d="M14 2v5h5" />
                <path d="M9 15h6" />
                <path d="M9 18h4" />
              </svg>
              <span class="file-extension">${escapeHtml(fileExtension(file))}</span>
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

function renderLayout() {
  els.grid.dataset.layout = state.layout;
  els.layoutButtons.forEach((button) => {
    const active = button.dataset.layout === state.layout;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
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

  els.sort.addEventListener("change", (event) => {
    state.sort = SORT_OPTIONS.has(event.target.value) ? event.target.value : "updated-desc";
    savePreference("yl5408-files-sort", state.sort);
    renderFiles();
  });

  els.layoutButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (!LAYOUT_OPTIONS.has(button.dataset.layout)) return;
      state.layout = button.dataset.layout;
      savePreference("yl5408-files-layout", state.layout);
      renderLayout();
    });
  });
}

async function init() {
  els.year.textContent = new Date().getFullYear();
  state.sort = readPreference("yl5408-files-sort", SORT_OPTIONS, "updated-desc");
  state.layout = readPreference("yl5408-files-layout", LAYOUT_OPTIONS, "cards");
  els.sort.value = state.sort;
  state.files = await loadFiles();
  renderSummary();
  renderTimeline();
  renderTabs();
  renderFiles();
  renderLayout();
  bindEvents();
}

init();
