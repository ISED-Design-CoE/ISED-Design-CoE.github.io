// site-data-validation.js
import {
  getInnerNativeField,
  getFieldValue,
  getElementKeys,
  collectPageData,
} from "./site-data-fields.js";
import { ensureState, PAGE_KEY } from "./site-data-storage.js";

const MOBILE_TECH_VALUES = new Set(["1", "2", "3", "4", "5", "6"]);
const LTE_5G_TECH_VALUES = new Set(["4", "5", "6"]);
const RADIO_TECH_VALUES = new Set([
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
]);
const PROVINCE_TERRITORY_VALUES = new Set([
  "Alberta",
  "British Columbia",
  "Manitoba",
  "New Brunswick",
  "Newfoundland and Labrador",
  "Nova Scotia",
  "Ontario",
  "Prince Edward Island",
  "Quebec",
  "Saskatchewan",
  "Northwest Territories",
  "Nunavut",
  "Yukon",
  "Interprovincial",
  "Canada-wide",
]);
const SITE_TYPE_VALUES = new Set(["1", "2", "3"]);
const STRUCTURE_TYPE_VALUES = new Set(["1", "2", "3", "4", "5", "6", "7"]);
const DIRECTIONAL_PATTERN_VALUES = new Set(["1", "2"]);
const ANTENNA_TYPE_VALUES = new Set(["1", "2", "3"]);

function addFieldError(fieldErrors, fieldKey, message) {
  if (!fieldKey) return;
  if (!(fieldKey in fieldErrors)) {
    fieldErrors[fieldKey] = message;
  }
}

function getEntryValue(entry, fieldKey) {
  return String(entry?.[fieldKey] ?? "").trim();
}

function requireEntryField(fieldErrors, entry, fieldKey, message) {
  const value = getEntryValue(entry, fieldKey);
  if (!value) addFieldError(fieldErrors, fieldKey, message);
  return value;
}

function validateEntryNumber(fieldErrors, entry, fieldKey, options) {
  const value = getEntryValue(entry, fieldKey);
  if (!value) {
    if (options.requiredMessage)
      addFieldError(fieldErrors, fieldKey, options.requiredMessage);
    return null;
  }

  const num = parseNumber(value);
  if (num == null) {
    addFieldError(
      fieldErrors,
      fieldKey,
      options.invalidMessage || "Enter a valid number.",
    );
    return null;
  }

  if (options.integer && !Number.isInteger(num)) {
    addFieldError(
      fieldErrors,
      fieldKey,
      options.invalidMessage || "Enter a whole number.",
    );
    return null;
  }

  if (options.min != null && num < options.min) {
    addFieldError(fieldErrors, fieldKey, options.invalidMessage);
    return num;
  }

  if (options.max != null && num > options.max) {
    addFieldError(fieldErrors, fieldKey, options.invalidMessage);
  }

  return num;
}

