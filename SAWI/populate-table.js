document.addEventListener("DOMContentLoaded", function () {
  fetch("filtered_output.json")
    .then((res) => {
      if (!res.ok) throw new Error("Failed to fetch filtered_output.json");
      return res.json();
    })
    .then((data) => {
      const tbody = document.querySelector("#document-table tbody");
      if (!tbody) return console.error("Missing <tbody> in #document-table");

      // Clear table
      tbody.innerHTML = "";

      for (const row of data) {
        const tr = document.createElement("tr");
        tr.classList = "data_row";

        // Date
        const tdDate = document.createElement("td");
        tdDate.textContent = row.Date || "";
        tr.appendChild(tdDate);

        // Name (Title) -- may contain HTML
        const tdName = document.createElement("td");
        tdName.innerHTML = row.Title || "";
        tr.appendChild(tdName);

        // Type
        tr.setAttribute("doc_type", row.Type);
        const tdType = document.createElement("td");
        tdType.textContent = row.Type || "";
        tr.appendChild(tdType);

        // Auction (Subject)
        tr.setAttribute("auction", row.Subject);
        const tdAuction = document.createElement("td");
        tdAuction.textContent = row.Subject || "";
        tr.appendChild(tdAuction);

        tbody.appendChild(tr);
      }
    })
    .catch((err) => {
      const tbody = document.querySelector("#document-table tbody");
      if (tbody)
        tbody.innerHTML = `<tr><td colspan="4">Error loading data</td></tr>`;
      console.error(err);
    });
});
