document.addEventListener("DOMContentLoaded", function () {
  auction_mapping = {
    en: {
      Auction05: "2008 | 2 GHz (AWS-1 & PCS)",
      Auction06: "2009 | air-ground",
      Auction07: "2009 | residual",
      Auction08: "2014 | 700 MHz (MBS)",
      Auction09: "2015 | AWS-3",
      Auction10: "2015 | 2500 MHz-2690 MHz (BRS)",
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
      Auction05: "2008 | 2 GHz (AWS-1 & PCS)",
      Auction06: "2009 | air-sol",
      Auction07: "2009 | licences restantes",
      Auction08: "2014 | 700 MHz (SMLB)",
      Auction09: "2015 | AWS-3",
      Auction10: "2015 | 2500 MHz-2690 MHz (SRLB)",
      Auction11: "2015 | licences restantes",
      Auction12: "2018 | licences restantes",
      Auction13: "2019 | 600 MHz",
      Auction14: "2021 | 3500 MHz",
      Auction15: "2023 | licences restantes",
      Auction16: "2023 | 3800 MHz",
      Auction17: "2024 | licences restantes",
      Auction19: "Ondes millimétriques",
    },
  };

  type_mapping = {
    en: {
      Applicants: "Applicants (4)",
      "Band plan": "Band plan (1)",
      Comments: "Comments (11)",
      Consultation: "Consultation (12)",
      "Decision / Framework": "Framework (16)",
      "Decision / Framework / Outlook": "Outlook (2)",
      FAQ: "FAQ (5)",
      "Landing page": "Landing page (1)",
      Manual: "Manual (3)",
      Map: "Map (2)",
      Notice: "Notice (2)",
      Results: "Results (15)",
      "Spectrum Advisory Bulletins (SAB)": "Spectrum advisory bulletins (1)",
      "Table of key dates": "Table of key dates (3)",
    },
    fr: {
      Applicants: "Requérants (4)",
      "Band plan": "Plan de répartition des bandes (1)",
      Comments: "Commentaires (11)",
      Consultation: "Consultation (12)",
      "Decision / Framework": "Cadre de délivrance (16)",
      "Decision / Framework / Outlook": "Perspectives (2)",
      FAQ: "FAQ (5)",
      "Landing page": "Page d'accueil (1)",
      Manual: "Manuel (3)",
      Map: "Carte (3)",
      Notice: "Avis (2)",
      Results: "Résultats (15)",
      "Spectrum Advisory Bulletins (SAB)":
        "Bulletins consultatifs sur le spectre (1)",
      "Table of key dates": "Tableau des dates clés (3)",
    },
  };
  function loadCheckboxes(url, containerId, filterType) {
    fetch(url)
      .then((r) => (r.ok ? r.json() : Promise.reject(`Error loading ${url}`)))
      .then((types) => {
        document.getElementById(containerId).innerHTML = types
          .map((type) => {
            if (filterType == "doc_type") {
              mapped_type = type_mapping[document.documentElement.lang][type];
            } else if (
              filterType == "auction" ||
              filterType == "residual_auction"
            ) {
              mapped_type =
                auction_mapping[document.documentElement.lang][type];
            }
            const id = type.replace(/\s+/g, "_").toLowerCase() + "_checkbox";
            return `<li class="checkbox">
              <label for="${id}">
                <input type="checkbox" id="${id}"
                  onchange="toggleFilter('${type}','${filterType}')" />
                ${mapped_type} 
              </label>
            </li>`;
          })
          .join("\n");
      })
      .catch((err) => {
        document.getElementById(containerId).innerHTML = `<li>${err}</li>`;
        console.error(err);
      });
  }
  loadCheckboxes("/SAWI/scrape/auctions.json", "auction-checkboxes", "auction");
  loadCheckboxes(
    "/SAWI/scrape/residual_auctions.json",
    "residual-auction-checkboxes",
    "residual_auction"
  );
  loadCheckboxes("/SAWI/scrape/types.json", "type-checkboxes", "doc_type");
});
