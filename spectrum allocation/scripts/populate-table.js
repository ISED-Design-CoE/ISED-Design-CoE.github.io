function populateTableFromSubject(subject, options = {}) {
  const config = {
    tableSelector: "#dataset-filter1",
    jsonPath: "../Assets/masterlist.json",
    subjectField: null,
    titleField: null,
    typeField: null,
    dateField: "Date",
    ...options,
  };

  const table = document.querySelector(config.tableSelector);
  if (!table) return;

  const tbody = table.querySelector("tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  const lang = document.documentElement.lang || "en";
  const titleField = config.titleField || (lang === "fr" ? "Titre" : "Title");
  const typeField =
    config.typeField || (lang === "fr" ? "Type de ressources" : "Type");
  const subjectField =
    config.subjectField || (lang === "fr" ? "Sujet" : "Subject");

  fetch(config.jsonPath)
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to fetch ${config.jsonPath}`);
      return res.json();
    })
    .then((payload) => {
      const rows = Array.isArray(payload?.data) ? payload.data : [];
      const normalizedSubject = String(subject || "")
        .trim()
        .toLowerCase();

      // Split subjects by "/" to support multiple subjects
      const subjects = normalizedSubject
        .split("/")
        .map((s) => s.trim())
        .filter(Boolean);

      const filteredRows = rows.filter((row) => {
        if (!subjects.length) return true;
        const currentSubject = String(row[subjectField] || "").toLowerCase();
        // Return true if the row matches ANY of the subjects (OR logic)
        return subjects.some((subject) => currentSubject.includes(subject));
      });

      const documentTypes = Array.from(
        new Set(
          filteredRows
            .map((row) => String(row[typeField] || "").trim())
            .filter(Boolean),
        ),
      );

      table.dataset.documentTypes = JSON.stringify(documentTypes);
      table.dispatchEvent(
        new CustomEvent("table-populated", { detail: { documentTypes } }),
      );

      if (!filteredRows.length) {
        tbody.innerHTML =
          '<tr><td colspan="3">No matching documents found.</td></tr>';
        return;
      }

      filteredRows.forEach((row) => {
        const tr = document.createElement("tr");
        tr.className = "data_row";

        const docTypeValue = row[typeField] || "";
        tr.setAttribute("doc_type", docTypeValue);
        tr.setAttribute("data-doc-type", docTypeValue);

        const tdDate = document.createElement("td");
        tdDate.textContent = row[config.dateField] || "";
        tr.appendChild(tdDate);

        const tdTitle = document.createElement("td");
        tdTitle.innerHTML = row[titleField] || "";
        tr.appendChild(tdTitle);

        const tdType = document.createElement("td");
        tdType.textContent = docTypeValue;
        tr.appendChild(tdType);

        tbody.appendChild(tr);
      });
    })
    .catch((err) => {
      tbody.innerHTML = '<tr><td colspan="3">Error loading data</td></tr>';
      console.error(err);
    });
}

document.addEventListener("DOMContentLoaded", function () {
  const tables = document.querySelectorAll("[data-populate-table]");

  if (!tables.length) {
    populateTableFromSubject("aeronautical");
    return;
  }

  tables.forEach((table) => {
    const subject = table.dataset.subject || table.dataset.subjectFilter || "";
    const jsonPath = table.dataset.jsonPath || "../Assets/masterlist.json";

    populateTableFromSubject(subject, {
      tableSelector: `#${table.id}`,
      jsonPath,
    });
  });
});

window.populateTableFromSubject = populateTableFromSubject;
