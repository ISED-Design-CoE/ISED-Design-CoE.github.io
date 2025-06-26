(function () {
  const defaultLang = "en";
  const supportedLangs = ["en", "fr"];

  // Get lang from URL, fallback to default
  const urlParams = new URLSearchParams(window.location.search);
  let lang = urlParams.get("lang");
  if (!supportedLangs.includes(lang)) {
    const referrer = document.referrer;
    if (referrer) {
      const refUrl = new URL(referrer);
      const refLang = refUrl.searchParams.get("lang");
      if (supportedLangs.includes(refLang)) {
        lang = refLang;

        // Optional: Update the current URL to reflect this inherited lang
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set("lang", lang);
        window.history.replaceState({}, "", currentUrl.toString());
        location.reload(); // Reload to apply the lang param
      } else {
        lang = defaultLang;
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set("lang", lang);
        window.history.replaceState({}, "", currentUrl.toString());
        location.reload(); // Reload to apply the lang param
      }
    } else {
      lang = defaultLang;
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set("lang", lang);
      window.history.replaceState({}, "", currentUrl.toString());
      location.reload(); // Reload to apply the lang param
    }
  }

  // Language to toggle to
  const toggleLang = lang === "en" ? "fr" : "en";

  // Text for toggle display
  const toggleText = toggleLang === "en" ? "English" : "Français";
  const toggleAbbr = toggleLang;

  // Wait for DOM
  document.addEventListener("DOMContentLoaded", () => {
    const toggleEl = document.getElementById("lang-toggle");
    if (!toggleEl) return;

    // Find parent <a> if exists
    const parentLink = toggleEl.closest("a");

    if (parentLink) {
      // Update href with toggled lang param
      const url = new URL(window.location.href);
      url.searchParams.set("lang", toggleLang);
      parentLink.href = url.toString();

      // Update lang and hreflang attributes
      parentLink.lang = toggleLang;
      parentLink.hreflang = toggleLang;

      // Update inner texts
      toggleEl.textContent = toggleText;
      const abbr = parentLink.querySelector("abbr");
      if (abbr) {
        abbr.textContent = toggleAbbr;
        abbr.title = toggleText;
      }
    } else {
      // Not an <a>, assume clickable element like <button>
      toggleEl.textContent = toggleText;

      // If you have an <abbr> inside toggleEl, update it too
      const abbr = toggleEl.querySelector("abbr");
      if (abbr) {
        abbr.textContent = toggleAbbr;
        abbr.title = toggleText;
      }

      // Add click handler to redirect
      toggleEl.style.cursor = "pointer";
      toggleEl.addEventListener("click", () => {
        const url = new URL(window.location.href);
        url.searchParams.set("lang", toggleLang);
        window.location.href = url.toString();
      });
    }

    // Load translations and apply
    fetch("/SAWI/scrape/text.json")
      .then((res) => res.json())
      .then((translations) => {
        const strings = translations[lang];
        if (!strings) return;

        document.querySelectorAll("[data-i18n]").forEach((el) => {
          const key = el.getAttribute("data-i18n");
          if (strings[key]) el.innerHTML = strings[key];
        });
      })
      .catch((err) => console.error("Error loading translations:", err));
  });
})();
