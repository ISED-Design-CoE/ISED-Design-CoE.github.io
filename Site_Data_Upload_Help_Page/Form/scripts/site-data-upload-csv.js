// site-data-upload-csv.js
// Shared state keys used by all steps
const PAGE_KEY = "site-data-upload-page";
const ALL_DATA_KEY = "site-data-upload-all";

function _readAllData() {
  try {
    return JSON.parse(localStorage.getItem(ALL_DATA_KEY) || "{}") || {};
  } catch (err) {
    console.warn("Could not parse saved site data:", err);
    return {};
  }
}

function _writeAllData(data) {
  localStorage.setItem(ALL_DATA_KEY, JSON.stringify(data));
}

function _ensureState() {
  const state = _readAllData();
  if (!Array.isArray(state.entries)) {
    state.entries = [];
  }
  if (typeof state.current !== "object" || state.current === null) {
    state.current = { page1: {}, page2: {}, page3: {} };
  } else {
    state.current.page1 = state.current.page1 || {};
    state.current.page2 = state.current.page2 || {};
    state.current.page3 = state.current.page3 || {};
  }
  return state;
}

function getFieldValue(el) {
  if (!el) return "";

  const tag = el.tagName.toLowerCase();
  const type = el.getAttribute("type");

  if (tag === "gcds-radios") {
    const checked = el.querySelector('input[type="radio"]:checked');
    return checked ? checked.value : "";
  }

  // native elements
  if (tag === "input" && type === "radio") {
    return el.checked ? el.value : "";
  }

  // for gcds-input and gcds-select, `value` is usually available
  if (typeof el.value !== "undefined" && el.value !== null) {
    return el.value;
  }

  return el.getAttribute("value") || "";
}

function collectPageData() {
  const fieldSelectors = [
    "gcds-input",
    "gcds-select",
    "gcds-date-input",
    "gcds-radios",
    "input",
    "select",
    "textarea",
  ];

  const values = {};

  document.querySelectorAll(fieldSelectors.join(",")).forEach((el) => {
    const tagName = el.tagName.toLowerCase();
    let key = null;

    if (tagName === "gcds-input" || tagName === "gcds-date-input") {
      key = el.getAttribute("input-id") || el.id || el.name;
    } else if (tagName === "gcds-select") {
      key = el.getAttribute("select-id") || el.id || el.name;
    } else if (tagName === "gcds-radios") {
      key = el.getAttribute("name") || el.id;
    } else {
      key = el.id || el.name;
    }

    if (!key) return;

    const value = getFieldValue(el);

    // For native radio groups, prefer the checked value only for group key.
    if (tagName === "input" && el.type === "radio" && !el.checked) return;

    values[key] = value;
  });

  return values;
}

function saveCurrentPageData() {
  const page = parseInt(localStorage.getItem(PAGE_KEY) || "1", 10);
  const state = _ensureState();

  state.current[`page${page}`] = collectPageData();
  _writeAllData(state);
}

function setCurrentPage(pageNumber) {
  localStorage.setItem(PAGE_KEY, String(pageNumber));
}

function clearCurrentEntry() {
  const state = _ensureState();
  state.current = { page1: {}, page2: {}, page3: {} };
  _writeAllData(state);
}

function finalizeCurrentEntry() {
  const state = _ensureState();
  const current = state.current;
  const currentEntry = { ...current.page1, ...current.page2, ...current.page3 };

  // do not finalize empty entry
  if (Object.values(currentEntry).every((v) => v === "" || v == null)) {
    return false;
  }

  state.entries.push(currentEntry);
  state.current = { page1: {}, page2: {}, page3: {} };
  _writeAllData(state);

  return true;
}

function getElementKeys(el) {
  if (!el) return [];
  const tag = el.tagName.toLowerCase();
  const keys = [el.id, el.name];

  if (tag === "gcds-input" || tag === "gcds-date-input") {
    keys.push(el.getAttribute("input-id"));
  }
  if (tag === "gcds-select") {
    keys.push(el.getAttribute("select-id"));
  }
  if (tag === "gcds-radios") {
    keys.push(el.getAttribute("name"));
  }

  return keys.filter((k) => k);
}

function setFieldValue(el, value) {
  if (!el) return;
  const tag = el.tagName.toLowerCase();

  if (tag === "gcds-radios") {
    const radio = el.querySelector(`input[type="radio"][value="${value}"]`);
    if (radio) {
      radio.checked = true;
    }
    return;
  }

  if (tag === "input" || tag === "select" || tag === "textarea") {
    el.value = value;
    return;
  }

  if (typeof el.value !== "undefined") {
    el.value = value;
    return;
  }

  el.setAttribute("value", value);
}