function isPastDate(value) {
  const selectedDate = parseIsoLikeDate(value);
  if (!selectedDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return selectedDate < today;
}

function validateEntryPage1(entry, fieldErrors) {
  const licenceNumber = requireEntryField(
    fieldErrors,
    entry,
    "licence-number",
    "Enter a spectrum licence number.",
  );
  if (licenceNumber) {
    if (!/^\d{1,9}$/.test(licenceNumber)) {
      addFieldError(
        fieldErrors,
        "licence-number",
        "Enter a spectrum licence number from 1 to 999999999.",
      );
    } else {
      const licenceNum = Number.parseInt(licenceNumber, 10);
      if (!(licenceNum >= 1 && licenceNum <= 999999999)) {
        addFieldError(
          fieldErrors,
          "licence-number",
          "Enter a spectrum licence number from 1 to 999999999.",
        );
      }
    }
  }

  const referenceNumber = getEntryValue(entry, "reference-number");
  if (referenceNumber.length > 63) {
    addFieldError(
      fieldErrors,
      "reference-number",
      "Enter no more than 63 characters.",
    );
  }

  const contactName = requireEntryField(
    fieldErrors,
    entry,
    "contact-name",
    "Enter a contact name.",
  );
  if (contactName.length > 254) {
    addFieldError(
      fieldErrors,
      "contact-name",
      "Enter no more than 254 characters.",
    );
  }

  const businessNumber = requireEntryField(
    fieldErrors,
    entry,
    "business-number",
    "Enter a business telephone number.",
  );
  if (
    businessNumber &&
    (businessNumber.length < 10 || businessNumber.length > 254)
  ) {
    addFieldError(
      fieldErrors,
      "business-number",
      "Enter a business telephone number between 10 and 254 characters.",
    );
  }

  const emailAddress = requireEntryField(
    fieldErrors,
    entry,
    "email-address",
    "Enter an email address.",
  );
  if (emailAddress) {
    if (emailAddress.length > 254) {
      addFieldError(
        fieldErrors,
        "email-address",
        "Enter no more than 254 characters.",
      );
    } else if (!isValidEmailList(emailAddress)) {
      addFieldError(
        fieldErrors,
        "email-address",
        "Enter a valid email address, or multiple valid email addresses separated by commas.",
      );
    }
  }

  requireEntryField(
    fieldErrors,
    entry,
    "site-info-change",
    "Select a site information change option.",
  );
  requireEntryField(
    fieldErrors,
    entry,
    "licence-type",
    "Select a licence type.",
  );
}

function validateEntryPage2(entry, fieldErrors) {
  const siteInfoChange = getEntryValue(entry, "site-info-change");
  if (siteInfoChange && siteInfoChange !== "radio1") return;

  const licenceType = getEntryValue(entry, "licence-type");
  const isSatellite = licenceType === "radio2";

  const stationLocation = requireEntryField(
    fieldErrors,
    entry,
    "station-location",
    "Enter a station location.",
  );
  if (stationLocation.length > 63) {
    addFieldError(
      fieldErrors,
      "station-location",
      "Enter no more than 63 characters.",
    );
  }

  const radioTechnology = getEntryValue(entry, "radio-technology");
  if (!isSatellite) {
    if (!radioTechnology) {
      addFieldError(
        fieldErrors,
        "radio-technology",
        "Select a radio technology.",
      );
    } else if (!RADIO_TECH_VALUES.has(radioTechnology)) {
      addFieldError(
        fieldErrors,
        "radio-technology",
        "Select a valid Radio technology.",
      );
    }
  }

  if (!isSatellite && MOBILE_TECH_VALUES.has(radioTechnology)) {
    const cellId = requireEntryField(
      fieldErrors,
      entry,
      "cell-id",
      "Enter a Cell ID.",
    );
    if (cellId) {
      const compactCellId = cellId.replace(/-/g, "");
      const hasValidLength =
        compactCellId.length >= 11 && compactCellId.length <= 27;
      const hasValidPattern =
        /^[A-Za-z0-9]{1,6}-[A-Za-z0-9]{1,8}-[A-Za-z0-9]{1,11}$/.test(cellId);
      if (!hasValidLength || !hasValidPattern) {
        addFieldError(
          fieldErrors,
          "cell-id",
          "Enter a Cell ID in alphanumeric format AAA111-BBBBB222-CCCCCC33333 with 11 to 27 characters (excluding hyphens).",
        );
      }
    }
  }

  if (LTE_5G_TECH_VALUES.has(radioTechnology)) {
    const physicalCellId = requireEntryField(
      fieldErrors,
      entry,
      "physical-cell-id",
      "Enter a Physical Cell ID.",
    );
    if (physicalCellId) {
      const physicalValue = parseNumber(physicalCellId);
      const maxValue = radioTechnology === "4" ? 503 : 1007;
      if (
        physicalValue == null ||
        !Number.isInteger(physicalValue) ||
        physicalValue < 0 ||
        physicalValue > maxValue
      ) {
        addFieldError(
          fieldErrors,
          "physical-cell-id",
          `Enter a Physical Cell ID between 0 and ${maxValue}.`,
        );
      }
    }
  }

  const provinceTerritory = requireEntryField(
    fieldErrors,
    entry,
    "province-territory",
    "Select a province or territory.",
  );
  if (provinceTerritory && !PROVINCE_TERRITORY_VALUES.has(provinceTerritory)) {
    addFieldError(
      fieldErrors,
      "province-territory",
      "Select a valid province or territory.",
    );
  }

  validateEntryNumber(fieldErrors, entry, "latitude", {
    requiredMessage: "Enter a latitude.",
    invalidMessage: "Latitude must be between 41 and 90.",
    min: 41,
    max: 90,
  });
  validateEntryNumber(fieldErrors, entry, "longitude", {
    requiredMessage: "Enter a longitude.",
    invalidMessage: "Longitude must be between -141 and -40.",
    min: -141,
    max: -40,
  });

  const siteType = getEntryValue(entry, "site-type");
  if (!isSatellite) {
    if (!siteType) {
      addFieldError(fieldErrors, "site-type", "Select a Site Type Code.");
    } else if (!SITE_TYPE_VALUES.has(siteType)) {
      addFieldError(fieldErrors, "site-type", "Select a valid Site Type Code.");
    }
  }

  if (siteType === "2") {
    validateEntryNumber(fieldErrors, entry, "structure-height", {
      requiredMessage: "Enter a Structure Height.",
      invalidMessage: "Enter a Structure Height between 1 and 600 metres.",
      min: 1,
      max: 600,
    });
  }

  const structureType = requireEntryField(
    fieldErrors,
    entry,
    "structure-type",
    "Select a Structure Type Code.",
  );
  if (structureType && !STRUCTURE_TYPE_VALUES.has(structureType)) {
    addFieldError(
      fieldErrors,
      "structure-type",
      "Select a valid Structure Type Code.",
    );
  }

  const dateOfModification = requireEntryField(
    fieldErrors,
    entry,
    "date-of-modification",
    "Enter a Date of last modification.",
  );
  if (dateOfModification && !isPastDate(dateOfModification)) {
    addFieldError(
      fieldErrors,
      "date-of-modification",
      "Enter a date in the past for Date of last modification.",
    );
  }

  requireEntryField(
    fieldErrors,
    entry,
    "site-record-id",
    "Enter a Site record ID.",
  );
}

function validateEntryAntennaSide(
  fieldErrors,
  entry,
  side,
  siteType,
  structureHeight,
) {
  const antennaType = getEntryValue(entry, "antenna-type");
  const sideSelected =
    side === "tx"
      ? isTxSideSelected(antennaType)
      : isRxSideSelected(antennaType);
  if (!sideSelected) return;

  const sideLabel = side === "tx" ? "Tx" : "Rx";
  const frequencyKey = `${side}-channel-frequency`;
  const frequency = validateEntryNumber(fieldErrors, entry, frequencyKey, {
    requiredMessage: `Enter a ${sideLabel} channel frequency.`,
    invalidMessage: `Enter a valid ${sideLabel} channel frequency.`,
  });
  if (frequency == null || frequency <= 0) return;

  requireEntryField(
    fieldErrors,
    entry,
    `${side}-radio-model`,
    `Enter a ${sideLabel} radio model number.`,
  );

  if (getEntryValue(entry, "licence-type") !== "radio2") {
    requireEntryField(
      fieldErrors,
      entry,
      `${side}-radio-code`,
      `Enter a ${sideLabel} radio manufacturer code.`,
    );
    requireEntryField(
      fieldErrors,
      entry,
      `${side}-radio-certificate`,
      `Enter a ${sideLabel} radio certification number.`,
    );

    const typeCode = requireEntryField(
      fieldErrors,
      entry,
      `${side}-type-code`,
      `Select a ${sideLabel} antenna type code.`,
    );
    if (typeCode && !ANTENNA_TYPE_VALUES.has(typeCode)) {
      addFieldError(
        fieldErrors,
        `${side}-type-code`,
        `Select a valid ${sideLabel} antenna type code.`,
      );
    }

    requireEntryField(
      fieldErrors,
      entry,
      `${side}-antenna-manufacturer`,
      `Enter a ${sideLabel} antenna manufacturer.`,
    );
  }

  validateEntryNumber(fieldErrors, entry, `${side}-number-antennas`, {
    requiredMessage: `Enter the total number of ${sideLabel} antennas.`,
    invalidMessage: `Enter a whole number from 1 to 256 for ${sideLabel} antennas.`,
    min: 1,
    max: 256,
    integer: true,
  });
  requireEntryField(
    fieldErrors,
    entry,
    `${side}-antenna-model`,
    `Enter a ${sideLabel} antenna model number.`,
  );

  const antennaHeight = validateEntryNumber(
    fieldErrors,
    entry,
    `${side}-antenna-height`,
    {
      requiredMessage: `Enter a ${sideLabel} antenna height.`,
      invalidMessage: `Enter a valid ${sideLabel} antenna height for the selected Site Type Code.`,
    },
  );
  if (antennaHeight != null) {
    if (siteType === "1") {
      if (antennaHeight < -100 || antennaHeight > 0) {
        addFieldError(
          fieldErrors,
          `${side}-antenna-height`,
          `${sideLabel} antenna height must be between -100 and 0 metres for underground sites.`,
        );
      }
    } else if (siteType === "2" || siteType === "3") {
      if (antennaHeight < 0 || antennaHeight > 600) {
        addFieldError(
          fieldErrors,
          `${side}-antenna-height`,
          `${sideLabel} antenna height must be between 0 and 600 metres.`,
        );
      }
      if (structureHeight != null && antennaHeight > structureHeight + 5) {
        addFieldError(
          fieldErrors,
          `${side}-antenna-height`,
          `${sideLabel} antenna height must be no more than 5 metres above Structure Height.`,
        );
      }
    }
  }

  const pattern = requireEntryField(
    fieldErrors,
    entry,
    `${side}-omnidirectional-pattern`,
    `Select a ${sideLabel} antenna omnidirectional pattern indicator.`,
  );
  if (pattern && !DIRECTIONAL_PATTERN_VALUES.has(pattern)) {
    addFieldError(
      fieldErrors,
      `${side}-omnidirectional-pattern`,
      `Select a valid ${sideLabel} antenna omnidirectional pattern indicator.`,
    );
  }

  if (isDirectionalPattern(pattern)) {
    validateEntryNumber(
      fieldErrors,
      entry,
      `${side}-antenna-horizontal-beamwidth`,
      {
        requiredMessage: `Enter a ${sideLabel} antenna horizontal beamwidth.`,
        invalidMessage: `${sideLabel} antenna horizontal beamwidth must be between 1 and 359.9 degrees.`,
        min: 1,
        max: 359.9,
      },
    );
    validateEntryNumber(
      fieldErrors,
      entry,
      `${side}-antenna-vertical-beamwidth`,
      {
        requiredMessage: `Enter a ${sideLabel} antenna vertical beamwidth.`,
        invalidMessage: `${sideLabel} antenna vertical beamwidth must be between 1 and 359.9 degrees.`,
        min: 1,
        max: 359.9,
      },
    );
    validateEntryNumber(fieldErrors, entry, `${side}-antenna-azimuth`, {
      requiredMessage: `Enter a ${sideLabel} antenna azimuth.`,
      invalidMessage: `${sideLabel} antenna azimuth must be between 0 and 359.9 degrees.`,
      min: 0,
      max: 359.9,
    });
    validateEntryNumber(fieldErrors, entry, `${side}-antenna-elevation-angle`, {
      requiredMessage: `Enter a ${sideLabel} antenna elevation angle.`,
      invalidMessage: `${sideLabel} antenna elevation angle must be between -90 and 90 degrees.`,
      min: -90,
      max: 90,
    });
  }

  validateEntryNumber(fieldErrors, entry, `${side}-antenna-gain`, {
    requiredMessage: `Enter a ${sideLabel} antenna gain.`,
    invalidMessage: `${sideLabel} antenna gain must be between 0 and 70 dBi.`,
    min: 0,
    max: 70,
  });
  validateEntryNumber(fieldErrors, entry, `${side}-antenna-line-loss`, {
    requiredMessage: `Enter a ${sideLabel} line loss.`,
    invalidMessage: `${sideLabel} line loss must be between 0 and 30 dB.`,
    min: 0,
    max: 30,
  });
}

function validateEntryPage3(entry, fieldErrors) {
  const siteInfoChange = getEntryValue(entry, "site-info-change");
  if (siteInfoChange && siteInfoChange !== "radio1") return;

  validateEntryNumber(fieldErrors, entry, "bandwidth", {
    requiredMessage: "Enter a Bandwidth.",
    invalidMessage: "Bandwidth must be between 0.10 and 50000.00.",
    min: 0.1,
    max: 50000,
  });

  const classOfEmissions = requireEntryField(
    fieldErrors,
    entry,
    "class-of-emissions",
    "Enter a Class of emissions.",
  );
  if (classOfEmissions && !/^[0-9A-Za-z]{3,5}$/.test(classOfEmissions)) {
    addFieldError(
      fieldErrors,
      "class-of-emissions",
      "Enter a Class of emissions code using 3 to 5 letters or numbers.",
    );
  }

  validateEntryNumber(fieldErrors, entry, "downlink", {
    requiredMessage: "Enter a Downlink resource allocation.",
    invalidMessage: "Downlink resource allocation must be between 0 and 100.",
    min: 0,
    max: 100,
  });

  const antennaType = requireEntryField(
    fieldErrors,
    entry,
    "antenna-type",
    "Select an antenna type.",
  );
  if (antennaType && !["radio1", "radio2", "radio3"].includes(antennaType)) {
    addFieldError(fieldErrors, "antenna-type", "Select a valid antenna type.");
  }

  const txFrequency = parseNumber(getEntryValue(entry, "tx-channel-frequency"));
  if (txFrequency != null && txFrequency > 0) {
    requireEntryField(
      fieldErrors,
      entry,
      "tcp",
      "Enter a Transmitter TCP-TRP value.",
    );
  }

  const siteType = getEntryValue(entry, "site-type");
  const structureHeight = parseNumber(getEntryValue(entry, "structure-height"));
  validateEntryAntennaSide(fieldErrors, entry, "tx", siteType, structureHeight);
  validateEntryAntennaSide(fieldErrors, entry, "rx", siteType, structureHeight);
}

function validateEntryData(entry, pages = [1, 2, 3]) {
  const fieldErrors = {};
  if (pages.includes(1)) validateEntryPage1(entry, fieldErrors);
  if (pages.includes(2)) validateEntryPage2(entry, fieldErrors);
  if (pages.includes(3)) validateEntryPage3(entry, fieldErrors);
  return fieldErrors;
}

function getCsvImportRowLabel(entry, index) {
  const licenceNumber = getEntryValue(entry, "licence-number") || "blank";
  const referenceNumber = getEntryValue(entry, "reference-number") || "blank";
  const stationlocation = getEntryValue(entry, "station-location") || "blank";

  return `licence number = ${licenceNumber}, reference number = ${referenceNumber}, station location = ${stationlocation}`;
}

function validateEntriesForCsv(entries) {
  if (!entries.length) {
    return {
      success: false,
      message: "No data found to export.",
      errors: [],
    };
  }

  const errors = [];
  entries.forEach((entry, index) => {
    const fieldErrors = validateEntryData(entry, [1, 2, 3]);
    Object.values(fieldErrors).forEach((message) => {
      errors.push(`${getCsvImportRowLabel(entry, index)}: ${message}`);
    });
  });

  if (errors.length) {
    return {
      success: false,
      message: errors.slice(0, 8).join("\n"),
      errors,
    };
  }

  return {
    success: true,
    errors: [],
  };
}

function clearFieldError(el) {
  if (!el) return;
  el.removeAttribute("error-state");
  el.removeAttribute("error-message");
}

function setFieldError(el, message) {
  if (!el) return;
  el.setAttribute("error-state", "error");
  el.setAttribute("error-message", message);
}

function addError(errors, el, message) {
  if (!el) return;
  if (isHiddenField(el)) return;
  if (!errors.has(el)) errors.set(el, message);
}

function getFieldByInputId(inputId) {
  return document.querySelector(`gcds-input[input-id="${inputId}"]`);
}

function getDateFieldByInputId(inputId) {
  return document.querySelector(`gcds-date-input[input-id="${inputId}"]`);
}

function getFieldBySelectId(selectId) {
  return document.querySelector(`gcds-select[select-id="${selectId}"]`);
}

function getFieldByRadioName(name) {
  return document.querySelector(`gcds-radios[name="${name}"]`);
}

function getTrimmedValue(el) {
  return String(getFieldValue(el) ?? "").trim();
}

function getFieldValueByInputId(inputId) {
  return getTrimmedValue(getFieldByInputId(inputId));
}

function getFieldValueBySelectId(selectId) {
  return getTrimmedValue(getFieldBySelectId(selectId));
}

function getFieldValueByRadioName(name) {
  return getTrimmedValue(getFieldByRadioName(name));
}

function parseNumber(value) {
  if (value == null || value === "") return null;
  const parsed = Number.parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : null;
}

function parseIsoLikeDate(value) {
  if (!value || typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

function getLicenceTypeFromState() {
  const pageValue = getFieldValueByRadioName("licence-type");
  if (pageValue) return pageValue;

  try {
    const raw = localStorage.getItem("site-data-upload-all") || "{}";
    const state = JSON.parse(raw) || {};
    const currentPage1 = state.current?.page1 || {};

    if (currentPage1["licence-type"]) return currentPage1["licence-type"];
    if (currentPage1.licenceType) return currentPage1.licenceType;

    const editingIndex = state.editing;
    const entries = Array.isArray(state.entries) ? state.entries : [];
    if (
      Number.isInteger(editingIndex) &&
      editingIndex >= 0 &&
      entries[editingIndex]
    ) {
      return (
        entries[editingIndex]["licence-type"] ||
        entries[editingIndex].licenceType ||
        ""
      );
    }

    return "";
  } catch {
    return "";
  }
}

function isFxStationType() {
  return getLicenceTypeFromState() !== "radio2";
}

function isDirectionalPattern(value) {
  return value === "1";
}

function isTxSideSelected(antennaType) {
  return antennaType === "radio1" || antennaType === "radio3";
}

function isRxSideSelected(antennaType) {
  return antennaType === "radio2" || antennaType === "radio3";
}

function isValidEmailList(value) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const emails = value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part !== "");

  if (!emails.length) return false;
  return emails.every((email) => emailRegex.test(email));
}

function validateBaseFieldConstraints(el, errors) {
  if (isHiddenField(el)) return;

  const value = getTrimmedValue(el);
  const required = el.hasAttribute("required");
  if (required && !value) {
    addError(errors, el, "Enter information to continue.");
    return;
  }

  if (!value) return;

  const minLength = el.getAttribute("minlength");
  const maxLength = el.getAttribute("maxlength");
  const pattern = el.getAttribute("pattern");
  const type = el.getAttribute("type");
  const min = el.getAttribute("min");
  const max = el.getAttribute("max");
  const step = el.getAttribute("step");

  if (minLength && value.length < Number.parseInt(minLength, 10)) {
    addError(
      errors,
      el,
      `Enter at least ${Number.parseInt(minLength, 10)} characters.`,
    );
    return;
  }

  if (maxLength && value.length > Number.parseInt(maxLength, 10)) {
    addError(
      errors,
      el,
      `Enter no more than ${Number.parseInt(maxLength, 10)} characters.`,
    );
    return;
  }

  if (pattern) {
    const regex = new RegExp(`^(?:${pattern})$`);
    if (!regex.test(value)) {
      addError(errors, el, "Enter a valid value.");
      return;
    }
  }

  if (type === "number") {
    const num = parseNumber(value);
    if (num == null) {
      addError(errors, el, "Enter a valid number.");
      return;
    }

    const parsedMin = min != null && min !== "" ? Number.parseFloat(min) : null;
    const parsedMax = max != null && max !== "" ? Number.parseFloat(max) : null;

    if (parsedMin != null && num < parsedMin) {
      addError(
        errors,
        el,
        `Enter a value greater than or equal to ${parsedMin}.`,
      );
      return;
    }
    if (parsedMax != null && num > parsedMax) {
      addError(errors, el, `Enter a value less than or equal to ${parsedMax}.`);
      return;
    }

    if (step === "1" && !Number.isInteger(num)) {
      addError(errors, el, "Enter a whole number.");
      return;
    }
  }
}

function requireField(el, errors, message) {
  if (!el || isHiddenField(el)) return;
  if (!getTrimmedValue(el)) {
    addError(errors, el, message);
  }
}

function requireAndValidateNumber(el, errors, options) {
  if (!el || isHiddenField(el)) return;
  const value = getTrimmedValue(el);
  if (!value) {
    addError(errors, el, options.requiredMessage);
    return;
  }

  const num = parseNumber(value);
  if (num == null) {
    addError(errors, el, options.invalidMessage || "Enter a valid number.");
    return;
  }

  if (options.integer && !Number.isInteger(num)) {
    addError(errors, el, options.invalidMessage || "Enter a whole number.");
    return;
  }

  if (options.min != null && num < options.min) {
    addError(errors, el, options.invalidMessage);
    return;
  }

  if (options.max != null && num > options.max) {
    addError(errors, el, options.invalidMessage);
  }
}

function validatePage1Rules(errors) {
  const licenceField = getFieldByInputId("licence-number");
  const licenceValue = getFieldValueByInputId("licence-number");
  if (licenceField && licenceValue) {
    if (!/^\d{1,9}$/.test(licenceValue)) {
      addError(
        errors,
        licenceField,
        "Enter a spectrum licence number from 1 to 999999999.",
      );
    } else {
      const licenceNum = Number.parseInt(licenceValue, 10);
      if (!(licenceNum >= 1 && licenceNum <= 999999999)) {
        addError(
          errors,
          licenceField,
          "Enter a spectrum licence number from 1 to 999999999.",
        );
      }
    }
  }

  const businessNumberField = getFieldByInputId("business-number");
  const businessNumber = getFieldValueByInputId("business-number");
  if (businessNumberField && businessNumber) {
    if (businessNumber.length < 10 || businessNumber.length > 254) {
      addError(
        errors,
        businessNumberField,
        "Enter a business telephone number between 10 and 254 characters.",
      );
    }
  }

  const emailField = getFieldByInputId("email-address");
  const emailValue = getFieldValueByInputId("email-address");
  if (emailField && emailValue && !isValidEmailList(emailValue)) {
    addError(
      errors,
      emailField,
      "Enter a valid email address, or multiple valid email addresses separated by commas.",
    );
  }
}

function validatePage2Rules(errors) {
  const radioTechField = getFieldBySelectId("radio-technology");
  const radioTech = getFieldValueBySelectId("radio-technology");

  const cellIdField = getFieldByInputId("cell-id");
  const cellId = getFieldValueByInputId("cell-id");
  if (
    cellIdField &&
    !isHiddenField(cellIdField) &&
    MOBILE_TECH_VALUES.has(radioTech)
  ) {
    if (!cellId) {
      addError(errors, cellIdField, "Enter a Cell ID.");
    } else {
      const compactCellId = cellId.replace(/-/g, "");
      const hasValidLength =
        compactCellId.length >= 11 && compactCellId.length <= 27;
      const hasValidPattern =
        /^[A-Za-z0-9]{1,6}-[A-Za-z0-9]{1,8}-[A-Za-z0-9]{1,11}$/.test(cellId);

      if (!hasValidLength || !hasValidPattern) {
        addError(
          errors,
          cellIdField,
          "Enter a Cell ID in alphanumeric format AAA111-BBBBB222-CCCCCC33333 with 11 to 27 characters (excluding hyphens).",
        );
      }
    }
  }

  const physicalCellIdField = getFieldByInputId("physical-cell-id");
  const physicalCellId = getFieldValueByInputId("physical-cell-id");
  if (
    physicalCellIdField &&
    !isHiddenField(physicalCellIdField) &&
    LTE_5G_TECH_VALUES.has(radioTech)
  ) {
    if (!physicalCellId) {
      addError(errors, physicalCellIdField, "Enter a Physical Cell ID.");
    } else {
      const physicalValue = parseNumber(physicalCellId);
      const maxValue = radioTech === "4" ? 503 : 1007;
      if (
        physicalValue == null ||
        !Number.isInteger(physicalValue) ||
        physicalValue < 0 ||
        physicalValue > maxValue
      ) {
        addError(
          errors,
          physicalCellIdField,
          `Enter a Physical Cell ID between 0 and ${maxValue}.`,
        );
      }
    }
  }

  const structureHeightField = getFieldByInputId("structure-height");
  const structureHeight = getFieldValueByInputId("structure-height");
  const siteType = getFieldValueBySelectId("site-type");
  if (
    structureHeightField &&
    !isHiddenField(structureHeightField) &&
    siteType === "2"
  ) {
    requireAndValidateNumber(structureHeightField, errors, {
      requiredMessage: "Enter a Structure Height.",
      invalidMessage: "Enter a Structure Height between 1 and 600 metres.",
      min: 1,
      max: 600,
    });
  }

  const dateField = getDateFieldByInputId("date-of-modification");
  const rawDateValue = dateField
    ? typeof dateField.value === "string"
      ? dateField.value
      : ""
    : "";
  if (dateField && rawDateValue.trim()) {
    const selectedDate = parseIsoLikeDate(rawDateValue);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (!selectedDate || selectedDate >= today) {
      addError(
        errors,
        dateField,
        "Enter a date in the past for Date of last modification.",
      );
    }
  }

  if (radioTechField && radioTech && !/^[1-9]$/.test(radioTech)) {
    addError(errors, radioTechField, "Select a valid Radio technology.");
  }
}

function validateAntennaSide(
  errors,
  side,
  antennaType,
  siteType,
  structureHeight,
  isFx,
) {
  const isTx = side === "tx";
  const sideLabel = isTx ? "Tx" : "Rx";
  const sideSelected = isTx
    ? isTxSideSelected(antennaType)
    : isRxSideSelected(antennaType);

  const frequencyField = getFieldByInputId(`${side}-channel-frequency`);
  const frequencyValue = getFieldValueByInputId(`${side}-channel-frequency`);

  if (!sideSelected || !frequencyField || isHiddenField(frequencyField)) return;

  requireAndValidateNumber(frequencyField, errors, {
    requiredMessage: `Enter a ${sideLabel} channel frequency.`,
    invalidMessage: `Enter a valid ${sideLabel} channel frequency.`,
  });

  const frequencyNumber = parseNumber(frequencyValue);
  const hasPositiveFrequency = frequencyNumber != null && frequencyNumber > 0;

  const modelField = getFieldByInputId(`${side}-radio-model`);
  if (hasPositiveFrequency) {
    requireField(
      modelField,
      errors,
      `Enter a ${sideLabel} radio model number.`,
    );
  }

  const radioCodeField = getFieldByInputId(`${side}-radio-code`);
  const radioCertificateField = getFieldByInputId(`${side}-radio-certificate`);
  const typeCodeField = getFieldBySelectId(`${side}-type-code`);
  const manufacturerField = getFieldByInputId(`${side}-antenna-manufacturer`);
  if (hasPositiveFrequency && isFx) {
    requireField(
      radioCodeField,
      errors,
      `Enter a ${sideLabel} radio manufacturer code.`,
    );
    requireField(
      radioCertificateField,
      errors,
      `Enter a ${sideLabel} radio certification number.`,
    );
    requireField(
      typeCodeField,
      errors,
      `Select a ${sideLabel} antenna type code.`,
    );
    requireField(
      manufacturerField,
      errors,
      `Enter a ${sideLabel} antenna manufacturer.`,
    );
  }

  const antennaCountField = getFieldByInputId(`${side}-number-antennas`);
  if (hasPositiveFrequency) {
    requireAndValidateNumber(antennaCountField, errors, {
      requiredMessage: `Enter the total number of ${sideLabel} antennas.`,
      invalidMessage: `Enter a whole number from 1 to 256 for ${sideLabel} antennas.`,
      min: 1,
      max: 256,
      integer: true,
    });
  }

  const antennaModelField = getFieldByInputId(`${side}-antenna-model`);
  if (hasPositiveFrequency) {
    requireField(
      antennaModelField,
      errors,
      `Enter a ${sideLabel} antenna model number.`,
    );
  }

  const antennaHeightField = getFieldByInputId(`${side}-antenna-height`);
  const antennaHeightValue = getFieldValueByInputId(`${side}-antenna-height`);
  if (hasPositiveFrequency) {
    requireAndValidateNumber(antennaHeightField, errors, {
      requiredMessage: `Enter a ${sideLabel} antenna height.`,
      invalidMessage: `Enter a valid ${sideLabel} antenna height for the selected Site Type Code.`,
    });

    const antennaHeight = parseNumber(antennaHeightValue);
    if (antennaHeight != null) {
      if (siteType === "1") {
        if (antennaHeight < -100 || antennaHeight > 0) {
          addError(
            errors,
            antennaHeightField,
            `${sideLabel} antenna height must be between -100 and 0 metres for underground sites.`,
          );
        }
      } else if (siteType === "2" || siteType === "3") {
        if (antennaHeight < 0 || antennaHeight > 600) {
          addError(
            errors,
            antennaHeightField,
            `${sideLabel} antenna height must be between 0 and 600 metres.`,
          );
        }
        if (structureHeight != null && antennaHeight > structureHeight + 5) {
          addError(
            errors,
            antennaHeightField,
            `${sideLabel} antenna height must be no more than 5 metres above Structure Height.`,
          );
        }
      }
    }
  }

  const patternField = getFieldBySelectId(`${side}-omnidirectional-pattern`);
  const patternValue = getFieldValueBySelectId(
    `${side}-omnidirectional-pattern`,
  );
  if (hasPositiveFrequency) {
    requireField(
      patternField,
      errors,
      `Select a ${sideLabel} antenna omnidirectional pattern indicator.`,
    );
  }

  if (
    hasPositiveFrequency &&
    patternValue &&
    !["1", "2"].includes(patternValue)
  ) {
    addError(
      errors,
      patternField,
      `Select a valid ${sideLabel} antenna omnidirectional pattern indicator.`,
    );
  }

  const directional =
    hasPositiveFrequency && isDirectionalPattern(patternValue);

  if (directional) {
    requireAndValidateNumber(
      getFieldByInputId(`${side}-antenna-horizontal-beamwidth`),
      errors,
      {
        requiredMessage: `Enter a ${sideLabel} antenna horizontal beamwidth.`,
        invalidMessage: `${sideLabel} antenna horizontal beamwidth must be between 1 and 359.9 degrees.`,
        min: 1,
        max: 359.9,
      },
    );

    requireAndValidateNumber(
      getFieldByInputId(`${side}-antenna-vertical-beamwidth`),
      errors,
      {
        requiredMessage: `Enter a ${sideLabel} antenna vertical beamwidth.`,
        invalidMessage: `${sideLabel} antenna vertical beamwidth must be between 1 and 359.9 degrees.`,
        min: 1,
        max: 359.9,
      },
    );

    requireAndValidateNumber(
      getFieldByInputId(`${side}-antenna-azimuth`),
      errors,
      {
        requiredMessage: `Enter a ${sideLabel} antenna azimuth.`,
        invalidMessage: `${sideLabel} antenna azimuth must be between 0 and 359.9 degrees.`,
        min: 0,
        max: 359.9,
      },
    );

    requireAndValidateNumber(
      getFieldByInputId(`${side}-antenna-elevation-angle`),
      errors,
      {
        requiredMessage: `Enter a ${sideLabel} antenna elevation angle.`,
        invalidMessage: `${sideLabel} antenna elevation angle must be between -90 and 90 degrees.`,
        min: -90,
        max: 90,
      },
    );
  }

  if (hasPositiveFrequency) {
    requireAndValidateNumber(
      getFieldByInputId(`${side}-antenna-gain`),
      errors,
      {
        requiredMessage: `Enter a ${sideLabel} antenna gain.`,
        invalidMessage: `${sideLabel} antenna gain must be between 0 and 70 dBi.`,
        min: 0,
        max: 70,
      },
    );

    requireAndValidateNumber(
      getFieldByInputId(`${side}-antenna-line-loss`),
      errors,
      {
        requiredMessage: `Enter a ${sideLabel} line loss.`,
        invalidMessage: `${sideLabel} line loss must be between 0 and 30 dB.`,
        min: 0,
        max: 30,
      },
    );
  }
}

function validatePage3Rules(errors) {
  const antennaType = getFieldValueByRadioName("antenna-type");
  if (!antennaType) return;

  const classOfEmissionsField = getFieldByInputId("class-of-emissions");
  const classOfEmissions = getFieldValueByInputId("class-of-emissions");
  if (classOfEmissionsField && classOfEmissions) {
    if (!/^[0-9A-Za-z]{3,5}$/.test(classOfEmissions)) {
      addError(
        errors,
        classOfEmissionsField,
        "Enter a Class of emissions code using 3 to 5 letters or numbers.",
      );
    }
  }

  const downlinkField = getFieldByInputId("downlink");
  if (downlinkField && !isHiddenField(downlinkField)) {
    requireAndValidateNumber(downlinkField, errors, {
      requiredMessage: "Enter a Downlink resource allocation.",
      invalidMessage: "Downlink resource allocation must be between 0 and 100.",
      min: 0,
      max: 100,
    });
  }

  const txFrequency = parseNumber(
    getFieldValueByInputId("tx-channel-frequency"),
  );
  if (txFrequency != null && txFrequency > 0) {
    const tcpField = getFieldByInputId("tcp");
    requireField(tcpField, errors, "Enter a Transmitter TCP-TRP value.");
  }

  const siteType = getFieldValueBySelectId("site-type");
  const structureHeight = parseNumber(
    getFieldValueByInputId("structure-height"),
  );
  const isFx = isFxStationType();

  validateAntennaSide(
    errors,
    "tx",
    antennaType,
    siteType,
    structureHeight,
    isFx,
  );
  validateAntennaSide(
    errors,
    "rx",
    antennaType,
    siteType,
    structureHeight,
    isFx,
  );
}

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
  const tag = el.tagName.toLowerCase();
  const native = getInnerNativeField(el);
  if (native && tag !== "gcds-radios") {
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
  if (tag === "gcds-input") {
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

    if (type === "text" && (min || max)) {
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

function isHiddenField(el) {
  if (!el) return false;
  if (el.hidden) return true;
  if (el.closest("[hidden]")) return true;
  const style = window.getComputedStyle(el);
  if (style.display === "none" || style.visibility === "hidden") return true;
  return false;
}

function getCurrentPageEntryAndFields() {
  const page = Number.parseInt(localStorage.getItem(PAGE_KEY) || "1", 10);
  const state = ensureState();
  const current = state.current || {};
  const currentPageData = collectPageData();
  const entry = {
    ...(current.page1 || {}),
    ...(current.page2 || {}),
    ...(current.page3 || {}),
  };
  entry[`page${page}`] = currentPageData;
  Object.assign(entry, currentPageData);

  const fieldSelectors = [
    "gcds-input",
    "gcds-select",
    "gcds-date-input",
    "gcds-radios",
  ];
  const fields = Array.from(
    document.querySelectorAll(fieldSelectors.join(",")),
  );
  const fieldMap = new Map();
  fields.forEach((el) => {
    getElementKeys(el).forEach((key) => {
      if (key && !fieldMap.has(key)) fieldMap.set(key, el);
    });
  });

  return { entry, fields, fieldMap, page };
}

function validateCurrentPage() {
  const errors = new Map();
  const { entry, fields, fieldMap, page } = getCurrentPageEntryAndFields();

  fields.forEach((el) => {
    if (isHiddenField(el)) {
      clearFieldError(el);
      return;
    }
    validateBaseFieldConstraints(el, errors);
  });

  const entryErrors = validateEntryData(entry, [page]);
  Object.entries(entryErrors).forEach(([fieldKey, message]) => {
    const field = fieldMap.get(fieldKey);
    if (field) addError(errors, field, message);
  });

  fields.forEach((el) => {
    if (isHiddenField(el)) {
      clearFieldError(el);
      return;
    }
    const message = errors.get(el);
    if (message) {
      setFieldError(el, message);
    } else {
      clearFieldError(el);
    }
  });

  return errors.size === 0;
}

export {
  applyValidationToAllFields,
  validateCurrentPage,
  validateEntryData,
  validateEntriesForCsv,
};
