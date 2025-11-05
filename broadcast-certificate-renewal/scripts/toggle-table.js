sc6Rows = 0;

function toggleTable(changeId, sc6RowId = null) {
  document.getElementById("sc6andmore").setAttribute("hidden", true);
  [...document.getElementsByClassName("first-button")].forEach(
    (el) => (el.style.display = "inline")
  );
  if (document.getElementById(changeId).getAttribute("disabled") != null) {
    document.getElementById(changeId).removeAttribute("disabled");
    document.getElementById("renewedLicences").innerHTML =
      Number(document.getElementById("renewedLicences").innerHTML) + 1;
    if (sc6RowId != null) {
      document.getElementById(sc6RowId).removeAttribute("hidden");
      if (sc6Rows == 0) {
        document.getElementById("sc6-table").removeAttribute("hidden");
      }
      sc6Rows += 1;
    }
  } else {
    document.getElementById(changeId).setAttribute("disabled", true);
    document.getElementById(changeId).setAttribute("value", []);
    document.getElementById("renewedLicences").innerHTML =
      Number(document.getElementById("renewedLicences").innerHTML) - 1;
    if (sc6RowId != null) {
      document.getElementById(sc6RowId).setAttribute("hidden", true);
      sc6Rows -= 1;
      if (sc6Rows == 0) {
        document.getElementById("sc6-table").setAttribute("hidden", true);
      }
    }
  }
}

function checkall() {
  for (let i = 0; i < 5; i++) {
    document.getElementById("renew-" + i).setAttribute("value", "yes");
    document.getElementById("renew-" + i).setAttribute("previous", "yes");
    document.getElementById("change" + (i + 1)).removeAttribute("disabled");
  }
  document.getElementById("renewedLicences").innerHTML = 5;
  document.getElementById("sc6andmore").setAttribute("hidden", true);
  [...document.getElementsByClassName("first-button")].forEach(
    (el) => (el.style.display = "inline")
  );
  document.getElementById("sc6-row-1").removeAttribute("hidden");
  document.getElementById("sc6-row-2").removeAttribute("hidden");
  document.getElementById("sc6-row-3").removeAttribute("hidden");
  document.getElementById("sc6-table").removeAttribute("hidden");
  sc6Rows = 3;
}
