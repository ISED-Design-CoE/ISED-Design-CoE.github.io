import {
  PAGE_KEY,
  ALL_DATA_KEY,
  writeAllData,
  ensureState,
  setCurrentPage,
  clearCurrentEntry,
} from "./site-data-storage.js";
import {
  setFieldValue,
  getElementKeys,
  collectPageData,
} from "./site-data-fields.js";
import {
  validateCurrentPage,
  applyValidationToAllFields,
} from "./site-data-validation.js";

// ---- CSV headings and columns ----
const RADIO_TECHNOLOGY_CODES = {
  1: "GSM",
  2: "CDMA",
  3: "HSPA",
  4: "LTE",
  5: "5GNR",
  6: "5GDSS",
  7: "WIMAX",
  8: "WI-FI",
  9: "OTHER",
};

const PROVINCE_TERRITORY_CODES = {
  Alberta: "AB",
  "British Columbia": "BC",
  Manitoba: "MB",
  "New Brunswick": "NB",
  "Newfoundland and Labrador": "NL",
  "Nova Scotia": "NS",
  Ontario: "ON",
  "Prince Edward Island": "PE",
  Quebec: "QC",
  Saskatchewan: "SK",
  "Northwest Territories": "NT",
  Nunavut: "NU",
  Yukon: "YT",
};

const SITE_TYPE_CODES = {
  1: "U",
  2: "O",
  3: "I",
};

const STRUCTURE_TYPE_CODES = {
  1: "T",
  2: "R",
  3: "P",
  4: "S",
  5: "F",
  6: "M",
  7: "O",
};

const DIRECTIONAL_PATTERN_CODES = {
  1: "D",
  2: "N",
};

