(function () {
  "use strict";

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      if (document.querySelector('script[src="' + src + '"]')) {
        resolve();
        return;
      }
      var s = document.createElement("script");
      s.src = src;
      s.async = false;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function domReady(fn) {
    if (document.readyState === "loading")
      document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  domReady(function () {
    loadScript(
      "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.9.4/Chart.min.js",
    )
      .then(function () {
        return loadScript(
          "https://cdnjs.cloudflare.com/ajax/libs/hammer.js/2.0.8/hammer.min.js",
        );
      })
      .then(function () {
        return loadScript(
          "https://cdnjs.cloudflare.com/ajax/libs/chartjs-plugin-zoom/0.7.7/chartjs-plugin-zoom.min.js",
        );
      })
      .then(function () {
        initFreqCharts();
      })
      .catch(function (err) {
        console.error("FreqChart: failed to load dependency", err);
      });
  });

  function initFreqCharts() {
    var CHART_HEIGHT = 290;
    var maritimePreview =
      new URLSearchParams(location.search).get("preview") === "true";
    var maritimeServices = [
      "Maritime radionavigation",
      "Maritime mobile",
      "Maritime mobile-Satellite",
    ];

    var chartInstances = [];

    // Filter state
    var serviceKeys = [];
    var serviceChecked = {};

    // Legend search
    var serviceRows = [];
    var searchEl = null;

    // Tooltip elements
    var ttEl = document.getElementById("freqTooltip");
    var ttTitle = document.getElementById("ttTitle");
    var ttService = document.getElementById("ttService");
    var ttNotes = document.getElementById("ttNotes");

    var hideTimer = null;
    var HIDE_DELAY = 300;

    function norm(str) {
      return (
        (str || "")
          .toString()
          .trim()
          .replace(/\s+/g, " ")
          // normalize different hyphen characters to "-"
          .replace(/[‐‑‒–—﹣－]/g, "-")
          .toLowerCase()
      );
    }

    function positionTooltip(mouseX, mouseY) {
      var w = ttEl.offsetWidth || 300;
      var h = ttEl.offsetHeight || 120;
      var vw = window.innerWidth;
      var vh = window.innerHeight;
      var x = mouseX + 18;
      var y = mouseY + 18;
      if (x + w > vw - 10) x = mouseX - w - 10;
      if (y + h > vh - 10) y = mouseY - h - 10;
      ttEl.style.left = x + "px";
      ttEl.style.top = y + "px";
    }

    function showTooltip(ds, mouseX, mouseY) {
      clearTimeout(hideTimer);

      ttTitle.textContent = ds.frequencyRange || "";

      var serviceLines = "";
      if (ds.parsedServices && ds.parsedServices.length) {
        ds.parsedServices.forEach(function (svc) {
          var prefix = svc.isPrimary ? "▪ " : "◦ ";
          var style = svc.isPrimary
            ? "color:#fff;"
            : "color:#bbb;font-style:italic;";

          var fn =
            svc.footnotes && svc.footnotes.length
              ? ' <span style="color:#ffd;font-size:10px;">' +
                svc.footnotes.join(" ") +
                "</span>"
              : "";

          serviceLines +=
            '<div style="font-size:11px;' +
            style +
            '">' +
            prefix +
            svc.name +
            fn +
            "</div>";
        });
      }

      ttService.innerHTML = serviceLines;
      ttNotes.textContent =
        ds.globalNotes && ds.globalNotes.trim()
          ? "Notes: " + ds.globalNotes
          : "";

      positionTooltip(mouseX, mouseY);
      ttEl.classList.add("visible");
    }

    function scheduleHide() {
      hideTimer = setTimeout(function () {
        ttEl.classList.remove("visible");
      }, HIDE_DELAY);
    }

    if (ttEl) {
      ttEl.addEventListener("mouseenter", function () {
        clearTimeout(hideTimer);
      });
      ttEl.addEventListener("mouseleave", function () {
        scheduleHide();
      });
    }

    // Service colors (checkbox canonical keys)
    var individualServiceColors = {
      "Not allocated": "#808080",
      "Meteorological aids": "#87CEEB",
      Radionavigation: "#228B22",
      "Maritime radionavigation": "#006400",
      "Aeronautical radionavigation": "#A29BFE",
      Fixed: "#FFD700",
      Mobile: "#8E44AD",
      "Maritime mobile": "#FD79A8",
      "Aeronautical mobile": "#6C5CE7",
      "Land mobile": "#9B59B6",
      "Standard frequency": "#FF8C00",
      "Standard frequency and time signal": "#FF5733",
      Amateur: "#27AE60",
      "Amateur-Satellite": "#1E8449",
      Broadcasting: "#E67E22",
      Radiolocation: "#16A085",
      "Space research": "#C70039",
      "Radio astronomy": "#D35400",
      "Meteorological-Satellite": "#74B9FF",
      "Mobile-Satellite": "#A29BFE",
      "Space operation": "#8E44AD",
      "Maritime mobile-Satellite": "#DDA0DD",
      "Earth exploration-Satellite": "#3498DB",
      "Radionavigation-Satellite": "#2ECC71",
      "Radiodetermination-Satellite": "#9B59B6",
      "Fixed-Satellite": "#3498DB",
      "Aeronautical mobile-Satellite": "#A29BFE",
      "Broadcasting-Satellite": "#E67E22",
      "Inter-Satellite": "#16A085",
      "Standard frequency and time signal-Satellite": "#E74C3C",
    };

    function createStripedPattern(colors, stripeHeight) {
      var c = document.createElement("canvas");
      var ctx = c.getContext("2d");
      c.width = 100;
      c.height = colors.length * stripeHeight;
      colors.forEach(function (color, idx) {
        ctx.fillStyle = color;
        ctx.fillRect(0, idx * stripeHeight, c.width, stripeHeight);
      });
      return ctx.createPattern(c, "repeat");
    }

    function parseServices(raw) {
      if (!raw) return { services: [], globalNotes: "" };
      var tokens = raw
        .split(";")
        .map(function (s) {
          return s.trim();
        })
        .filter(Boolean);
      var services = [];
      var globalNotes = [];

      tokens.forEach(function (token) {
        var brackets = [];
        var cleaned = token
          .replace(/\[([^\]]*)\]/g, function (match, inner) {
            brackets.push("[" + inner + "]");
            return "";
          })
          .trim();

        var name = cleaned.replace(/^[;,\s]+|[;,\s]+$/g, "").trim();
        if (!name) {
          brackets.forEach(function (b) {
            globalNotes.push(b);
          });
          return;
        }

        var lettersOnly = name.replace(/[^a-zA-Z]/g, "");
        var isPrimary =
          lettersOnly.length > 0 && lettersOnly === lettersOnly.toUpperCase();

        services.push({
          name: name,
          isPrimary: isPrimary,
          footnotes: brackets,
        });
      });

      return { services: services, globalNotes: globalNotes.join(" ") };
    }

    var canonicalKeys = Object.keys(individualServiceColors);

    // Fuzzy map from JSON service name -> canonical key (checkbox key)
    function mapToCanonicalService(jsonServiceName) {
      var lc = norm(jsonServiceName);

      // direct exact after normalization
      for (var i = 0; i < canonicalKeys.length; i++) {
        if (lc === norm(canonicalKeys[i])) return canonicalKeys[i];
      }

      // startsWith match
      for (var j = 0; j < canonicalKeys.length; j++) {
        var ck = canonicalKeys[j];
        var nck = norm(ck);
        if (lc.indexOf(nck) === 0) return ck;
      }

      // substring match
      for (var k = 0; k < canonicalKeys.length; k++) {
        var ck2 = canonicalKeys[k];
        var nck2 = norm(ck2);
        if (lc.indexOf(nck2) !== -1) return ck2;
      }

      return null;
    }

    function getColorForService(jsonServiceName) {
      var canonical = mapToCanonicalService(jsonServiceName);
      return canonical ? individualServiceColors[canonical] : "#CCCCCC";
    }

    // Dataset filtering uses canonical mapped services
    function datasetEnabled(ds) {
      var mapped = ds.__servicesMapped || [];
      for (var i = 0; i < mapped.length; i++) {
        var svcKey = mapped[i];
        if (serviceChecked[svcKey]) return true; // at least one service checked => tooltip ok
      }
      return false;
    }

    function setDatasetGrey(chart, ds, disabled) {
      ds.__disabledByServiceFilter = disabled;

      if (disabled) {
        ds.backgroundColor = maritimePreview ? "transparent" : "#BDBDBD";
        ds.borderColor = maritimePreview ? "transparent" : "#9E9E9E";
        ds.borderWidth = maritimePreview ? 0 : 1;
        ds.opacity = 0.25;
      } else {
        ds.backgroundColor = ds.__originalBackgroundColor;
        ds.borderColor = ds.__originalBorderColor;
        ds.borderWidth = ds.__originalBorderWidth;
        ds.opacity = ds.__originalOpacity;
      }
    }

    function updateAllChartsForServiceFilters() {
      chartInstances.forEach(function (chart) {
        chart.data.datasets.forEach(function (ds) {
          var enabled = datasetEnabled(ds);
          setDatasetGrey(chart, ds, !enabled);
        });
        chart.update(0);
      });
    }

    function updateSelectedCount() {
      var count = serviceKeys.reduce(function (acc, k) {
        return acc + (serviceChecked[k] ? 1 : 0);
      }, 0);
      var el = document.getElementById("freqSelectedCount");
      if (el)
        el.textContent =
          count + " / " + serviceKeys.length + " services selected";
    }

    function updateToggleButtonLabel() {
      var allOn =
        serviceKeys.length > 0 &&
        serviceKeys.every(function (k) {
          return serviceChecked[k] === true;
        });
      var btn = document.getElementById("freqToggleAllServices");
      if (btn) btn.textContent = allOn ? "Uncheck All" : "Check All";
    }

    function applyLegendSearch(query) {
      if (!serviceRows || !serviceRows.length) return;

      var q = (query || "").toString().trim().toLowerCase();
      if (!q) {
        serviceRows.forEach(function (r) {
          r.rowEl.style.display = "";
        });
        return;
      }

      serviceRows.forEach(function (r) {
        var label = (r.svc || "").toLowerCase();
        r.rowEl.style.display = label.indexOf(q) !== -1 ? "" : "none";
      });
    }

    function buildLegend() {
      var legendItems = document.getElementById("freqLegendItems");
      if (!legendItems) return;

      serviceKeys = canonicalKeys.slice();
      serviceChecked = {};
      serviceKeys.forEach(function (k) {
        serviceChecked[k] =
          !maritimePreview || maritimeServices.indexOf(k) !== -1;
      });

      var html = "";
      serviceKeys.forEach(function (svc) {
        var safeId = "svc_" + svc.replace(/[^a-zA-Z0-9_-]/g, "_");
        html +=
          "" +
          '<div class="freq-legend-item">' +
          '<input type="checkbox" class="freq-service-checkbox" ' +
          'id="' +
          safeId +
          '" ' +
          'data-service="' +
          svc +
          '" ' +
          (serviceChecked[svc] ? "checked " : "") +
          " >" +
          '<div class="freq-legend-color" style="background-color:' +
          individualServiceColors[svc] +
          '"></div>' +
          '<div class="freq-legend-label">' +
          svc +
          "</div>" +
          "</div>";
      });

      legendItems.innerHTML = html;

      // Cache legend rows for search filtering
      serviceRows = [];
      legendItems
        .querySelectorAll(".freq-legend-item")
        .forEach(function (rowEl) {
          var cb = rowEl.querySelector(".freq-service-checkbox");
          if (!cb) return;
          serviceRows.push({
            svc: cb.getAttribute("data-service") || "",
            rowEl: rowEl,
          });
        });

      // Hook checkbox listeners
      legendItems
        .querySelectorAll(".freq-service-checkbox")
        .forEach(function (cb) {
          cb.addEventListener("change", function () {
            var svc = cb.getAttribute("data-service");
            serviceChecked[svc] = cb.checked;
            updateAllChartsForServiceFilters();
            updateToggleButtonLabel();
            updateSelectedCount();
          });
        });

      // Hook search bar
      searchEl = document.getElementById("freqServiceSearch");
      if (searchEl) {
        if (maritimePreview) searchEl.value = "maritime";
        searchEl.addEventListener("input", function () {
          applyLegendSearch(searchEl.value);
        });
        // initial apply
        applyLegendSearch(searchEl.value);
      }

      updateSelectedCount();
      updateToggleButtonLabel();
    }

    function getChartOptions(minFreq, maxFreq, displayUnit) {
      var divisor =
        displayUnit === "GHz" ? 1000000 : displayUnit === "MHz" ? 1000 : 1;

      return {
        responsive: true,
        maintainAspectRatio: false,
        tooltips: { enabled: false },
        hover: { animationDuration: 0, mode: "nearest", intersect: true },
        scales: {
          xAxes: [
            {
              ticks: {
                min: 0,
                max: maxFreq - minFreq,
                fontFamily: "'Open Sans Bold', sans-serif",
                fontSize: 11,
                callback: function (value) {
                  return Math.round(((value + minFreq) / divisor) * 100) / 100;
                },
              },
              scaleLabel: {
                display: true,
                labelString: "Frequency (" + displayUnit + ")",
              },
              stacked: true,
            },
          ],
          yAxes: [
            {
              gridLines: {
                display: false,
                color: "#fff",
                zeroLineColor: "#fff",
                zeroLineWidth: 0,
              },
              ticks: {
                fontFamily: "'Open Sans Bold', sans-serif",
                fontSize: 11,
              },
              categoryPercentage: 1.0,
              barPercentage: 1.0,
              stacked: true,
            },
          ],
        },
        legend: { display: false },
        plugins: {
          zoom: {
            pan: { enabled: true, mode: "xy", speed: 10, threshold: 10 },
            zoom: {
              enabled: true,
              drag: false,
              mode: "xy",
              speed: 0.1,
              threshold: 2,
              sensitivity: 3,
            },
          },
        },
      };
    }

    function attachTooltipEvents(canvasEl, chart) {
      canvasEl.addEventListener("mousemove", function (e) {
        var elements = chart.getElementAtEvent(e);
        if (elements && elements.length > 0) {
          var dsIndex = elements[0]._datasetIndex;
          var ds = chart.data.datasets[dsIndex];
          if (!ds) {
            scheduleHide();
            return;
          }

          if (ds.__disabledByServiceFilter) {
            scheduleHide();
            return;
          }

          showTooltip(ds, e.clientX, e.clientY);
          return;
        }
        scheduleHide();
      });

      canvasEl.addEventListener("mouseleave", function () {
        scheduleHide();
      });
    }

    function createDatasetsForRange(bands, minFreq, maxFreq) {
      return bands
        .filter(function (b) {
          return b.start < maxFreq && b.end > minFreq;
        })
        .map(function (band) {
          var clippedStart = Math.max(band.start, minFreq);
          var clippedEnd = Math.min(band.end, maxFreq);

          var parsed = parseServices(band.service);

          // Colors use canonical mapping (fuzzy)
          var colors = parsed.services.length
            ? parsed.services.map(function (s) {
                return getColorForService(s.name);
              })
            : ["#CCCCCC"];

          var background =
            colors.length > 1
              ? createStripedPattern(colors, band.stripeHeight)
              : colors[0];

          // Mapped services used for filtering (fuzzy to canonical keys)
          var mappedServices = parsed.services
            .map(function (s) {
              return mapToCanonicalService(s.name);
            })
            .filter(Boolean);

          // If nothing matched, put it in "Not allocated" bucket
          if (mappedServices.length === 0) mappedServices = ["Not allocated"];

          var ds = {
            label: band.frequencyRange,
            data: [clippedEnd - clippedStart],
            backgroundColor: background,
            borderColor: "black",
            borderWidth: 1,
            frequencyRange: band.frequencyRange,
            parsedServices: parsed.services,
            globalNotes: parsed.globalNotes,
            service: band.service,
            bandwidth: band.end - band.start,
            actualStart: band.start,
            actualEnd: band.end,
            servicesFR: band.servicesFR || "",
          };

          // originals (immutable baseline)
          ds.__originalBackgroundColor = ds.backgroundColor;
          ds.__originalBorderColor = ds.borderColor;
          ds.__originalBorderWidth = ds.borderWidth;
          ds.__originalOpacity = ds.opacity === undefined ? 1 : ds.opacity;

          // store mapped services for checkbox filtering + tooltip disable
          ds.__servicesMapped = mappedServices;
          ds.__disabledByServiceFilter = false;

          return ds;
        });
    }

    function normaliseBands(rawArray) {
      return rawArray.map(function (r) {
        return {
          start: Math.round(parseFloat(r["low(kHz)"]) || 0),
          end: Math.round(parseFloat(r["high(kHz)"]) || 0),
          frequencyRange: r["frequencyRange"] || "",
          service: r["services(EN)"] || "",
          servicesFR: r["services(FR)"] || "",
          stripeHeight: parseInt(r["stripeHeight"], 10) || 60,
        };
      });
    }

    function initCharts(allBands) {
      // Resize wrappers
      for (var i = 1; i <= 8; i++) {
        var w = document.getElementById("freqChartWrapper" + i);
        if (w) w.style.height = CHART_HEIGHT + "px";
      }

      buildLegend();

      var toggleBtn = document.getElementById("freqToggleAllServices");
      if (toggleBtn) {
        toggleBtn.addEventListener("click", function () {
          var anyUnchecked = serviceKeys.some(function (k) {
            return !serviceChecked[k];
          });
          var newVal = anyUnchecked ? true : false;

          serviceKeys.forEach(function (k) {
            serviceChecked[k] = newVal;
          });

          var legend = document.getElementById("freqLegendItems");
          if (legend) {
            legend
              .querySelectorAll(".freq-service-checkbox")
              .forEach(function (cb) {
                var svc = cb.getAttribute("data-service");
                cb.checked = serviceChecked[svc];
              });
          }

          updateAllChartsForServiceFilters();
          updateToggleButtonLabel();
          updateSelectedCount();
        });
      }

      // Chart definitions
      var chartDefs = [
        { id: "FreqChart1", min: 0, max: 30, unit: "kHz" },
        { id: "FreqChart2", min: 30, max: 300, unit: "kHz" },
        { id: "FreqChart3", min: 300, max: 3000, unit: "kHz" },
        { id: "FreqChart4", min: 3025, max: 30000, unit: "kHz" },
        { id: "FreqChart5", min: 30005, max: 312000, unit: "MHz" },
        { id: "FreqChart6", min: 312000, max: 3100000, unit: "MHz" },
        { id: "FreqChart7", min: 3100000, max: 30000000, unit: "GHz" },
        { id: "FreqChart8", min: 30000000, max: 300000000, unit: "GHz" },
      ];

      chartDefs.forEach(function (def) {
        var canvas = document.getElementById(def.id);
        if (!canvas) return;

        var chart = new Chart(canvas, {
          type: "horizontalBar",
          data: {
            labels: [""],
            datasets: createDatasetsForRange(allBands, def.min, def.max),
          },
          options: getChartOptions(def.min, def.max, def.unit),
        });

        chartInstances.push(chart);
        attachTooltipEvents(canvas, chart);

        canvas.addEventListener("wheel", function (e) {
          e.preventDefault();
          if (e.deltaY < 0) chart.zoom(1.1);
          else chart.zoom(0.9);
        });
      });

      // ✅ Restore Reset All Views button functionality
      var resetBtn = document.getElementById("freqResetZoom");
      if (resetBtn) {
        resetBtn.addEventListener("click", function () {
          chartInstances.forEach(function (c) {
            if (c && c.resetZoom) c.resetZoom();
          });
        });
      }

      // Apply initial: all checked => should show original
      updateAllChartsForServiceFilters();
      updateToggleButtonLabel();
      updateSelectedCount();
    }

    Promise.resolve(window.ctfaAllocationData)
      .then(function (json) {
        var raw = Array.isArray(json) ? json : (json && json.data) || [];
        if (!raw.length) throw new Error("No band data found in JSON.");
        initCharts(normaliseBands(raw));
      })
      .catch(function (err) {
        console.error(err);
        for (var i = 1; i <= 8; i++) {
          var w = document.getElementById("freqChartWrapper" + i);
          if (w)
            w.innerHTML =
              '<p style="color:red;padding:10px;">Error loading data: ' +
              err.message +
              "</p>";
        }
      });
  }
})();
