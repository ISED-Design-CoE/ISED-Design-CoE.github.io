document.addEventListener("DOMContentLoaded", function () {
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
      Auction06: "2009 - air-sol",
      Auction07: "2009 - licences restantes",
      Auction08: "2014 - 700 MHz (SMLB)",
      Auction09: "2015 - AWS-3",
      Auction10: "2015 - 2500 MHz-2690 MHz (SRLB)",
      Auction11: "2015 - licences restantes",
      Auction12: "2018 - licences restantes",
      Auction13: "2019 - 600 MHz",
      Auction14: "2021 - 3500 MHz",
      Auction15: "2023 - licences restantes",
      Auction16: "2023 - 3800 MHz",
      Auction17: "2024 - licences restantes",
      Auction19: "Ondes millimétriques",
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