const CSV_FIELDS = [
  {
    heading: "Spectrum licence number",
    get: (row) => row["licence-number"] ?? "",
  },
  {
    heading: "Upload reference number",
    get: (row) => row["reference-number"] ?? "",
  },
  { heading: "Contact name", get: (row) => row["contact-name"] ?? "" },
  { heading: "Business telephone", get: (row) => row["business-number"] ?? "" },
  { heading: "E-mail address", get: (row) => row["email-address"] ?? "" },
  { heading: "Station location", get: (row) => row["station-location"] ?? "" },
  {
    heading: "Station type",
    get: (row) => (row["licence-type"] === "radio2" ? "TC" : "FX"),
  },
  {
    heading: "Radio technology",
    get: (row) => mapValue(RADIO_TECHNOLOGY_CODES, row["radio-technology"]),
  },
  { heading: "Cell ID", get: (row) => row["cell-id"] ?? "" },
  { heading: "Physical Cell ID", get: (row) => row["physical-cell-id"] ?? "" },
  {
    heading: "Province/Territory code",
    get: (row) => mapValue(PROVINCE_TERRITORY_CODES, row["province-territory"]),
  },
  { heading: "Latitude", get: (row) => row.latitude ?? "" },
  { heading: "Longitude", get: (row) => row.longitude ?? "" },
  {
    heading: "Site Type Code",
    get: (row) => mapValue(SITE_TYPE_CODES, row["site-type"]),
  },
  { heading: "Structure height", get: (row) => row["structure-height"] ?? "" },
  {
    heading: "Site Structure Type Code",
    get: (row) => mapValue(STRUCTURE_TYPE_CODES, row["structure-type"]),
  },
  {
    heading:
      "Station/Associated channels in-service date or last modified date",
    get: (row) => row["date-of-modification"] ?? "",
  },
  { heading: "Site Record ID", get: (row) => row["site-record-id"] ?? "" },
  {
    heading:
      "Tx channel frequency or Tx lower frequency limit of the band in use",
    get: (row) => getSideFrequency(row, "tx"),
  },
  {
    heading:
      "Rx channel frequency or Rx lower frequency limit of the band in use",
    get: (row) => getSideFrequency(row, "rx"),
  },
  {
    heading: "Tx Radio model number",
    get: (row) => getTxRxRadioValue(row, "tx", "radio-model"),
  },
  {
    heading: "Rx Radio model number",
    get: (row) => getTxRxRadioValue(row, "rx", "radio-model"),
  },
  {
    heading: "Tx Radio Manufacturer Code",
    get: (row) => getTxRxRadioValue(row, "tx", "radio-code"),
  },
  {
    heading: "Rx Radio Manufacturer Code",
    get: (row) => getTxRxRadioValue(row, "rx", "radio-code"),
  },
  {
    heading: "Tx Radio Certification Number",
    get: (row) => getTxRxRadioValue(row, "tx", "radio-certificate"),
  },
  {
    heading: "Rx Radio Certification Number",
    get: (row) => getTxRxRadioValue(row, "rx", "radio-certificate"),
  },
  { heading: "Bandwidth", get: (row) => row.bandwidth ?? "" },
  { heading: "Class of Emisssion", get: () => "" },
  { heading: "Transmitter TCP-TRP", get: (row) => row.tcp ?? "" },
  { heading: "Downlink Resource Allocation", get: (row) => row.downlink ?? "" },
  { heading: "Tx Antenna Type Code", get: (row) => mapAntennaCode(row, "tx") },
  { heading: "Rx Antenna Type Code", get: (row) => mapAntennaCode(row, "rx") },
  {
    heading: "Number of Tx Antennas",
    get: (row) => getDirectionalValue(row, "tx", "number-antennas"),
  },
  {
    heading: "Number of Rx Antennas",
    get: (row) => getDirectionalValue(row, "rx", "number-antennas"),
  },
  {
    heading: "Tx Antenna Model Number",
    get: (row) => getDirectionalValue(row, "tx", "antenna-model"),
  },
  {
    heading: "Rx Antenna Model Number",
    get: (row) => getDirectionalValue(row, "rx", "antenna-model"),
  },
  {
    heading: "Tx Antenna Manufacturer",
    get: (row) => getDirectionalValue(row, "tx", "antenna-manufacturer"),
  },
  {
    heading: "Rx Antenna Manufacturer",
    get: (row) => getDirectionalValue(row, "rx", "antenna-manufacturer"),
  },
  {
    heading: "Tx Antenna Height",
    get: (row) => getDirectionalValue(row, "tx", "antenna-height"),
  },
  {
    heading: "Rx Antenna Height",
    get: (row) => getDirectionalValue(row, "rx", "antenna-height"),
  },
  {
    heading: "Tx Antenna Directional Pattern Indicator",
    get: (row) =>
      mapValue(
        DIRECTIONAL_PATTERN_CODES,
        getDirectionalValue(row, "tx", "omnidirectional-pattern"),
      ),
  },
  {
    heading: "Rx Antenna Directional Pattern Indicator",
    get: (row) =>
      mapValue(
        DIRECTIONAL_PATTERN_CODES,
        getDirectionalValue(row, "rx", "omnidirectional-pattern"),
      ),
  },
  {
    heading: "Tx Antenna Horizontal Beam",
    get: (row) =>
      getDirectionalValue(row, "tx", "antenna-horizontal-beamwidth"),
  },
  {
    heading: "Rx Antenna Horizontal Beam",
    get: (row) =>
      getDirectionalValue(row, "rx", "antenna-horizontal-beamwidth"),
  },
  {
    heading: "Tx Antenna Vertical Beam",
    get: (row) => getDirectionalValue(row, "tx", "antenna-vertical-beamwidth"),
  },
  {
    heading: "Rx Antenna Vertical Beam",
    get: (row) => getDirectionalValue(row, "rx", "antenna-vertical-beamwidth"),
  },
  {
    heading: "Tx Antenna Azimuth",
    get: (row) => getDirectionalValue(row, "tx", "antenna-azimuth"),
  },
  {
    heading: "Rx Antenna Azimuth",
    get: (row) => getDirectionalValue(row, "rx", "antenna-azimuth"),
  },
  {
    heading: "Tx Antenna Elevation Angle",
    get: (row) => getDirectionalValue(row, "tx", "antenna-elevation-angle"),
  },
  {
    heading: "Rx Antenna Elevation Angle",
    get: (row) => getDirectionalValue(row, "rx", "antenna-elevation-angle"),
  },
  {
    heading: "Tx Antenna Gain",
    get: (row) => getDirectionalValue(row, "tx", "antenna-gain"),
  },
  {
    heading: "Rx Antenna Gain",
    get: (row) => getDirectionalValue(row, "rx", "antenna-gain"),
  },
  {
    heading: "Tx Line Loss",
    get: (row) => getDirectionalValue(row, "tx", "antenna-line-loss"),
  },
  {
    heading: "Rx Line Loss",
    get: (row) => getDirectionalValue(row, "rx", "antenna-line-loss"),
  },
];

function mapValue(map, value) {
  if (value == null || value === "") return "";
  return map[value] ?? value;
}

function getPage3Side(row, side) {
  const antennaType = row["antenna-type"];
  if (side === "tx")
    return antennaType === "radio1" || antennaType === "radio3";
  if (side === "rx")
    return antennaType === "radio2" || antennaType === "radio3";
  return false;
}

function getSideFrequency(row, side) {
  if (!getPage3Side(row, side)) return side === "tx" ? "0" : "0";
  return row[`${side}-channel-frequency`] ?? "";
}

function getTxRxRadioValue(row, side, key) {
  const sideKey = `${side}-${key}`;
  if (row[sideKey] != null && row[sideKey] !== "") {
    return row[sideKey];
  }
  return row[key] ?? "";
}

function getDirectionalValue(row, side, key) {
  if (!getPage3Side(row, side)) return "";
  return row[`${side}-${key}`] ?? "";
}

function mapAntennaCode(row, side) {
  if (!getPage3Side(row, side)) return "";
  if (row["licence-type"] === "radio2") return "";
  return "NAU";
}

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

function escapeCsvValue(value) {
  if (value == null) return "";
  const str = String(value);
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

function buildCsv(rows) {
  const header = CSV_FIELDS.map((field) => field.heading).join(",");
  const body = rows
    .map((row) =>
      CSV_FIELDS.map((field) => escapeCsvValue(field.get(row))).join(","),
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
    }
    if (
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
