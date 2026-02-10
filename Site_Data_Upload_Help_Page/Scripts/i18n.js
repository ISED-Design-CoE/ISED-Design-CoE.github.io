(function () {
  const defaultLang = "en";
  const supportedLangs = ["en", "fr"];

  const url = new URL(window.location.href);
  let lang = url.searchParams.get("lang");
  if (!supportedLangs.includes(lang)) {
    let targetLang = defaultLang;
    try {
      const referrer = document.referrer ? new URL(document.referrer) : null;
      const refLang = referrer?.searchParams.get("lang");
      if (supportedLangs.includes(refLang)) targetLang = refLang;
    } catch (e) {}

    url.searchParams.set("lang", targetLang);
    window.location.replace(url.toString());
    return;
  }

  const toggleLang = lang === "en" ? "fr" : "en";
  const toggleText = toggleLang === "en" ? "English" : "Français";

  document.addEventListener("DOMContentLoaded", () => {
    document.documentElement.lang = lang;

    const toggleEl = document.getElementById("lang-toggle");
    if (toggleEl) {
      const parentLink = toggleEl.closest("a");
      const toggleUrl = new URL(window.location.href);
      toggleUrl.searchParams.set("lang", toggleLang);

      if (parentLink) {
        parentLink.href = toggleUrl.toString();
        parentLink.lang = toggleLang;
        parentLink.hreflang = toggleLang;
      }
      toggleEl.textContent = toggleText;
    }

    fetch("/Site_Data_Upload_Help_Page/text.json")
      .then((res) => {
        if (!res.ok) throw new Error("Could not find text.json file");
        return res.json();
      })
      .then((translations) => {
        const strings = translations[lang];
        if (!strings) return;

        document.querySelectorAll("[data-i18n]").forEach((el) => {
          const key = el.getAttribute("data-i18n");
          if (strings[key]) {
            el.innerHTML = strings[key];
          }
        });
      })
      .catch((err) => console.error("Translation Error:", err));
  });
})();
