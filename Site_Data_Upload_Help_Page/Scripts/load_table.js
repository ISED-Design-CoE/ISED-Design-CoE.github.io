(function () {
  let dataTable = null;
  let allRows = [];

  // Escape HTML to prevent XSS
  function escapeHtml(unsafe) {
    if (!unsafe) return "";
    return String(unsafe)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Generate table of contents entry from JSON row
  function createTableOfContents(entry) {
    const col = escapeHtml(entry.column || "");
    const fieldName = escapeHtml(entry["field-name"] || "");
    return `<li style="margin-bottom: 20px;"><a href="#${col}">${col} - ${fieldName}</a></li>`;
  }

  // Updates ToC based on DataTables visible rows
  function updateTableOfContentsOnDraw() {
    if (!dataTable) return;

    const tocList = document.querySelector("#table-of-contents");
    if (!tocList) return;

    tocList.innerHTML = "";
    const filteredData = dataTable.rows({ search: "applied" }).data();

    filteredData.each(function (row) {
      // Extract column from the first cell's h3 id attribute
      const h3 = row[0];
      const parser = new DOMParser();
      const doc = parser.parseFromString(h3, "text/html");
      const h3El = doc.querySelector("h3[id]");
      const colLetter = h3El ? h3El.id : null;

      if (colLetter) {
        const originalRow = allRows.find((item) => item.column === colLetter);
        if (originalRow && originalRow.column && originalRow.column.trim()) {
          tocList.innerHTML += createTableOfContents(originalRow);
        }
      }
    });
  }

  // Array of field names to convert to hyperlinks
  const allNames = ["H - Radio Technology", "S - Tx Channel Frequency"];

  // Replace field name references with hyperlinks
  function replaceNamesWithLinks(text) {
    if (!text) return "";
    let result = text;
    allNames.forEach(function (name) {
      const columnLetter = name.split(" - ")[0].trim();
      const regex = new RegExp(
        "\\b" + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b",
        "g",
      );
      const replacement = '<a href="#' + columnLetter + '">' + name + "</a>";
      result = result.replace(regex, replacement);
    });
    return result;
  }

  // Generate table row HTML from JSON entry
  function createTableRow(entry) {
    const col = escapeHtml(entry.column || "");
    const fieldName = escapeHtml(entry["field-name"] || "");
    const descRaw = replaceNamesWithLinks(entry.description || "");
    const requiredWhen = replaceNamesWithLinks(entry["required-when"] || "");
    const example = escapeHtml(entry["example-data"] || "");
    const formatRaw = replaceNamesWithLinks(entry["format-rules"] || "");
    const errorMsg = replaceNamesWithLinks(entry["error-description"] || "");
    const note = replaceNamesWithLinks(entry["note"] || "");

    // Process description - split on "|" if multiple items
    const descItems = descRaw
      .split("|")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (descItems.length > 1) {
      descHTML = "<p>" + descItems[0] + "</p>";
      descHTML += "<ul>";
      for (let i = 1; i < descItems.length; i++) {
        descHTML += "<li>" + descItems[i] + "</li>";
      }
      descHTML += "</ul>";
    } else {
      descHTML = "<p>" + descRaw + "</p>";
    }

    return `<tr class="gradeA">
        <td class="sorting_1">
          <h3 id="${col}" style="text-align:left; scroll-margin-top: 35px;">${col}</h3>
        </td>
        <td style="padding-bottom:40px;">
          <h3>${fieldName}</h3>
          <p>${descHTML}</p>
          ${requiredWhen ? "<h4>Required when</h4><p>" + requiredWhen + "</p>" : ""}
          ${formatRaw && formatRaw.trim() ? "<h4>Format</h4><p>" + formatRaw + "</p>" : ""}
          ${example && example.trim() ? "<h4>Example</h4><p>" + example + "</p>" : ""}
          ${errorMsg && errorMsg.trim() ? "<h4>Potential error(s)</h4><p><code style='display: inline-block; padding: 3px; white-space: pre-wrap; word-wrap'>" + errorMsg + "</code></p>" : ""}
          ${note && note.trim() ? note + "</p>" : ""}
        </td>
      </tr>`;
  }

  // Populate table of contents from JSON data
  function populateTableOfContents(jsonData) {
    const tocList = document.querySelector("#table-of-contents");
    if (!tocList) return;

    tocList.innerHTML = "";
    jsonData.forEach(function (entry) {
      if (entry.column && entry.column.trim()) {
        tocList.innerHTML += createTableOfContents(entry);
      }
    });
  }

  // Populate main table from JSON data
  function populateTable(jsonData) {
    const tbody = document.querySelector("#wb-auto-1 tbody");
    if (!tbody) return;

    tbody.innerHTML = "";
    allRows = [];

    // Filter and store valid entries
    jsonData.forEach(function (entry) {
      if (entry.column && entry.column.trim()) {
        allRows.push(entry);
      }
    });

    // Create table rows
    allRows.forEach(function (entry) {
      tbody.innerHTML += createTableRow(entry);
    });

    // Destroy existing DataTable if present
    if ($.fn && $.fn.DataTable && $.fn.DataTable.isDataTable("#wb-auto-1")) {
      dataTable.destroy();
    }

    // Reinitialize DataTable
    dataTable = jQuery("#wb-auto-1").DataTable({
      layout: {
        topStart: {
          topStart: "info",
        },
      },
      paging: false,
      autoWidth: false,
      searching: true,
      order: [],
      columnDefs: [{ orderable: false, targets: "_all" }],
      language: {
        search: "Filter",
      },
    });
  }

  // Update ToC on DataTable draw event
  if (jQuery) {
    jQuery(document).on("draw.dt", "#wb-auto-1", function () {
      updateTableOfContentsOnDraw();
    });
  }

  // Load JSON and populate on DOM ready
  document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const lang = urlParams.get("lang") || "en";

    console.log("Table Generator started. Language:", lang);

    fetch("./text.json")
      .then((res) => {
        if (!res.ok)
          throw new Error("Could not load text.json - Check if file exists");
        return res.json();
      })
      .then((translations) => {
        console.log("JSON loaded successfully:", translations);

        const strings = translations[lang];
        if (!strings) {
          console.error("No translation section found for:", lang);
          return;
        }

        // Extract all TR entries and convert to array
        const entries = [];
        for (const key in strings) {
          if (key.match(/^TR\d+$/)) {
            entries.push(strings[key]);
          }
        }

        if (entries.length === 0) {
          console.error("No TR entries found in JSON");
          return;
        }

        populateTableOfContents(entries);
        populateTable(entries);
      })
      .catch((err) => console.error("Table Generator Error:", err));
  });
})();
