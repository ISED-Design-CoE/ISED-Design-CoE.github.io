document.addEventListener("DOMContentLoaded", function () {
  fetch("/SAWI/scrape/filtered_output.json")
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
        en: {
          Auction05: "2008 - 2 GHz (AWS-1 & PCS)",
          Auction06: "2009 - air-ground",
          Auction07: "2009 - residual",
          Auction08: "2014 - 700 MHz (MBS)",
          Auction09: "2015 - AWS-3",
          Auction10: "2015 - 2500 MHz-2690 MHz (BRS)",
          Auction11: "2015 - residual",
          Auction12: "2018 - residual",
          Auction13: "2019 - 600 MHz",
          Auction14: "2021 - 3500 MHz",
          Auction15: "2023 - residual",
          Auction16: "2023 - 3800 MHz",
          Auction17: "2024 - residual",
          Auction19: "mmWave",
        },
        fr: {
          Auction05: "2008 - 2 GHz (AWS-1 & PCS)",
          Auction06: "2009 - air-ground",
          Auction07: "2009 - restantes",
          Auction08: "2014 - 700 MHz (MBS)",
          Auction09: "2015 - AWS-3",
          Auction10: "2015 - 2500 MHz-2690 MHz (BRS)",
          Auction11: "2015 - restantes",
          Auction12: "2018 - restantes",
          Auction13: "2019 - 600 MHz",
          Auction14: "2021 - 3500 MHz",
          Auction15: "2023 - restantes",
          Auction16: "2023 - 3800 MHz",
          Auction17: "2024 - restantes",
          Auction19: "bandes millimétriques",
        },
      };

      type_mapping = {
        en: {
          Applicants: "Applicants",
          "Band plan": "Band Plan",
          Comments: "Comments",
          Consultation: "Consultation",
          "Decision / Framework": "Framework",
          "Decision / Framework / Outlook": "Outlook",
          FAQ: "FAQ",
          "Landing page": "Landing Page",
          Manual: "Manual",
          Map: "Map",
          Notice: "Notice",
          Results: "Results",
          "Spectrum Advisory Bulletins (SAB)": "Spectrum Advisory Bulletins ",
          "Table of key dates": "Table of Key Dates",
        },
        fr: {
          Applicants: "Requérants",
          "Band plan": "Plan de répartition des bandes",
          Comments: "Commentaires",
          Consultation: "Consultation",
          "Decision / Framework": "Cadre de délivrance",
          "Decision / Framework / Outlook": "Perspectives",
          FAQ: "FAQ",
          "Landing page": "Landing Page",
          Manual: "Manual",
          Map: "Map",
          Notice: "Notice",
          Results: "Résultats",
          "Spectrum Advisory Bulletins (SAB)": "Spectrum Advisory Bulletins ",
          "Table of key dates": "Table of Key Dates",
        },
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
        if (document.documentElement.lang == "en") {
          match = row.Title.match(/>([^<]*)</);
        } else {
          match = row.Titre.match(/>([^<]*)</);
        }

        const name = match ? match[1] : "";
        tdName.innerHTML = "<a href='#'>" + name + "</a>";
        // tdName.innerHTML = row.Title || "";
        tr.appendChild(tdName);

        tr.addEventListener("click", function (e) {
          e.preventDefault(); // Prevent default link navigation/scroll
          alert("You've clicked a link that brings you out of the mockup."); // Show the alert
        });

        // Type
        tr.setAttribute("doc_type", row.Type);
        const tdType = document.createElement("td");
        tdType.textContent = row.Type || "";
        tr.appendChild(tdType);

        // Auction (Subject)
        tr.setAttribute("auction", row.Subject);
        if (tbody.classList == "auction-column") {
          const tdAuction = document.createElement("td");
          tdAuction.textContent =
            auction_mapping[document.documentElement.lang][row.Subject] || "";
          tr.appendChild(tdAuction);
        }

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
