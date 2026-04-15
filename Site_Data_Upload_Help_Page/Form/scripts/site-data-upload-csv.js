import {
  PAGE_KEY,
  ALL_DATA_KEY,
  readAllData,
  writeAllData,
  ensureState,
  setCurrentPage,
  clearCurrentEntry,
} from "./site-data-storage.js";
import {
  getFieldValue,
  setFieldValue,
  getElementKeys,
  collectPageData,
} from "./site-data-fields.js";
import {
  validateCurrentPage,
  applyValidationToAllFields,
} from "./site-data-validation.js";

// ---- CSV headings and columns ----
const columns = [
  "licence-number",
  "reference-number",
  "contact-name",
  "business-number",
  "email-address",

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
  "Spectrum Licence Number",
  "Upload Reference Number",
  "Contact Name",
  "Business Telephone",
  "E-mail address",
  "Station location",
  "Station Type",
  "Radio technology",
  "Cell ID",
  "Physical Cell ID",
  "Province/Territory",
  "Latitude",
  "Longitude",
  "Site Type Code",
  "Structure Height",
  "Structure type",
  "Date Of Last Modification",
  "Site record ID",
  "Tx Frequency",
  "Rx Frequency",
  "Tx Radio Model Number",
  "Rx Radio Model Number",
  "Tx Radio Manufacturer Code",
  "Rx Radio Manufacturer Code",
  "Tx Radio Certification Number",
  "Rx Radio Certification Number",
  "Bandwidth",
  "Class of Emisssion",
  "Transmitter TCP-TRP",
  "Downlink Resource Allocation",
  "Tx Antenna Type Code",
  "Rx Antenna Type Code",
  "Number of Tx Antennas",
  "Number of Rx Antennas",
  "Tx Antenna Model Number",
  "Rx Antenna Model Number",
  "Tx Antenna Manufacturer",
  "Rx Antenna Manufacturer",
  "Tx Antenna Height",
  "Rx Antenna Height",
  "Tx Directional Pattern Code",
  "Rx Directional Pattern Code",
  "Tx Antenna Horizontal Beamwidth",
  "Rx Antenna Horizontal Beamwidth",
  "Tx Antenna Vertical Beamwidth",
  "Rx Antenna Vertical Beamwidth",
  "Tx Antenna Azimuth",
  "Rx Antenna Azimuth",
  "Tx Antenna Elevation Angle",
  "Rx Antenna Elevation Angle",
  "Tx Antenna Gain",
  "Rx Antenna Gain",
  "Tx Loss",
  "Rx Loss",
];
// ------------------------------------

function saveCurrentPageData() {
  const page = parseInt(sessionStorage.getItem(PAGE_KEY) || "1", 10);
  const state = ensureState();
  state.current[`page${page}`] = collectPageData();
  writeAllData(state);
}

function loadCurrentPageData(pageNumber) {
  const state = ensureState();
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

function finalizeCurrentEntry() {
  const state = ensureState();
  const current = state.current;
  const currentEntry = { ...current.page1, ...current.page2, ...current.page3 };
  if (Object.values(currentEntry).every((v) => v === "" || v == null))
    return false;
  if (state.editing !== null) {
    state.entries[state.editing] = currentEntry;
    state.editing = null;
  } else {
    state.entries.push(currentEntry);
  }
  state.current = { page1: {}, page2: {}, page3: {} };
  writeAllData(state);
  return true;
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
  const state = ensureState();
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
  rows = rows.map((row) => {
    if (row["site-info-change"] === "radio2") {
      return { ...row, "station-location": "NOCHANGE" };
    } else if (
      row["site-info-change"] === "radio3" ||
      row["site-info-change"] === "radio4"
    ) {
      return { ...row, "station-location": "NOSTATIONS" };
    }
    return row;
  });
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
