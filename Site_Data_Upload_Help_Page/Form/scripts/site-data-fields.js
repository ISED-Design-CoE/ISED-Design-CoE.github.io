// site-data-fields.js
function getFieldValue(el) {
  if (!el) return "";
  const tag = el.tagName.toLowerCase();
  const type = el.getAttribute("type");
  if (tag === "gcds-radios") {
    if (typeof el.value !== "undefined" && el.value !== null) {
      return el.value;
    }
    const checked =
      el.querySelector('input[type="radio"]:checked') ||
      el.shadowRoot?.querySelector('input[type="radio"]:checked');
    return checked ? checked.value : "";
  }
  if (tag === "input" && type === "radio") {
    return el.checked ? el.value : "";
  }
  if (typeof el.value !== "undefined" && el.value !== null) {
    return el.value;
  }
  return el.getAttribute("value") || "";
}

function getInnerNativeField(el) {
  if (!el) return null;
  if (
    el instanceof HTMLInputElement ||
    el instanceof HTMLTextAreaElement ||
    el instanceof HTMLSelectElement
  )
    return el;
  return (
    el.querySelector("input,textarea,select") ||
    el.shadowRoot?.querySelector("input,textarea,select") ||
    null
  );
}

function getElementKeys(el) {
  if (!el) return [];
  const tag = el.tagName.toLowerCase();
  const keys = [el.id, el.name];
  if (tag === "gcds-input" || tag === "gcds-date-input")
    keys.push(el.getAttribute("input-id"));
  if (tag === "gcds-select") keys.push(el.getAttribute("select-id"));
  if (tag === "gcds-radios") keys.push(el.getAttribute("name"));
  return keys.filter((k) => k);
}

function setFieldValue(el, value) {
  if (!el) return;
  const tag = el.tagName.toLowerCase();
  if (tag === "gcds-radios") {
    const radio = el.querySelector(`input[type="radio"][value="${value}"]`);
    if (radio) radio.checked = true;
    return;
  }
  if (tag === "input" || tag === "select" || tag === "textarea") {
    el.value = value;
    return;
  }
  if (typeof el.value !== "undefined") {
    el.value = value;
    return;
  }
  el.setAttribute("value", value);
}

function normalizeCollectedValue(el, value) {
  if (value == null || value === "") return value;
  const native = getInnerNativeField(el);
  const min = parseFloat(el.getAttribute("min") || native?.getAttribute("min"));
  const max = parseFloat(el.getAttribute("max") || native?.getAttribute("max"));
  const numericValue = parseFloat(value);
  if (!Number.isNaN(numericValue) && !Number.isNaN(min) && numericValue < min)
    return String(min);
  if (!Number.isNaN(numericValue) && !Number.isNaN(max) && numericValue > max)
    return String(max);
  return value;
}

function collectPageData() {
  const fieldSelectors = [
    "gcds-input",
    "gcds-select",
    "gcds-date-input",
    "gcds-radios",
    "input",
    "select",
    "textarea",
  ];
  const values = {};
  document.querySelectorAll(fieldSelectors.join(",")).forEach((el) => {
    const tagName = el.tagName.toLowerCase();
    let key = null;
    if (tagName === "gcds-input" || tagName === "gcds-date-input") {
      key = el.getAttribute("input-id") || el.id || el.name;
    } else if (tagName === "gcds-select") {
      key = el.getAttribute("select-id") || el.id || el.name;
    } else if (tagName === "gcds-radios") {
      key = el.getAttribute("name") || el.id;
    } else {
      key = el.id || el.name;
    }
    if (!key) return;
    const value = getFieldValue(el);
    const normalizedValue = normalizeCollectedValue(el, value);
    // For native radio groups, prefer the checked value only for group key.
    if (tagName === "input" && el.type === "radio" && !el.checked) return;
    values[key] = normalizedValue;
  });
  return values;
}

export {
  getFieldValue,
  setFieldValue,
  getInnerNativeField,
  getElementKeys,
  normalizeCollectedValue,
  collectPageData,
};
