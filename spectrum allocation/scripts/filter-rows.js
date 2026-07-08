var filters = { doc_type: [], auction: [], residual_auction: [] };
var originalRows = []; // Store original rows for filtering

function normalizeValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function getRowValue(row, type) {
  return row.getAttribute(type) || row.getAttribute(`data-${type}`) || "";
}

function filterTable() {
  const tbody = document.querySelector("table.dataTable tbody");
  if (!tbody) return;

  // Get all rows (either from originalRows or from current tbody)
  let rowsToFilter =
    originalRows.length > 0
      ? originalRows
      : Array.from(tbody.querySelectorAll("tr.data_row"));

  // Store original rows if not already stored
  if (originalRows.length === 0) {
    originalRows = rowsToFilter.map((row) => row.cloneNode(true));
  }

  // Filter rows based on active filters
  const filteredRows = originalRows.filter((row) => {
    return Object.keys(filters).every((filterType) => {
      const filterValues = filters[filterType];
      if (filterValues.length === 0) {
        return true;
      }
      return filterValues.some(
        (value) =>
          normalizeValue(getRowValue(row, filterType)) ===
          normalizeValue(value),
      );
    });
  });

  // Clear and rebuild tbody with filtered rows
  tbody.innerHTML = "";
  filteredRows.forEach((row) => {
    tbody.appendChild(row.cloneNode(true));
  });

  // Reinitialize DataTables to recalculate pagination
  reinitializeDataTable();
}

function reinitializeDataTable() {
  // Find the DataTable and reinitialize it
  const tables = document.querySelectorAll("table.dataTable");
  tables.forEach((table) => {
    // Check if DataTables is initialized on this table
    if ($.fn.dataTable.isDataTable(table)) {
      // Destroy and reinitialize
      $(table).DataTable().destroy();
      $(table).DataTable();
    }
  });
}

function clearTable() {
  filters.doc_type = [];
  filters.auction = [];
  filters.residual_auction = [];

  document.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    checkbox.checked = false;
  });

  // Restore original rows
  const tbody = document.querySelector("table.dataTable tbody");
  if (tbody && originalRows.length > 0) {
    tbody.innerHTML = "";
    originalRows.forEach((row) => {
      tbody.appendChild(row.cloneNode(true));
    });
    reinitializeDataTable();
  } else {
    filterTable();
  }
}

function toggleFilter(filter, type) {
  const normalizedFilter = normalizeValue(filter);
  const currentFilters = filters[type] || [];
  const existingIndex = currentFilters.findIndex(
    (value) => normalizeValue(value) === normalizedFilter,
  );

  if (existingIndex === -1) {
    currentFilters.push(filter);
  } else {
    currentFilters.splice(existingIndex, 1);
  }

  filters[type] = currentFilters;
  filterTable();
}

document.addEventListener("DOMContentLoaded", function () {
  // Handle all forms with filter functionality
  document.querySelectorAll("form.wb-tables-filter").forEach((form) => {
    // Add reset button listeners
    const resetButtons = form.querySelectorAll('button[type="reset"]');
    resetButtons.forEach((btn) => {
      btn.addEventListener("click", clearTable);
    });

    // Add form reset event listener
    form.addEventListener("reset", clearTable);

    // Add checkbox change listeners
    const checkboxes = form.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", function (e) {
        if (e.target.id && e.target.getAttribute("onchange")) {
          // Allow inline onchange handlers to execute
          e.target.onchange?.(e);
        }
      });
    });
  });

  // Fallback for legacy single reset button by ID
  const legacyResetButton = document.getElementById("reset-filters");
  if (legacyResetButton) {
    legacyResetButton.addEventListener("click", clearTable);
  }
});

// Could be used to filter tables in auction. Currently unused.

// $(document).on("wb-ready.wb", function (event) {
//   const urlParams = new URLSearchParams(window.location.search);
//   const filter = urlParams.get("filter");
//   if (filter != null) {
//     currentStatus.push(filter);
//     filterTable();
//     console.log(filter + "_checkbox");
//     console.log(document.getElementById(filter + "_checkbox"));
//     document
//       .getElementById(filter + "_checkbox")
//       .setAttribute("checked", "checked");
//   }
// });
