// site-data-upload-table.js
const ALL_DATA_KEY = "site-data-upload-all";

function readAllData() {
  try {
    return JSON.parse(localStorage.getItem(ALL_DATA_KEY) || "{}");
  } catch (err) {
    console.warn("Could not parse saved site data:", err);
    return {};
  }
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

function populateAntennaTable() {
  const rows = getStationRows();
  const tbody = document.getElementById("antennas-table-body");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (!rows.length) {
    const emptyRow = document.createElement("tr");
    emptyRow.innerHTML =
      '<td colspan="5">No station data available yet. Please complete pages 1–3 first.</td>';
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

  tbody.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const action = target.getAttribute("data-action");
    const rowIndex = Number(target.getAttribute("data-row"));

    if (!action || Number.isNaN(rowIndex)) return;

    event.preventDefault();

    if (action === "edit") {
      // You can populate the form fields using stored data.
      // For now, this is a placeholder to show you can implement editing.
      alert(`Edit row ${rowIndex + 1}`);
      return;
    }

    if (action === "delete") {
      const allData = readAllData();
      const entries = Array.isArray(allData.entries) ? allData.entries : [];
      entries.splice(rowIndex, 1);
      allData.entries = entries;
      localStorage.setItem(ALL_DATA_KEY, JSON.stringify(allData));
      populateAntennaTable();
      return;
    }
  });
}

function initTablePage() {
  populateAntennaTable();
}

export { initTablePage, readAllData, getStationRows };
