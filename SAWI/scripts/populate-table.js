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
          Auction01: "1999 | 24, 38 GHz",
          Auction02: "2001 | 2 GHz",
          Auction03: "2004 | 2300, 3500 MHz",
          Auction04: "2005 | residual",
          Auction05: "2008 | AWS-1, 2 GHz",
          Auction06: "2009 | air-ground",
          Auction07: "2009 | residual",
          Auction08: "2014 | 700 MHz",
          Auction09: "2015 | AWS-3",
          Auction10: "2015 | 2500 MHz",
          Auction11: "2015 | residual",
          Auction12: "2018 | residual",
          Auction13: "2019 | 600 MHz",
          Auction14: "2021 | 3500 MHz",
          Auction15: "2023 | residual",
          Auction16: "2023 | 3800 MHz",
          Auction17: "2024 | residual",
          Auction19: "mmWave",
        },
        fr: {
          Auction01: "1999 | 24, 38 GHz",
          Auction02: "2001 | 2 GHz",
          Auction03: "2004 | 2300, 3500 MHz",
          Auction04: "2005 | résiduelles",
          Auction05: "2008 | SSFE-1, 2 GHz",
          Auction06: "2009 | air-sol",
          Auction07: "2009 | résiduelles",
          Auction08: "2014 | 700 MHz",
          Auction09: "2015 | SSFE-3",
          Auction10: "2015 | 2500 MHz",
          Auction11: "2015 | résiduelles",
          Auction12: "2018 | résiduelles",
          Auction13: "2019 | 600 MHz",
          Auction14: "2021 | 3500 MHz",
          Auction15: "2023 | résiduelles",
          Auction16: "2023 | 3800 MHz",
          Auction17: "2024 | résiduelles",
          Auction19: "ondes mm",
        },
      };

      type_mapping = {
        en: {
          Applicants: "Applicants",
          "Band plan": "Band plan",
          Comments: "Comments",
          Consultation: "Consultation",
          "Decision / Framework": "Decision",
          "Decision / Framework / Outlook": "Outlook",
          FAQ: "FAQ",
          "Landing page": "Landing page",
          Manual: "Manual",
          Map: "Map",
          Notice: "Notice",
          Results: "Results",
          "Spectrum Advisory Bulletins (SAB)": "Spectrum advisory bulletins ",
          "Table of key dates": "Table of key dates",
        },
        fr: {
          Applicants: "Requérants",
          "Band plan": "Plan de répartition des bandes",
          Comments: "Commentaires",
          Consultation: "Consultation",
          "Decision / Framework": "Décision",
          "Decision / Framework / Outlook": "Perspectives",
          FAQ: "FAQ",
          "Landing page": "Page d'accueil",
          Manual: "Manuel",
          Map: "Carte",
          Notice: "Avis",
          Results: "Résultats",
          "Spectrum Advisory Bulletins (SAB)":
            "Bulletins consultatifs sur le spectre",
          "Table of key dates": "Tableau des dates clés",
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
          fetch("/SAWI/scrape/text.json")
            .then((res) => res.json())
            .then((translations) => {
              let table_translation = new URLSearchParams(
                window.location.search
              ).get("lang");
              if (!table_translation) {
                table_translation = "en";
              }
              alert(translations[table_translation]["alert"]); // Show the alert
            });
        });

        // Type
        tr.setAttribute("doc_type", row.Type);
        const tdType = document.createElement("td");
        tdType.textContent =
          type_mapping[document.documentElement.lang][row.Type] || "";
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
