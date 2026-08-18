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
  validateEntriesForCsv,
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
  Interprovincial: "IP",
  "Canada-wide": "CA",
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

const ANTENNA_TYPE_CODES = {
  1: "AAS",
  2: "NAC",
  3: "NAU",
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
  {
    heading: "Business telephone number",
    get: (row) => row["business-number"] ?? "",
  },
  { heading: "E-mail address", get: (row) => row["email-address"] ?? "" },
  { heading: "Station location", get: (row) => row["station-location"] ?? "" },
  {
    heading: "Station type",
    get: (row) =>
      row["site-info-change"] === "radio1"
        ? row["licence-type"] === "radio2"
          ? "TC"
          : "FX"
        : "",
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
    heading: "Tx Radio Manufacturer code",
    get: (row) => getTxRxRadioValue(row, "tx", "radio-code"),
  },
  {
    heading: "Rx Radio Manufacturer code",
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
  {
    heading: "Class of Emission",
    get: (row) => row["class-of-emissions"] ?? "",
  },
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

function createReverseLookup(map) {
  return Object.fromEntries(
    Object.entries(map).map(([key, value]) => [
      String(value).toUpperCase(),
      key,
    ]),
  );
}

const RADIO_TECHNOLOGY_VALUES = createReverseLookup(RADIO_TECHNOLOGY_CODES);
const PROVINCE_TERRITORY_VALUES = createReverseLookup(PROVINCE_TERRITORY_CODES);
const SITE_TYPE_VALUES = createReverseLookup(SITE_TYPE_CODES);
const STRUCTURE_TYPE_VALUES = createReverseLookup(STRUCTURE_TYPE_CODES);
const DIRECTIONAL_PATTERN_VALUES = createReverseLookup(
  DIRECTIONAL_PATTERN_CODES,
);
const ANTENNA_TYPE_VALUES = createReverseLookup(ANTENNA_TYPE_CODES);

function getPage3Side(row, side) {
  const antennaType = row["antenna-type"];
  if (side === "tx")
    return antennaType === "radio1" || antennaType === "radio3";
  if (side === "rx")
    return antennaType === "radio2" || antennaType === "radio3";
  return false;
}

function getSideFrequency(row, side) {
  if (!getPage3Side(row, side)) return "";
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
  return mapValue(ANTENNA_TYPE_CODES, row[`${side}-type-code`]);
}

function getRowsForExport() {
  const state = ensureState();
  const entries = Array.isArray(state.entries) ? state.entries : [];
  let rows = entries;
  if (!rows.length) {
    const current = state.current || {};
    const draft = { ...current.page1, ...current.page2, ...current.page3 };
    if (!Object.values(draft).every((value) => value === "" || value == null)) {
      rows = [draft];
    }
  }
  return rows;
}
function validateAllDataForCsv() {
  const rows = getRowsForExport();
  const validationResult = validateEntriesForCsv(rows);
  if (!validationResult.success) return validationResult;
  return { success: true, rows };
}

function getCurrentCsvValidationErrors() {
  const rows = getRowsForExport();
  const validationResult = validateEntriesForCsv(rows);
  return validationResult.success ? [] : validationResult.errors || [];
}

function parseCsvLine(line) {
  const values = [];
  let currentValue = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];

    if (character === '"') {
      const nextCharacter = line[index + 1];
      if (inQuotes && nextCharacter === '"') {
        currentValue += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (character === "," && !inQuotes) {
      values.push(currentValue.trim());
      currentValue = "";
      continue;
    }

    currentValue += character;
  }

  values.push(currentValue.trim());
  return values;
}

function stripUtf8Bom(value) {
  return value.replace(/^\uFEFF/, "");
}

function normalizeImportedRow(row) {
  const normalizedRow = {};
  Object.entries(row).forEach(([heading, value]) => {
    const normalizedHeading = stripUtf8Bom(String(heading ?? "")).trim();
    const normalizedValue = typeof value === "string" ? value.trim() : value;
    normalizedRow[normalizedHeading] = normalizedValue;
    normalizedRow[normalizedHeading.toLowerCase()] = normalizedValue;
  });
  return normalizedRow;
}

function getImportedColumnValue(normalizedRow, heading) {
  return (
    normalizedRow[heading] ?? normalizedRow[String(heading).toLowerCase()] ?? ""
  );
}

function getImportedSiteInfoChange(stationLocation) {
  const normalized = String(stationLocation ?? "")
    .trim()
    .toUpperCase();
  if (normalized === "NOCHANGE" || normalized === "NOCHANGES") return "radio2";
  if (normalized === "NOSTATIONS") return "radio3";
  return "radio1";
}

function getImportedLicenceType(stationType) {
  return String(stationType ?? "")
    .trim()
    .toUpperCase() === "TC"
    ? "radio2"
    : "radio1";
}

function getImportedAntennaType(txFrequency, rxFrequency) {
  const txValue = Number.parseFloat(String(txFrequency ?? ""));
  const rxValue = Number.parseFloat(String(rxFrequency ?? ""));
  const hasTx = Number.isFinite(txValue) && txValue > 0;
  const hasRx = Number.isFinite(rxValue) && rxValue > 0;

  if (hasTx && hasRx) return "radio3";
  if (hasTx) return "radio1";
  if (hasRx) return "radio2";
  return "radio3";
}

function mapImportedValue(value, reverseLookup) {
  const normalized = String(value ?? "")
    .trim()
    .toUpperCase();
  if (!normalized) return "";
  return reverseLookup[normalized] ?? "";
}

function mapImportedEntry(row) {
  const normalizedRow = normalizeImportedRow(row);
  const importedEntry = {
    "licence-number": getImportedColumnValue(
      normalizedRow,
      "Spectrum licence number",
    ),
    "reference-number": getImportedColumnValue(
      normalizedRow,
      "Upload reference number",
    ),
    "contact-name": getImportedColumnValue(normalizedRow, "Contact name"),
    "business-number": getImportedColumnValue(
      normalizedRow,
      "Business telephone number",
    ),
    "email-address": getImportedColumnValue(normalizedRow, "E-mail address"),
    "station-location": getImportedColumnValue(
      normalizedRow,
      "Station location",
    ),
    "radio-technology": mapImportedValue(
      getImportedColumnValue(normalizedRow, "Radio technology"),
      RADIO_TECHNOLOGY_VALUES,
    ),
    "cell-id": getImportedColumnValue(normalizedRow, "Cell ID"),
    "physical-cell-id": getImportedColumnValue(
      normalizedRow,
      "Physical Cell ID",
    ),
    "province-territory": mapImportedValue(
      getImportedColumnValue(normalizedRow, "Province/Territory code"),
      PROVINCE_TERRITORY_VALUES,
    ),
    latitude: getImportedColumnValue(normalizedRow, "Latitude"),
    longitude: getImportedColumnValue(normalizedRow, "Longitude"),
    "site-type": mapImportedValue(
      getImportedColumnValue(normalizedRow, "Site Type Code"),
      SITE_TYPE_VALUES,
    ),
    "structure-height": getImportedColumnValue(
      normalizedRow,
      "Structure height",
    ),
    "structure-type": mapImportedValue(
      getImportedColumnValue(normalizedRow, "Site Structure Type Code"),
      STRUCTURE_TYPE_VALUES,
    ),
    "date-of-modification": getImportedColumnValue(
      normalizedRow,
      "Station/Associated channels in-service date or last modified date",
    ),
    "site-record-id": getImportedColumnValue(normalizedRow, "Site Record ID"),
    "tx-channel-frequency": getImportedColumnValue(
      normalizedRow,
      "Tx channel frequency or Tx lower frequency limit of the band in use",
    ),
    "rx-channel-frequency": getImportedColumnValue(
      normalizedRow,
      "Rx channel frequency or Rx lower frequency limit of the band in use",
    ),
    "tx-radio-model": getImportedColumnValue(
      normalizedRow,
      "Tx Radio model number",
    ),
    "rx-radio-model": getImportedColumnValue(
      normalizedRow,
      "Rx Radio model number",
    ),
    "tx-radio-code": getImportedColumnValue(
      normalizedRow,
      "Tx Radio Manufacturer Code",
    ),
    "rx-radio-code": getImportedColumnValue(
      normalizedRow,
      "Rx Radio Manufacturer Code",
    ),
    "tx-radio-certificate": getImportedColumnValue(
      normalizedRow,
      "Tx Radio Certification Number",
    ),
    "rx-radio-certificate": getImportedColumnValue(
      normalizedRow,
      "Rx Radio Certification Number",
    ),
    bandwidth: getImportedColumnValue(normalizedRow, "Bandwidth"),
    "class-of-emissions": getImportedColumnValue(
      normalizedRow,
      "Class of Emission",
    ),
    tcp: getImportedColumnValue(normalizedRow, "Transmitter TCP-TRP"),
    downlink: getImportedColumnValue(
      normalizedRow,
      "Downlink Resource Allocation",
    ),
    "tx-type-code": mapImportedValue(
      getImportedColumnValue(normalizedRow, "Tx Antenna Type Code"),
      ANTENNA_TYPE_VALUES,
    ),
    "rx-type-code": mapImportedValue(
      getImportedColumnValue(normalizedRow, "Rx Antenna Type Code"),
      ANTENNA_TYPE_VALUES,
    ),
    "tx-number-antennas": getImportedColumnValue(
      normalizedRow,
      "Number of Tx Antennas",
    ),
    "rx-number-antennas": getImportedColumnValue(
      normalizedRow,
      "Number of Rx Antennas",
    ),
    "tx-antenna-model": getImportedColumnValue(
      normalizedRow,
      "Tx Antenna Model Number",
    ),
    "rx-antenna-model": getImportedColumnValue(
      normalizedRow,
      "Rx Antenna Model Number",
    ),
    "tx-antenna-manufacturer": getImportedColumnValue(
      normalizedRow,
      "Tx Antenna Manufacturer",
    ),
    "rx-antenna-manufacturer": getImportedColumnValue(
      normalizedRow,
      "Rx Antenna Manufacturer",
    ),
    "tx-antenna-height": getImportedColumnValue(
      normalizedRow,
      "Tx Antenna Height",
    ),
    "rx-antenna-height": getImportedColumnValue(
      normalizedRow,
      "Rx Antenna Height",
    ),
    "tx-omnidirectional-pattern": mapImportedValue(
      getImportedColumnValue(
        normalizedRow,
        "Tx Antenna Directional Pattern Indicator",
      ),
      DIRECTIONAL_PATTERN_VALUES,
    ),
    "rx-omnidirectional-pattern": mapImportedValue(
      getImportedColumnValue(
        normalizedRow,
        "Rx Antenna Directional Pattern Indicator",
      ),
      DIRECTIONAL_PATTERN_VALUES,
    ),
    "tx-antenna-horizontal-beamwidth": getImportedColumnValue(
      normalizedRow,
      "Tx Antenna Horizontal Beam",
    ),
    "rx-antenna-horizontal-beamwidth": getImportedColumnValue(
      normalizedRow,
      "Rx Antenna Horizontal Beam",
    ),
    "tx-antenna-vertical-beamwidth": getImportedColumnValue(
      normalizedRow,
      "Tx Antenna Vertical Beam",
    ),
    "rx-antenna-vertical-beamwidth": getImportedColumnValue(
      normalizedRow,
      "Rx Antenna Vertical Beam",
    ),
    "tx-antenna-azimuth": getImportedColumnValue(
      normalizedRow,
      "Tx Antenna Azimuth",
    ),
    "rx-antenna-azimuth": getImportedColumnValue(
      normalizedRow,
      "Rx Antenna Azimuth",
    ),
    "tx-antenna-elevation-angle": getImportedColumnValue(
      normalizedRow,
      "Tx Antenna Elevation Angle",
    ),
    "rx-antenna-elevation-angle": getImportedColumnValue(
      normalizedRow,
      "Rx Antenna Elevation Angle",
    ),
    "tx-antenna-gain": getImportedColumnValue(normalizedRow, "Tx Antenna Gain"),
    "rx-antenna-gain": getImportedColumnValue(normalizedRow, "Rx Antenna Gain"),
    "tx-antenna-line-loss": getImportedColumnValue(
      normalizedRow,
      "Tx Line Loss",
    ),
    "rx-antenna-line-loss": getImportedColumnValue(
      normalizedRow,
      "Rx Line Loss",
    ),
  };

  importedEntry["site-info-change"] = getImportedSiteInfoChange(
    importedEntry["station-location"],
  );
  importedEntry["licence-type"] = getImportedLicenceType(
    getImportedColumnValue(normalizedRow, "Station type"),
  );
  importedEntry["antenna-type"] = getImportedAntennaType(
    importedEntry["tx-channel-frequency"],
    importedEntry["rx-channel-frequency"],
  );

  return importedEntry;
}

function getImportedEntriesFromCsv(csvText) {
  const lines = String(csvText ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== "");

  if (lines.length <= 1) {
    return {
      success: false,
      message: "No station data found",
      errors: ["No station data found"],
    };
  }

  const headings = parseCsvLine(stripUtf8Bom(lines[0]));
  const importedEntries = lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row = {};
    headings.forEach((heading, index) => {
      row[heading] = values[index] ?? "";
    });
    return mapImportedEntry(row);
  });

  return {
    success: true,
    importedEntries,
  };
}

