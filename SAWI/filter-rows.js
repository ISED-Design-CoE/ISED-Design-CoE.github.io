var filters = { doc_type: [], auction: [] };

function filterTable() {
  const rows = document.querySelectorAll(".data_row");
  rows.forEach((row) => {
    if (filters["doc_type"].length == 0 && filters["auction"].length == 0) {
      row.removeAttribute("hidden");
    } else {
      match = false;
      if (filters["doc_type"].length != 0 && filters["auction"].length != 0) {
        if (
          filters["doc_type"].includes(row.getAttribute("doc_type")) &&
          filters["auction"].includes(row.getAttribute("auction"))
        ) {
          row.removeAttribute("hidden");
          match = true;
        }
      } else if (filters["doc_type"].length != 0) {
        if (filters["doc_type"].includes(row.getAttribute("doc_type"))) {
          row.removeAttribute("hidden");
          match = true;
        }
      } else {
        if (filters["auction"].includes(row.getAttribute("auction"))) {
          row.removeAttribute("hidden");
          match = true;
        }
      }
      if (!match) {
        row.setAttribute("hidden", "hidden");
      }
    }
  });
}

function toggleFilter(filter, type) {
  if (filters[type].indexOf(filter) === -1) {
    filters[type].push(filter);
  } else {
    filters[type].splice(filters[type].indexOf(filter), 1);
  }
  console.log(filters);
}

// Could be used to filter tables in auction. Currently unused.

// $(document).on("wb-ready.wb", function (event) {
//   const urlParams = new URLSearchParams(window.location.search);
//   const filter = urlParams.get("filter");
//   if (filter != null) {
//     currentStatus.push(filter);
//     filterTable();
//     console.log(filter + "_checkbox");
//     console.log(document.getElementById(filter + "_checkbox"));
//     document
//       .getElementById(filter + "_checkbox")
//       .setAttribute("checked", "checked");
//   }
// });
