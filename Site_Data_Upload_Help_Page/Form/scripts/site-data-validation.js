// site-data-validation.js
import { getInnerNativeField, getFieldValue } from "./site-data-fields.js";

// Custom validator to allow validation min length, max length or value between min and max
function getLengthValidator(min, max) {
  let errorMessage = {};
  if (min && max) {
    if (min !== max) {
      errorMessage["en"] =
        `You must enter between ${min} and ${max} characters`;
      errorMessage["fr"] =
        `Vous devez entrer entre ${min} et ${max} caractères`;
    } else {
      errorMessage["en"] = `You must enter exactly ${min} characters`;
      errorMessage["fr"] = `Vous devez entrer exactement ${min} caractères`;
    }
  } else if (min) {
    errorMessage["en"] = `You must enter at least ${min} characters`;
    errorMessage["fr"] = `Vous devez entrer au moins ${min} caractères`;
  } else if (max) {
    errorMessage["en"] = `You must enter less than ${max} characters`;
    errorMessage["fr"] = `Vous devez entrer moins de ${max} caractères`;
  }
  return {
    validate: (value) => {
      value = value || "";
      if (min && max) return min <= value.length && value.length <= max;
      if (min) return min <= value.length;
      if (max) return value.length <= max;
      return true;
    },
    errorMessage,
  };
}

function getNumberValidator(min, max) {
  let errorMessage = {};
  if (min && max) {
    errorMessage["en"] = `Value must be between ${min} and ${max}`;
    errorMessage["fr"] = `La valeur doit être entre ${min} et ${max}`;
  } else if (min) {
    errorMessage["en"] = `Value must be at least ${min}`;
    errorMessage["fr"] = `La valeur doit être au moins ${min}`;
  } else if (max) {
    errorMessage["en"] = `Value must be at most ${max}`;
    errorMessage["fr"] = `La valeur doit être au plus ${max}`;
  }
  return {
    validate: (value) => {
      if (value == null || value === "") return true;
      const num = parseFloat(value);
      if (isNaN(num)) return false;
      if (min && max) return min <= num && num <= max;
      if (min) return min <= num;
      if (max) return num <= max;
      return true;
    },
    errorMessage,
  };
}

function applyValidationAttributes(el) {
  const native = getInnerNativeField(el);
  if (native) {
    const copyAttrs = [
      "min",
      "max",
      "minlength",
      "pattern",
      "type",
      "inputmode",
      "required",
      "step",
      "size",
    ];
    copyAttrs.forEach((attr) => {
      if (el.hasAttribute(attr)) {
        native.setAttribute(attr, el.getAttribute(attr));
      } else {
        native.removeAttribute(attr);
      }
    });
  }
  if (el.tagName.toLowerCase() === "gcds-input") {
    const validators = [];
    const minlength = el.getAttribute("minlength");
    const maxlength = el.getAttribute("maxlength");
    const min = el.getAttribute("min");
    const max = el.getAttribute("max");
    const type = el.getAttribute("type");
    if (type === "number" && (min || max)) {
      validators.push(
        getNumberValidator(
          min ? parseFloat(min) : null,
          max ? parseFloat(max) : null,
        ),
      );
    }

    if ((type === "text" || !type) && (minlength || maxlength)) {
      validators.push(
        getLengthValidator(
          minlength ? parseInt(minlength, 10) : null,
          maxlength ? parseInt(maxlength, 10) : null,
        ),
      );
    }

    if ((type === "number" || !type) && (minlength || maxlength)) {
      validators.push(
        getLengthValidator(
          minlength ? parseInt(minlength, 10) : null,
          maxlength ? parseInt(maxlength, 10) : null,
        ),
      );
    }
    if (validators.length > 0) el.validator = validators;
  }
}

function applyValidationToAllFields() {
  const fieldSelectors = [
    "gcds-input",
    "gcds-select",
    "gcds-date-input",
    "gcds-radios",
  ];
  document.querySelectorAll(fieldSelectors.join(",")).forEach((el) => {
    applyValidationAttributes(el);
  });
}

function validateCurrentPage() {
  const fieldSelectors = [
    "gcds-input",
    "gcds-select",
    "gcds-date-input",
    "gcds-radios",
  ];
  let isValid = true;
  document.querySelectorAll(fieldSelectors.join(",")).forEach((el) => {
    if (!el.hasAttribute("required")) return;
    const value = getFieldValue(el);
    if (!value.trim()) {
      isValid = false;
      el.setAttribute("error-state", "error");
      el.setAttribute("error-message", "Enter information to continue.");
    } else {
      el.removeAttribute("error-state");
      el.removeAttribute("error-message");
    }
  });
  return isValid;
}

export {
  getLengthValidator,
  getNumberValidator,
  applyValidationAttributes,
  applyValidationToAllFields,
  validateCurrentPage,
};