function validateCsvImportData(csvText) {
  const importedResult = getImportedEntriesFromCsv(csvText);
  if (!importedResult.success) return importedResult;

  return {
    importedEntries: importedResult.importedEntries,
  };
}

function importAllDataFromCsv(csvText) {
  const validationResult = validateCsvImportData(csvText);
  if (!validationResult.importedEntries) {
    return {
      success: false,
      message: validationResult.message,
      errors: validationResult.errors || [],
    };
  }

  const importedEntries = validationResult.importedEntries;

  const state = ensureState();
  const existingEntries = Array.isArray(state.entries) ? state.entries : [];

  state.entries = [...existingEntries, ...importedEntries];
  state.current = { page1: {}, page2: {}, page3: {} };
  state.editing = null;
  writeAllData(state);

  const importValidation = validateEntriesForCsv(state.entries);
  const errors = importValidation.success ? [] : importValidation.errors || [];

  return {
    success: true,
    importedCount: importedEntries.length,
    errors,
    message: importValidation.success
      ? ""
      : "Some saved stations contain invalid or missing field values.",
  };
}

// ------------------------------------

function saveCurrentPageData() {
  const page = parseInt(localStorage.getItem(PAGE_KEY) || "1", 10);
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
  const header = getCsvHeadings().join(",");
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

function getDefaultCsvFilename() {
  const currentDate = new Date();
  const date = [
    currentDate.getFullYear(),
    String(currentDate.getMonth() + 1).padStart(2, "0"),
    String(currentDate.getDate()).padStart(2, "0"),
  ].join("-");
  return `Site data ${date}.csv`;
}

function exportAllDataAsCsv(filename = getDefaultCsvFilename()) {
  const validationResult = validateAllDataForCsv();
  if (!validationResult.success) {
    console.warn(validationResult.message);
    return validationResult;
  }

  let rows = validationResult.rows;
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

  return {
    success: true,
    exportedCount: rows.length,
  };
}

function getCsvHeadings() {
  return CSV_FIELDS.map((field) => field.heading);
}

export {
  setCurrentPage,
  saveCurrentPageData,
  loadCurrentPageData,
  exportAllDataAsCsv,
  validateAllDataForCsv,
  getCurrentCsvValidationErrors,
  getCsvHeadings,
  validateCsvImportData,
  importAllDataFromCsv,
  clearCurrentEntry,
  finalizeCurrentEntry,
  validateCurrentPage,
  applyValidationToAllFields,
};
