document.addEventListener("DOMContentLoaded", function () {
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
  function loadCheckboxes(url, containerId, filterType) {
    fetch(url)
      .then((r) => (r.ok ? r.json() : Promise.reject(`Error loading ${url}`)))
      .then((types) => {
        document.getElementById(containerId).innerHTML = types
          .map((type) => {
            mapped_type = type;
            if (filterType == "auction") {
              mapped_type = auction_mapping[type];
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
  loadCheckboxes("auctions.json", "auction-checkboxes", "auction");
  loadCheckboxes("types.json", "type-checkboxes", "doc_type");
});