function loadCurrentPageData(pageNumber) {
  const state = _ensureState();
  const pageData = (state.current && state.current[`page${pageNumber}`]) || {};

  const fieldSelectors = [
    "gcds-input",
    "gcds-select",
    "gcds-date-input",
    "gcds-radios",
    "input",
    "select",
    "textarea",
  ];

  document.querySelectorAll(fieldSelectors.join(",")).forEach((el) => {
    const keys = getElementKeys(el);
    for (const key of keys) {
      if (Object.prototype.hasOwnProperty.call(pageData, key)) {
        setFieldValue(el, pageData[key]);
        break;
      }
    }
  });
}

function flattenData(allData) {
  return Object.keys(allData)
    .sort()
    .reduce((acc, pageKey) => {
      return { ...acc, ...allData[pageKey] };
    }, {});
}

function escapeCsvValue(value) {
  if (value == null) return "";
  const str = String(value);
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

function buildCsv(rows) {
  const columns = [
    // page 1
    "licence-number",
    "reference-number",
    "contact-name",
    "business-number",
    "email-address",

    // page 2
    "station-location",
    "radio-technology",
    "cell-id",
    "physical-cell-id",
    "province-territory",
    "latitude",
    "longitude",
    "structure-type",
    "date-of-modification",
    "site-record-id",

    // page 3
    "radio-model",
    "radio-code",
    "radio-certificate",
    "channel-frequency",
    "bandwidth",
    "tcp",
    "downlink",
    "number-antennas",
    "antenna-model",
    "antenna-manufacturer",
    "antenna-height",
    "antenna-horizontal-beamwidth",
    "antenna-vertical-beamwidth",
    "antenna-azimuth",
    "antenna-elevation-angle",
    "antenna-gain",
    "antenna-line-loss",
  ];

  const headings = [
    "Licence number",
    "Reference number",
    "Contact name",
    "Business telephone number",
    "Email address",
    "Station location",
    "Radio technology",
    "Cell Global Identity (CGI)",
    "Physical Cell ID",
    "Province/Territory",
    "Latitude",
    "Longitude",
    "Structure type",
    "Date of modification",
    "Site record ID",
    "Radio model",
    "Radio code",
    "Radio certificate",
    "Channel frequency",
    "Bandwidth",
    "TCP",
    "Downlink",
    "Number antennas",
    "Antenna model",
    "Antenna manufacturer",
    "Antenna height",
    "Antenna horizontal beamwidth",
    "Antenna vertical beamwidth",
    "Antenna azimuth",
    "Antenna elevation angle",
    "Antenna gain",
    "Antenna line loss",
  ];

  const header = headings.join(",");
  const body = rows
    .map((row) =>
      columns.map((col) => escapeCsvValue(row[col] ?? "")).join(","),
    )
    .join("\n");

  return `${header}\n${body}`;
}

function downloadCsv(filename, csvContent) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function exportAllDataAsCsv(filename = "site-data-upload.csv") {
  const state = _ensureState();
  const entries = state.entries || [];

  let rows = entries;
  if (!rows.length) {
    const current = state.current || {};
    const draft = { ...current.page1, ...current.page2, ...current.page3 };
    if (!Object.values(draft).every((v) => v === "" || v == null)) {
      rows = [draft];
    }
  }

  if (!rows.length) {
    console.warn("No data found to export.");
    return;
  }

  const csv = buildCsv(rows);
  downloadCsv(filename, csv);
}

function exportDataAsJson(filename = "site-data-upload.json") {
  const allData = JSON.parse(localStorage.getItem(ALL_DATA_KEY) || "{}");
  const blob = new Blob([JSON.stringify(allData, null, 2)], {
    type: "application/json;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Optional helper to add event listeners for buttons by id:
function initAutoSave(nextButtonSelector) {
  const button = document.querySelector(nextButtonSelector);
  if (!button) return;
  button.addEventListener("click", saveCurrentPageData);
}

export {
  setCurrentPage,
  saveCurrentPageData,
  loadCurrentPageData,
  exportAllDataAsCsv,
  exportDataAsJson,
  initAutoSave,
  clearCurrentEntry,
  finalizeCurrentEntry,
};
