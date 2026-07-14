let lang_alert = new URLSearchParams(window.location.search).get("lang");

if (!lang_alert || !["en", "fr"].includes(lang_alert)) {
  lang_alert = "en";
}

function add_alert() {
  const wrongWayLinks = document.querySelectorAll('a[href="#"]');

  if (!wrongWayLinks.length) {
    return;
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

      wrongWayLinks.forEach((link) => {
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
