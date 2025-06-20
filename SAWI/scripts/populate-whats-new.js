document.addEventListener("DOMContentLoaded", function () {
  fetch("/SAWI/scrape/filtered_output.json")
    .then((res) => {
      if (!res.ok) throw new Error("Failed to fetch filtered_output.json");
      return res.json();
    })
    .then((data) => {
      let whats_new_lang = new URLSearchParams(window.location.search).get(
        "lang"
      );
      if (!whats_new_lang) {
        whats_new_lang = "en";
      }

      const whats_new_dl = document.getElementById("whats-new-dl");
      if (!whats_new_dl) return console.error("Missing whats-new-dl");

      for (const [i, row] of data.entries()) {
        if (i == 6) {
          break;
        }
        const dt = document.createElement("dt");
        dt.classList = "label label-warning";
        const span = document.createElement("span");
        if (whats_new_lang == "en") {
          span.innerHTML = "Updated on " + row.Date;
        } else {
          span.innerHTML = "Mis à jour le " + row.Date;
        }
        dt.appendChild(span);
        whats_new_dl.appendChild(dt);
        const dd = document.createElement("dd");
        if (whats_new_lang == "en") {
          match = row.Title.match(/>([^<]*)</);
        } else {
          match = row.Titre.match(/>([^<]*)</);
        }
        const name = match ? match[1] : "";
        dd.innerHTML = "<a href=#>" + name + "</a>";
        dd.addEventListener("click", function (e) {
          e.preventDefault(); // Prevent default link navigation/scroll
          fetch("/SAWI/scrape/text.json")
            .then((res) => res.json())
            .then((translations) => {
              alert(translations[whats_new_lang]["alert"]); // Show the alert
            });
        });
        whats_new_dl.appendChild(dd);
      }
    })
    .catch((err) => {
      const tbody = document.querySelector("#document-table tbody");
      if (tbody)
        tbody.innerHTML = `<tr><td colspan="4">Error loading data</td></tr>`;
      console.error(err);
    });
});
