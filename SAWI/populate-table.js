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

      auction_mapping = {
        Auction05: "2 GHz",
        Auction06: "850 and 895 MHz",
        Auction07: "2009 residual spectrum auction",
        Auction08: "700 MHz",
        Auction09: "AWS-3",
        Auction10: "2500 MHz",
        Auction11: "2015 residual spectrum auction",
        Auction12: "2018 residual spectrum auction",
        Auction13: "600 MHz",
        Auction14: "3500 MHz",
        Auction15: "2023 residual spectrum auction",
        Auction16: "3800 MHz",
        Auction17: "2024 residual spectrum auction",
        Auction19: "Millimetre wave",
      };

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
        tdAuction.textContent = auction_mapping[row.Subject] || "";
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
