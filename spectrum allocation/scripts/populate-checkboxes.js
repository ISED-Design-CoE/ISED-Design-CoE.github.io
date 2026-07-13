(function () {
  function createCheckboxMarkup(type, filterType, filterType2) {
    const sanitized = String(type).replace(/\s+/g, "_").toLowerCase();
    const id = `${filterType}_${sanitized}_checkbox`;

    return `
      <li class="checkbox">
        <label for="${id}">
          <input
            type="checkbox"
            id="${id}"
            onchange="toggleFilter('${type.replace(/'/g, "\\'")}', '${filterType}')"
          />
          ${type}
        </label>
      </li>`;
  }

  function renderCheckboxes(container, values, filterType) {
    const normalizedValues = Array.isArray(values) ? values : [];
    const uniqueValues = Array.from(
      new Set(normalizedValues.map((v) => String(v).trim()).filter(Boolean)),
    ).sort();

    container.innerHTML = `
      <ul class="list-unstyled">
        ${uniqueValues.map((item) => createCheckboxMarkup(item, filterType)).join("")}
      </ul>`;
  }

  function getDocumentTypes(table) {
    return getTypesForFilter(table, "doc_type");
  }

  function getTypesForFilter(table, filterType) {
    if (!table) return [];

    try {
      if (filterType === "subject_type") {
        return JSON.parse(table.dataset.subjectTypes || "[]");
      }

      return JSON.parse(table.dataset.documentTypes || "[]");
    } catch (err) {
      console.error(err);
      return [];
    }
  }

  function populateCheckboxes(options = {}) {
    const config = {
      container: null,
      containerSelector: null,
      tableSelector: null,
      filterType: "doc_type",
      ...options,
    };

    const container =
      config.container ||
      (config.containerSelector
        ? document.querySelector(config.containerSelector)
        : null);

    if (!container) return;

    const table = config.tableSelector
      ? document.querySelector(config.tableSelector)
      : null;

    const renderFromTable = () => {
      const values = getTypesForFilter(table, config.filterType);
      renderCheckboxes(container, values, config.filterType);
    };

    if (table) {
      const currentTypes = getDocumentTypes(table);
      if (currentTypes.length) {
        renderFromTable();
        return;
      }

      table.addEventListener(
        "table-populated",
        (e) => {
          renderFromTable();
        },
        { once: true },
      );
      return;
    }

    container.innerHTML = "";
  }

  document.addEventListener("DOMContentLoaded", function () {
    const containers = document.querySelectorAll("[data-populate-checkboxes]");

    containers.forEach((container) => {
      const filterType = container.dataset.filterType || "doc_type";
      const tableSelector = container.dataset.tableSelector || null;

      populateCheckboxes({ container, filterType, tableSelector });
    });
  });

  window.populateCheckboxes = populateCheckboxes;
  window.loadCheckboxes = populateCheckboxes;
})();
