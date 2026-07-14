let lang_alert = new URLSearchParams(window.location.search).get("lang");

if (!lang_alert || !["en", "fr"].includes(lang_alert)) {
  lang_alert = "en";
}

function add_alert() {
  const breadcrumbItems = document.querySelectorAll(".breadcrumb li");

  for (let i = 0; i < Math.min(3, breadcrumbItems.length); i++) {
    breadcrumbItems[i].classList.add("wrong-way");
  }

  fetch(new URL("/spectrum allocation/Assets/text.json", window.location.href))
    .then((res) => {
      if (!res.ok) {
        throw new Error(`Failed to load translations: ${res.status}`);
      }
      return res.json();
    })
    .then((translations) => {
      const strings = translations[lang_alert];

      if (!strings?.alert) {
        return;
      }

      document.querySelectorAll(".wrong-way").forEach((link) => {
        link.addEventListener("click", function (e) {
          e.preventDefault();
          alert(strings.alert);
        });
      });
    })
    .catch((error) => {
      console.error("Unable to load alert translations:", error);
    });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", add_alert);
} else {
  add_alert();
}
