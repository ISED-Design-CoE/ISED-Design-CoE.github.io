// Load table-of-contents entries from text.json
(function () {
  function escapeHtml(unsafe) {
    if (unsafe === null || unsafe === undefined) return "";
    return String(unsafe)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  async function loadTocFromJson(options = {}) {
    const url = options.url || "text.json";
    const lang = options.lang || "en";
    const tocSelector = options.tocSelector || "#table-of-contents";

    try {
      const res = await fetch(url);
      if (!res.ok)
        throw new Error("Failed to fetch " + url + " (" + res.status + ")");
      const json = await res.json();
      const locale = json[lang] || json["en"] || {};

      const $toc =
        (window.jQuery && window.jQuery(tocSelector)) ||
        document.querySelector(tocSelector);
      if (!$toc) return;

      // Clear existing dynamic entries
      if (window.jQuery) {
        $toc.empty();
      } else {
        $toc.innerHTML = "";
      }

      Object.keys(locale).forEach(function (key) {
        const entry = locale[key];
        if (!entry || typeof entry !== "object") return;

        // Accept entries that have a `column` property
        const col = (entry["column"] || entry.column || "").toString().trim();
        const fieldName = (
          entry["field-name"] ||
          entry["field name"] ||
          entry["fieldName"] ||
          entry["field"] ||
          ""
        )
          .toString()
          .trim();
        if (!col) return;

        const safeCol = escapeHtml(col);
        const safeField = escapeHtml(fieldName || col);
        const liHtml =
          '<li style="margin-bottom: 20px;"><a href="#' +
          safeCol +
          '">' +
          safeCol +
          " - " +
          safeField +
          "</a></li>";

        if (window.jQuery) {
          $toc.append(liHtml);
        } else {
          const li = document.createElement("li");
          li.style.marginBottom = "20px";
          const a = document.createElement("a");
          a.setAttribute("href", "#" + safeCol);
          a.innerHTML = safeCol + " - " + safeField;
          li.appendChild(a);
          $toc.appendChild(li);
        }
      });

      return true;
    } catch (err) {
      // Fail silently; caller can inspect console for details
      console.error("loadTocFromJson error:", err);
      return false;
    }
  }

  // Expose function globally for manual use
  window.loadTocFromJson = loadTocFromJson;

  // Conditionally call on DOM ready only if ToC is empty
  function onReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  onReady(function () {
    try {
      var tocEl = document.querySelector("#table-of-contents");
      var hasChildren = tocEl && tocEl.children && tocEl.children.length > 0;
      if (tocEl && !hasChildren) {
        // If there is no existing ToC content, populate from text.json
        loadTocFromJson().catch(function () {
          /* noop */
        });
      }
    } catch (e) {
      console.error(e);
    }
  });
})();
