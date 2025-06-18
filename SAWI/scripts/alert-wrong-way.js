const lang_alert = new URLSearchParams(window.location.search).get("lang");

function add_alert() {
  const breadcrumbItems = document.querySelectorAll(".breadcrumb li");

  for (let i = 0; i < Math.min(3, breadcrumbItems.length); i++) {
    breadcrumbItems[i].classList.add("wrong-way");
  }
  fetch("/SAWI/scrape/text.json")
    .then((res) => res.json())
    .then((translations) => {
      const strings = translations[lang_alert];
      document.querySelectorAll(".wrong-way").forEach((link) => {
        link.addEventListener("click", function (e) {
          e.preventDefault(); // Prevent default link navigation/scroll
          alert(strings["alert"]); // Show the alert
        });
      });
    });
}
