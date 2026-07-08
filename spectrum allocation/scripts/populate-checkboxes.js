(function () {
  function createCheckboxMarkup(type, filterType) {
    const id = String(type).replace(/\s+/g, "_").toLowerCase() + "_checkbox";

    return `
      <li class="checkbox">
        <label for="${id}">
          <input
            type="checkbox"
            id="${id}"
            onchange="toggleFilter('${type}', '${filterType}')"
          />
          ${type}
        </label>
      </li>`;
  }

  function renderCheckboxes(container, values, filterType) {
    const normalizedValues = Array.isArray(values) ? values : [];
    container.innerHTML = `
      <ul class="list-unstyled">
        ${normalizedValues
          .map((item) => createCheckboxMarkup(item, filterType))
          .join("")}
      </ul>`;
  }

  function getDocumentTypes(table) {
    if (!table) return [];

    try {
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
      renderCheckboxes(container, getDocumentTypes(table), config.filterType);
    };

    if (table) {
      const currentTypes = getDocumentTypes(table);
      if (currentTypes.length) {
        renderFromTable();
        return;
      }

      table.addEventListener(
        "table-populated",
        () => {
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
      populateCheckboxes({
        container,
        filterType,
        tableSelector,
      });
    });
  });

  window.populateCheckboxes = populateCheckboxes;
  window.loadCheckboxes = populateCheckboxes;
})();
