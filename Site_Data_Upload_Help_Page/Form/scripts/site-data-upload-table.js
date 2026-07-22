// site-data-upload-table.js
import { setCurrentPage } from "./site-data-upload-csv.js";

const ALL_DATA_KEY = "site-data-upload-all";

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

function getStationRows() {
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

  if (rows.length) {
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

function escapeHtml(text) {
  if (text == null) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function wireDeleteDialog() {
  const dialog = document.getElementById("delete-station-dialog");
  if (!dialog || dialog.dataset.wired === "true") return;

  const cancelButton = document.getElementById("cancel-delete-dialog");
  const confirmButton = document.getElementById("confirm-delete-dialog");

  cancelButton?.addEventListener("click", (event) => {
    event.preventDefault();
    dialog.close();
    delete dialog.dataset.deleteRowIndex;
  });

  confirmButton?.addEventListener("click", (event) => {
    event.preventDefault();

    const rowIndex = Number(dialog.dataset.deleteRowIndex);
    if (!Number.isNaN(rowIndex)) {
      deleteEntryAtIndex(rowIndex);
    }

    dialog.close();
    delete dialog.dataset.deleteRowIndex;
  });

  dialog.dataset.wired = "true";
}

function deleteEntryAtIndex(rowIndex) {
  const allData = readAllData();
  const entries = Array.isArray(allData.entries) ? allData.entries : [];

  if (entries.length) {
    if (rowIndex < 0 || rowIndex >= entries.length) return;
    entries.splice(rowIndex, 1);
    allData.entries = entries;
  } else if (rowIndex === 0) {
    allData.current = { page1: {}, page2: {}, page3: {} };
    allData.editing = undefined;
  } else {
    return;
  }

  writeAllData(allData);
  populateAntennaTable();
}

function populateAntennaTable() {
  const rows = getStationRows();
  const tbody = document.getElementById("antennas-table-body");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (!rows.length) {
    const emptyRow = document.createElement("tr");
    emptyRow.innerHTML = '<td colspan="5">No station data available yet.</td>';
    tbody.appendChild(emptyRow);
    return;
  }

  rows.forEach((row, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(row.licenceNumber)}</td>
      <td>${escapeHtml(row.referenceNumber)}</td>
      <td>${escapeHtml(row.stationLocation)}</td>
      <td>${escapeHtml(row.provinceTerritory)}</td>
      <td>
        <a href="#" class="gcds-link" data-action="edit" data-row="${index}">Edit</a>
        &nbsp;|&nbsp;
        <a href="#" class="gcds-link" data-action="delete" data-row="${index}">Delete</a>
      </td>
    `;

    tbody.appendChild(tr);
  });

  tbody.onclick = (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const deleteLink = target.closest('a[data-action="delete"]');
    const editLink = target.closest('a[data-action="edit"]');
    const action =
      deleteLink?.getAttribute("data-action") ||
      editLink?.getAttribute("data-action");
    const rowIndex = Number((deleteLink || editLink)?.getAttribute("data-row"));

    if (!action || Number.isNaN(rowIndex)) return;

    event.preventDefault();

    if (action === "edit") {
      const allData = readAllData();
      const entries = Array.isArray(allData.entries) ? allData.entries : [];
      if (rowIndex >= entries.length) return;

      const entry = entries[rowIndex];

      // Populate current with the entry data split by pages
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

      allData.editing = rowIndex;

      writeAllData(allData);
      setCurrentPage(1);
      window.location.href = "page1.html";
      return;
    }

    if (action === "delete") {
      const dialog = document.getElementById("delete-station-dialog");
      if (!dialog) return;

      wireDeleteDialog();
      dialog.dataset.deleteRowIndex = String(rowIndex);
      dialog.showModal();
      return;
    }
  };
}

function initTablePage() {
  wireDeleteDialog();
  populateAntennaTable();
}

export { initTablePage, readAllData, getStationRows };
