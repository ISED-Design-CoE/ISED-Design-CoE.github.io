// site-data-storage.js
const PAGE_KEY = "site-data-upload-page";
const ALL_DATA_KEY = "site-data-upload-all";

function readAllData() {
  try {
    return JSON.parse(localStorage.getItem(ALL_DATA_KEY) || "{}") || {};
  } catch (err) {
    console.warn("Could not parse saved site data:", err);
    return {};
  }
}

function writeAllData(data) {
  localStorage.setItem(ALL_DATA_KEY, JSON.stringify(data));
}

function ensureState() {
  const state = readAllData();
  if (!Array.isArray(state.entries)) state.entries = [];
  if (typeof state.current !== "object" || state.current === null) {
    state.current = { page1: {}, page2: {}, page3: {} };
  } else {
    state.current.page1 = state.current.page1 || {};
    state.current.page2 = state.current.page2 || {};
    state.current.page3 = state.current.page3 || {};
  }
  if (state.editing == null) state.editing = null;
  return state;
}

function setCurrentPage(pageNumber) {
  localStorage.setItem(PAGE_KEY, String(pageNumber));
}

function clearCurrentEntry() {
  const state = ensureState();
  state.current = { page1: {}, page2: {}, page3: {} };
  state.editing = null;
  writeAllData(state);
}

function clearCsvImportErrors() {
  localStorage.removeItem("site-data-upload-csv-import-errors");
}

export {
  PAGE_KEY,
  ALL_DATA_KEY,
  writeAllData,
  ensureState,
  setCurrentPage,
  clearCurrentEntry,
  clearCsvImportErrors,
};
