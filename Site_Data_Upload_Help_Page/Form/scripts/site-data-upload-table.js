// site-data-upload-table.js
import { setCurrentPage } from "./site-data-upload-csv.js";

const ALL_DATA_KEY = "site-data-upload-all";
const MAX_STATIONS = 5;

const PAGE1_FIELDS = [
  "licence-type",
  "licence-number",
  "reference-number",
  "contact-name",
  "business-number",
  "email-address",
  "site-info-change",
];

const PAGE2_FIELDS = [
  "station-location",
  "radio-technology",
  "cell-id",
  "physical-cell-id",
  "filter-code",
  "province-territory",
  "latitude",
  "longitude",
  "site-type",
  "structure-height",
  "structure-type",
  "date-of-modification",
  "site-record-id",
];

const PAGE3_FIELDS = [
  "tx-radio-model",
  "rx-radio-model",
  "tx-radio-code",
  "rx-radio-code",
  "tx-radio-certificate",
  "rx-radio-certificate",
  "radio-model",
  "radio-code",
  "radio-certificate",
  "bandwidth",
  "tcp",
  "class-of-emissions",
  "downlink",
  "antenna-type",
  "tx-channel-frequency",
  "rx-channel-frequency",
  "tx-type-code",
  "rx-type-code",
  "tx-number-antennas",
  "rx-number-antennas",
  "tx-antenna-model",
  "rx-antenna-model",
  "tx-antenna-manufacturer",
  "rx-antenna-manufacturer",
  "tx-antenna-height",
  "rx-antenna-height",
  "tx-omnidirectional-pattern",
  "rx-omnidirectional-pattern",
  "tx-antenna-horizontal-beamwidth",
  "rx-antenna-horizontal-beamwidth",
  "tx-antenna-vertical-beamwidth",
  "rx-antenna-vertical-beamwidth",
  "tx-antenna-azimuth",
  "rx-antenna-azimuth",
  "tx-antenna-elevation-angle",
  "rx-antenna-elevation-angle",
  "tx-antenna-gain",
  "rx-antenna-gain",
  "tx-antenna-line-loss",
  "rx-antenna-line-loss",
];

function readAllData() {
  try {
    return JSON.parse(sessionStorage.getItem(ALL_DATA_KEY) || "{}");
  } catch (err) {
    console.warn("Could not parse saved site data:", err);
    return {};
  }
}

function writeAllData(data) {
  sessionStorage.setItem(ALL_DATA_KEY, JSON.stringify(data));
}

function getPageField(pageData, fieldKeys) {
  for (const key of fieldKeys) {
    if (pageData && Object.prototype.hasOwnProperty.call(pageData, key)) {
      return pageData[key];
    }
  }
  return "";
}

function getStationRows(options = {}) {
  const { includeCurrentDraft = true } = options;
  const allData = readAllData();
  const entries = Array.isArray(allData.entries) ? allData.entries : [];
  const current = allData.current || { page1: {}, page2: {}, page3: {} };

  const rows = entries.map((entry) => ({
    licenceNumber: getPageField(entry, ["licence-number", "licenceNumber"]),
    referenceNumber: getPageField(entry, [
      "reference-number",
      "referenceNumber",
    ]),
    stationLocation: getPageField(entry, [
      "station-location",
      "stationLocation",
    ]),
    provinceTerritory: getPageField(entry, [
      "province-territory",
      "provinceTerritory",
      "Province/Territory",
    ]),
  }));

  if (rows.length || !includeCurrentDraft) {
    return rows;
  }

  const licenceNumber = getPageField(current.page1 || {}, [
    "licence-number",
    "licenceNumber",
  ]);
  const referenceNumber = getPageField(current.page1 || {}, [
    "reference-number",
    "referenceNumber",
  ]);
  const stationLocation = getPageField(current.page2 || {}, [
    "station-location",
    "stationLocation",
  ]);
  const provinceTerritory = getPageField(current.page2 || {}, [
    "province-territory",
    "provinceTerritory",
    "Province/Territory",
  ]);

  if (
    !licenceNumber &&
    !referenceNumber &&
    !stationLocation &&
    !provinceTerritory
  ) {
    return [];
  }

  return [
    {
      licenceNumber,
      referenceNumber,
      stationLocation,
      provinceTerritory,
    },
  ];
}

