var filters = {
  doc_type: [],
  subject_type: [],
  auction: [],
  residual_auction: [],
};

// change number in document-table_info

function filterTable() {
  const rows = document.querySelectorAll(".data_row");
  rows.forEach((row) => {
    const docType = row.getAttribute("doc_type");
    const subjectType = row.getAttribute("subject_type");
    const auctionValue = row.getAttribute("auction");

    const matchDocType =
      filters["doc_type"].length === 0 ||
      filters["doc_type"].includes(docType);
    const matchSubjectType =
      filters["subject_type"].length === 0 ||
      filters["subject_type"].includes(subjectType);
    const matchAuction =
      filters["auction"].length === 0 ||
      filters["auction"].includes(auctionValue) ||
      filters["residual_auction"].includes(auctionValue);

    if (matchDocType && matchSubjectType && matchAuction) {
      row.removeAttribute("hidden");
    } else {
      row.setAttribute("hidden", "hidden");
    }
  });
}

function clearTable() {
  const rows = document.querySelectorAll(".data_row");
  rows.forEach((row) => {
    filters["doc_type"] = [];
    filters["subject_type"] = [];
    filters["auction"] = [];
    filters["residual_auction"] = [];
    row.removeAttribute("hidden");
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
