// site-data-upload-csv.js
// Shared state keys used by all steps
const PAGE_KEY = "site-data-upload-page";
const ALL_DATA_KEY = "site-data-upload-all";

function _readAllData() {
  try {
    return JSON.parse(sessionStorage.getItem(ALL_DATA_KEY) || "{}") || {};
  } catch (err) {
    console.warn("Could not parse saved site data:", err);
    return {};
  }
}

function _writeAllData(data) {
  sessionStorage.setItem(ALL_DATA_KEY, JSON.stringify(data));
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
  if (state.editing == null) {
    state.editing = null;
  }
  return state;
}

function getFieldValue(el) {
  if (!el) return "";

  const tag = el.tagName.toLowerCase();
  const type = el.getAttribute("type");

  if (tag === "gcds-radios") {
    // Try el.value first (some GCDS components expose this)
    if (typeof el.value !== "undefined" && el.value !== null) {
      return el.value;
    }
    // Fallback to finding checked radio
    const checked =
      el.querySelector('input[type="radio"]:checked') ||
      el.shadowRoot?.querySelector('input[type="radio"]:checked');
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

function getInnerNativeField(el) {
  if (!el) return null;
  if (
    el instanceof HTMLInputElement ||
    el instanceof HTMLTextAreaElement ||
    el instanceof HTMLSelectElement
  ) {
    return el;
  }

  return (
    el.querySelector("input,textarea,select") ||
    el.shadowRoot?.querySelector("input,textarea,select") ||
    null
  );
}

// Custom validator to allow validation min length, max length or value between min and max
function getLengthValidator(min, max) {
  // Create errorMessage object
  let errorMessage = {};
  if (min && max) {
    errorMessage["en"] = `You must enter between ${min} and ${max} characters`;
    errorMessage["fr"] = `Vous devez entrer entre ${min} et ${max} caractères`;
  } else if (min) {
    errorMessage["en"] = `You must enter at least ${min} characters`;
    errorMessage["fr"] = `Vous devez entrer au moins ${min} caractères`;
  } else if (max) {
    errorMessage["en"] = `You must enter less than ${max} characters`;
    errorMessage["fr"] = `Vous devez entrer moins de ${max} caractères`;
  }
  return {
    validate: (value) => {
      value = value || "";
      if (min && max) {
        return min <= value.length && value.length <= max;
      }
      if (min) {
        return min <= value.length;
      }
      if (max) {
        return value.length <= max;
      }
      return true;
    },
    errorMessage,
  };
}

// Custom validator for number min/max
function getNumberValidator(min, max) {
  let errorMessage = {};
  if (min && max) {
    errorMessage["en"] = `Value must be between ${min} and ${max}`;
    errorMessage["fr"] = `La valeur doit être entre ${min} et ${max}`;
  } else if (min) {
    errorMessage["en"] = `Value must be at least ${min}`;
    errorMessage["fr"] = `La valeur doit être au moins ${min}`;
  } else if (max) {
    errorMessage["en"] = `Value must be at most ${max}`;
    errorMessage["fr"] = `La valeur doit être au plus ${max}`;
  }
  return {
    validate: (value) => {
      if (value == null || value === "") return true;
      const num = parseFloat(value);
      if (isNaN(num)) return false;
      if (min && max) {
        return min <= num && num <= max;
      }
      if (min) {
        return min <= num;
      }
      if (max) {
        return num <= max;
      }
      return true;
    },
    errorMessage,
  };
}

function checkFieldValue(el, native) {
  // No longer needed, as GCDS handles validation
}

function clampFieldValue(el, native) {
  // No longer needed, as GCDS handles validation and clamping
}

function applyValidationAttributes(el) {
  const native = getInnerNativeField(el);

  if (native) {
    const copyAttrs = [
      "min",
      "max",
      "minlength",
      "maxlength",
      "pattern",
      "type",
      "inputmode",
      "required",
      "step",
      "size",
    ];

    copyAttrs.forEach((attr) => {
      if (el.hasAttribute(attr)) {
        native.setAttribute(attr, el.getAttribute(attr));
      } else {
        native.removeAttribute(attr);
      }
    });
  }

  // For gcds-input, set validators
  if (el.tagName.toLowerCase() === "gcds-input") {
    const validators = [];

    const min = el.getAttribute("min");
    const max = el.getAttribute("max");
    const maxlength = el.getAttribute("maxlength");
    const type = el.getAttribute("type");

    if (type === "number" && (min || max)) {
      validators.push(
        getNumberValidator(
          min ? parseFloat(min) : null,
          max ? parseFloat(max) : null,
        ),
      );
    }

    if (maxlength && type !== "number") {
      validators.push(getLengthValidator(null, parseInt(maxlength, 10)));
    }

    if (validators.length > 0) {
      el.validator = validators;
    }
  }
}

function applyValidationToAllFields() {
  const fieldSelectors = [
    "gcds-input",
    "gcds-select",
    "gcds-date-input",
    "gcds-radios",
  ];

  document.querySelectorAll(fieldSelectors.join(",")).forEach((el) => {
    applyValidationAttributes(el);
  });
}

function validateCurrentPage() {
  const fieldSelectors = [
    "gcds-input",
    "gcds-select",
    "gcds-date-input",
    "gcds-radios",
  ];

  let isValid = true;

  document.querySelectorAll(fieldSelectors.join(",")).forEach((el) => {
    if (!el.hasAttribute("required")) return;

    const value = getFieldValue(el);

    if (!value.trim()) {
      isValid = false;
      // Set error state
      el.setAttribute("error-state", "error");
      el.setAttribute("error-message", "Enter information to continue.");
    } else {
      el.removeAttribute("error-state");
      el.removeAttribute("error-message");
    }
  });

  return isValid;
}

function normalizeCollectedValue(el, value) {
  if (value == null || value === "") return value;
  const native = getInnerNativeField(el);

  const maxLength = parseInt(
    el.getAttribute("maxlength") || native?.getAttribute("maxlength"),
    10,
  );
  if (
    !Number.isNaN(maxLength) &&
    maxLength > 0 &&
    String(value).length > maxLength
  ) {
    value = String(value).slice(0, maxLength);
  }

  const min = parseFloat(el.getAttribute("min") || native?.getAttribute("min"));
  const max = parseFloat(el.getAttribute("max") || native?.getAttribute("max"));
  const numericValue = parseFloat(value);
  if (!Number.isNaN(numericValue) && !Number.isNaN(min) && numericValue < min) {
    return String(min);
  }
  if (!Number.isNaN(numericValue) && !Number.isNaN(max) && numericValue > max) {
    return String(max);
  }

  return value;
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
    const normalizedValue = normalizeCollectedValue(el, value);

    // For native radio groups, prefer the checked value only for group key.
    if (tagName === "input" && el.type === "radio" && !el.checked) return;

    values[key] = normalizedValue;
  });

  return values;
}

function saveCurrentPageData() {
  const page = parseInt(sessionStorage.getItem(PAGE_KEY) || "1", 10);
  const state = _ensureState();

  state.current[`page${page}`] = collectPageData();
  _writeAllData(state);
}

function setCurrentPage(pageNumber) {
  sessionStorage.setItem(PAGE_KEY, String(pageNumber));
}

function clearCurrentEntry() {
  const state = _ensureState();
  state.current = { page1: {}, page2: {}, page3: {} };
  state.editing = null;
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

  if (state.editing !== null) {
    // Update existing entry
    state.entries[state.editing] = currentEntry;
    state.editing = null;
  } else {
    // Add new entry
    state.entries.push(currentEntry);
  }
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
  const allData = JSON.parse(sessionStorage.getItem(ALL_DATA_KEY) || "{}");
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
  validateCurrentPage,
  applyValidationToAllFields,
};