function setCurrentFromEntry(allData, entry) {
  allData.current = {
    page1: {},
    page2: {},
    page3: {},
  };

  PAGE1_FIELDS.forEach((field) => {
    if (entry[field] != null) {
      allData.current.page1[field] = entry[field];
    }
  });

  PAGE2_FIELDS.forEach((field) => {
    if (entry[field] != null) {
      allData.current.page2[field] = entry[field];
    }
  });

  PAGE3_FIELDS.forEach((field) => {
    if (entry[field] != null) {
      allData.current.page3[field] = entry[field];
    }
  });

  if (
    allData.current.page3["radio-model"] != null &&
    allData.current.page3["tx-radio-model"] == null
  ) {
    allData.current.page3["tx-radio-model"] =
      allData.current.page3["radio-model"];
  }
  if (
    allData.current.page3["radio-model"] != null &&
    allData.current.page3["rx-radio-model"] == null
  ) {
    allData.current.page3["rx-radio-model"] =
      allData.current.page3["radio-model"];
  }
  if (
    allData.current.page3["radio-code"] != null &&
    allData.current.page3["tx-radio-code"] == null
  ) {
    allData.current.page3["tx-radio-code"] =
      allData.current.page3["radio-code"];
  }
  if (
    allData.current.page3["radio-code"] != null &&
    allData.current.page3["rx-radio-code"] == null
  ) {
    allData.current.page3["rx-radio-code"] =
      allData.current.page3["radio-code"];
  }
  if (
    allData.current.page3["radio-certificate"] != null &&
    allData.current.page3["tx-radio-certificate"] == null
  ) {
    allData.current.page3["tx-radio-certificate"] =
      allData.current.page3["radio-certificate"];
  }
  if (
    allData.current.page3["radio-certificate"] != null &&
    allData.current.page3["rx-radio-certificate"] == null
  ) {
    allData.current.page3["rx-radio-certificate"] =
      allData.current.page3["radio-certificate"];
  }
}

function editEntryByIndex(rowIndex) {
  const allData = readAllData();
  const entries = Array.isArray(allData.entries) ? allData.entries : [];
  if (
    !Number.isInteger(rowIndex) ||
    rowIndex < 0 ||
    rowIndex >= entries.length
  ) {
    return false;
  }

  const entry = entries[rowIndex];
  setCurrentFromEntry(allData, entry);
  allData.editing = rowIndex;
  writeAllData(allData);
  return true;
}

function cloneEntryByIndex(rowIndex) {
  const allData = readAllData();
  const entries = Array.isArray(allData.entries) ? allData.entries : [];
  if (
    !Number.isInteger(rowIndex) ||
    rowIndex < 0 ||
    rowIndex >= entries.length ||
    entries.length >= MAX_STATIONS
  ) {
    return false;
  }

  const entry = entries[rowIndex];
  setCurrentFromEntry(allData, { ...entry });

  // Keep clone as a new draft so saving creates a new entry.
  allData.editing = null;
  writeAllData(allData);
  return true;
}

function deleteEntryByIndex(rowIndex) {
  const allData = readAllData();
  const entries = Array.isArray(allData.entries) ? allData.entries : [];
  if (
    !Number.isInteger(rowIndex) ||
    rowIndex < 0 ||
    rowIndex >= entries.length
  ) {
    return false;
  }

  entries.splice(rowIndex, 1);
  allData.entries = entries;
  writeAllData(allData);
  return true;
}

export {
  getStationRows,
  editEntryByIndex,
  cloneEntryByIndex,
  deleteEntryByIndex,
};
