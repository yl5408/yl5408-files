const fallbackFiles = [
  {
    id: "example-windows-tool",
    name: "示例 Windows 工具",
    version: "v1.0.0",
    category: "软件",
    platform: "Windows",
    size: "18.6 MB",
    updated: "2026-06-24",
    description: "这里替换成你的软件说明。适合放安装包、绿色版或压缩包。",
    url: "",
    checksum: "SHA256: 待填写",
    status: "draft"
  },
  {
    id: "example-portable-kit",
    name: "便携工具包",
    version: "v0.3.0",
    category: "工具",
    platform: "Windows / Linux",
    size: "42.1 MB",
    updated: "2026-06-20",
    description: "可以把常用脚本、模板或命令行工具整理到这个分类。",
    url: "",
    checksum: "SHA256: 待填写",
    status: "draft"
  },
  {
    id: "example-archive",
    name: "公开资料归档",
    version: "2026.06",
    category: "资料",
    platform: "通用",
    size: "9.4 MB",
    updated: "2026-06-12",
    description: "适合放说明文档、离线资料、素材压缩包等公开文件。",
    url: "",
    checksum: "SHA256: 待填写",
    status: "draft"
  }
];

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
      const statusClass = file.status === "draft" ? "draft" : "";
      const statusText = file.status === "draft" ? "待上传" : "可下载";

      return `
        <article class="file-card">
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
            <h3>${escapeHtml(file.name)}</h3>
            <p class="file-description">${escapeHtml(file.description)}</p>
            <div class="meta-row" aria-label="文件信息">
              <span>${escapeHtml(file.version)}</span>
              <span>${escapeHtml(file.platform)}</span>
              <span>${escapeHtml(file.size)}</span>
              <span>${formatDate(file.updated)}</span>
            </div>
          </div>
          <div class="file-actions">
            <span class="hash" title="${escapeHtml(file.checksum || "")}">${escapeHtml(file.checksum || "SHA256: --")}</span>
            <a class="download-link ${ready ? "" : "is-disabled"}" href="${ready ? escapeHtml(file.url) : "#"}" ${ready ? "target=\"_blank\" rel=\"noopener\"" : "aria-disabled=\"true\""}>
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
