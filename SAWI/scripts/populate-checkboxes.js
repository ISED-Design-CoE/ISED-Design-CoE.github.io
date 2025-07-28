document.addEventListener("DOMContentLoaded", function () {
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
      Applicants: "Applicants (4)",
      "Band plan": "Band plan (1)",
      Comments: "Comments (11)",
      Consultation: "Consultation (12)",
      "Decision / Framework": "Decision (16)",
      FAQ: "FAQ (5)",
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
      "Decision / Framework": "Décision (16)",
      FAQ: "FAQ (5)",
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
  // loadCheckboxes(
  //   "/SAWI/scrape/residual_auctions.json",
  //   "residual-auction-checkboxes",
  //   "residual_auction"
  // );
  loadCheckboxes("/SAWI/scrape/types.json", "type-checkboxes", "doc_type");
});
