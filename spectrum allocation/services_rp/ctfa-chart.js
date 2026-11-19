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
    var CHART_HEIGHT = 175;
    var maritimePreview =
      new URLSearchParams(location.search).get("preview") === "true";
    var maritimeFilter =
      maritimePreview ||
      new URLSearchParams(location.search).get("service") === "maritime";
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

    function createStripedPattern(chart, colors) {
      var area = chart.chartArea;
      var c = document.createElement("canvas");
      var ctx = c.getContext("2d");
      c.width = 1;
      c.height = Math.ceil(area.bottom);
      colors.forEach(function (color, idx) {
        var top = Math.round(
          area.top + ((area.bottom - area.top) * idx) / colors.length,
        );
        var bottom = Math.round(
          area.top + ((area.bottom - area.top) * (idx + 1)) / colors.length,
        );
        ctx.fillStyle = color;
        ctx.fillRect(0, top, c.width, bottom - top);
      });
      return chart.ctx.createPattern(c, "repeat-x");
    }

    var stripePlugin = {
      afterLayout: function (chart) {
        chart.data.datasets.forEach(function (ds) {
          if (!ds.__stripeColors) return;
          var pattern = createStripedPattern(chart, ds.__stripeColors);
          ds.__originalBackgroundColor = pattern;
          if (!ds.__disabledByServiceFilter) ds.backgroundColor = pattern;
        });
      },
    };

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
          !maritimeFilter || maritimeServices.indexOf(k) !== -1;
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
        if (maritimeFilter) searchEl.value = "maritime";
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

          var background = colors[0];

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
          if (colors.length > 1) ds.__stripeColors = colors;

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
        };
      });
    }

    function buildPrintPoster(chartDefs) {
      function element(name, attributes, text) {
        var node = document.createElementNS("http://www.w3.org/2000/svg", name);
        Object.keys(attributes || {}).forEach(function (key) {
          node.setAttribute(key, attributes[key]);
        });
        if (text !== undefined) node.textContent = text;
        return node;
      }

      var svg = element("svg", {
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 1600 1100",
        role: "img",
        "aria-labelledby": "freqPrintTitle",
        "font-family": "Arial, sans-serif",
      });
      svg.appendChild(
        element(
          "title",
          { id: "freqPrintTitle" },
          "Canadian table of frequency allocations",
        ),
      );
      svg.appendChild(
        element("rect", { width: 1600, height: 1100, fill: "#fff" }),
      );
      var measure = document.createElement("canvas").getContext("2d");
      var plotLeft = 14;
      var plotWidth = 1380;
      var barHeight = 76;
      var legendLeft = 1420;

      function textColor(hex) {
        var rgb = parseInt(hex.slice(1), 16);
        var brightness =
          0.299 * ((rgb >> 16) & 255) +
          0.587 * ((rgb >> 8) & 255) +
          0.114 * (rgb & 255);
        return brightness > 150 ? "#000" : "#fff";
      }

      function addServiceLabel(group, text, x, y, width, height, fill, primary) {
        var rotated = width < Math.min(42, height);
        var availableWidth = (rotated ? height : width) - 2;
        var availableHeight = (rotated ? width : height) - 2;
        if (availableWidth <= 0 || availableHeight <= 0) return;

        measure.font = "10px Arial";
        var lines = [""];
        text.split(/\s+/).forEach(function (word) {
          var last = lines.length - 1;
          var candidate = lines[last] ? lines[last] + " " + word : word;
          if (lines[last] && measure.measureText(candidate).width > availableWidth)
            lines.push(word);
          else lines[last] = candidate;
        });
        var maxWidth = Math.max.apply(
          null,
          lines.map(function (line) {
            return measure.measureText(line).width;
          }),
        );
        var fontSize =
          10 *
          Math.min(
            1,
            availableWidth / Math.max(1, maxWidth),
            availableHeight / (lines.length * 12),
          );
        var label = element("text", {
          transform:
            "translate(" +
            (x + width / 2) +
            " " +
            (y + height / 2) +
            ")" +
            (rotated ? " rotate(-90)" : ""),
          fill: fill,
          "font-size": fontSize,
          "font-style": primary ? "normal" : "italic",
          "text-anchor": "middle",
        });
        lines.forEach(function (line, i) {
          label.appendChild(
            element(
              "tspan",
              {
                x: 0,
                y:
                  (i - (lines.length - 1) / 2) * fontSize * 1.2 +
                  fontSize * 0.35,
              },
              line,
            ),
          );
        });
        group.appendChild(label);
      }

      chartDefs.forEach(function (def, index) {
        var chart = chartInstances[index];
        var y = 55 + index * 128;
        var divisor = def.unit === "GHz" ? 1000000 : def.unit === "MHz" ? 1000 : 1;
        function frequency(value) {
          return Number((value / divisor).toPrecision(8)).toString();
        }
        function position(value) {
          return plotLeft + ((value - def.min) / (def.max - def.min)) * plotWidth;
        }
        var heading = chart.canvas
          .closest(".freq-chart-container")
          .querySelector(".freq-chart-title")
          .textContent.trim();
        svg.appendChild(
          element(
            "text",
            { x: plotLeft, y: y - 36, "font-size": 9, "font-weight": "bold" },
            heading,
          ),
        );
        var edges = new Set([def.min, def.max]);

        chart.data.datasets.forEach(function (ds) {
          var start = Math.max(def.min, ds.actualStart);
          var end = Math.min(def.max, ds.actualEnd);
          if (end <= start) return;
          edges.add(start);
          edges.add(end);
          var x = position(start);
          var width = position(end) - x;
          var services = ds.parsedServices.length
            ? ds.parsedServices
            : [{ name: "Not allocated", isPrimary: false }];
          var stripeHeight = barHeight / services.length;
          var group = element("g");
          group.appendChild(
            element("title", {}, ds.frequencyRange + ": " + ds.service),
          );
          services.forEach(function (svc, i) {
            var fill = ds.__disabledByServiceFilter
              ? "#BDBDBD"
              : getColorForService(svc.name);
            var stripeY = y + i * stripeHeight;
            group.appendChild(
              element("rect", {
                x: x,
                y: stripeY,
                width: width,
                height: stripeHeight,
                fill: fill,
              }),
            );
            addServiceLabel(
              group,
              svc.name,
              x,
              stripeY,
              width,
              stripeHeight,
              textColor(fill),
              svc.isPrimary,
            );
          });
          group.appendChild(
            element("rect", {
              x: x,
              y: y,
              width: width,
              height: barHeight,
              fill: "none",
              stroke: "#000",
              "stroke-width": 0.6,
            }),
          );
          svg.appendChild(group);
        });

        Array.from(edges)
          .sort(function (a, b) {
            return a - b;
          })
          .forEach(function (edge) {
            svg.appendChild(
              element(
                "text",
                {
                  transform:
                    "translate(" + position(edge) + " " + (y - 3) + ") rotate(-90)",
                  "font-size": 5,
                },
                frequency(edge),
              ),
            );
          });
        svg.appendChild(
          element(
            "text",
            {
              x: plotLeft + plotWidth / 2,
              y: y + barHeight + 13,
              "text-anchor": "middle",
              "font-size": 7,
            },
            "Frequency (" + def.unit + ")",
          ),
        );
      });

      svg.appendChild(
        element(
          "text",
          { x: legendLeft, y: 38, "font-size": 32, "font-weight": "bold" },
          "Canada",
        ),
      );
      svg.appendChild(
        element(
          "text",
          { x: legendLeft, y: 64, "font-size": 13, "font-weight": "bold" },
          "Frequency allocations",
        ),
      );
      svg.appendChild(
        element("line", {
          x1: legendLeft,
          y1: 74,
          x2: 1586,
          y2: 74,
          stroke: "#a62a1e",
          "stroke-width": 2,
        }),
      );
      svg.appendChild(
        element(
          "text",
          { x: legendLeft, y: 95, "font-size": 11, "font-weight": "bold" },
          "Legend",
        ),
      );
      serviceKeys.forEach(function (service, i) {
        var y = 106 + i * 15;
        svg.appendChild(
          element("rect", {
            x: legendLeft,
            y: y,
            width: 9,
            height: 9,
            fill: serviceChecked[service]
              ? individualServiceColors[service]
              : "#BDBDBD",
            stroke: "#555",
            "stroke-width": 0.3,
          }),
        );
        svg.appendChild(
          element(
            "text",
            { x: legendLeft + 13, y: y + 7, "font-size": 6.5 },
            service,
          ),
        );
      });
      return svg;
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
          plugins: [stripePlugin],
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

      var printBtn = document.getElementById("freqPrint");
      var printArea = document.getElementById("freqPrintArea");
      if (printBtn && printArea) {
        printBtn.disabled = false;
        printBtn.addEventListener("click", function () {
          printArea.textContent = "";
          printArea.appendChild(buildPrintPoster(chartDefs));
          document.body.classList.add("freq-printing");
          try {
            window.print();
          } finally {
            document.body.classList.remove("freq-printing");
          }
        });
        window.addEventListener("afterprint", function () {
          document.body.classList.remove("freq-printing");
        });
      }
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
