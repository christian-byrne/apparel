/**
 * Parse Forms.
 *
 * Form parser class to collect data from all app's
 * forms in correspondence with the naming rules used
 * throughout the markup; and then construct
 * appropriate FormData objects.
 *
 * From: Aug 2021
 * Project: Apparel
 *
 * @exports FormParse
 * @author Christian P. Byrne
 *
 */

/**
 * @class
 * Form Parser.
 *
 * @implements {FormData}
 * @property {(selector: string) => HTMLElement} v - Query handler for
 *  finding inputs.
 * @property {(inputVal: string) => string} format - Formatter for values.
 * @property {(selector: string) => HTMLElement} siblingQuery - Query handler
 *  for selecting input's siblings.
 * @property {(reason: string) => any} handleError - Default AJAX err handler.
 *
 */
class FormParse {
  constructor() {
    this.v = (selector) => {
      const node = document.querySelector(`#${selector}Input`);
      return node ? node.value : false;
    };
    this.siblingQuery = (selector) => {
      return document.querySelector(`#${selector}Input`).nextElementSibling
        .value;
    };
    this.format = (inputVal) => {
      return inputVal.trim().toLowerCase();
    };
  }

  /**
   * Handle register/login error responses from server.
   */
  handleError = () => {
    // Temporary:
    alert("error registering");
  };

  /**
   *
   * @param {{[property: string] : string[]}} arrayObject Object in which the
   *  keys are kept the same but the associated array values are used to collect
   *  the input data for (using the query selector func of instance) and mapped
   *  into a new array.
   *
   */
  readArrayFields = (arrayObject) => {
    const ret = {};
    for (const [field, inputIds] of Object.entries(arrayObject)) {
      ret[field] = this.inputsToArray(inputIds);
    }
    return ret;
  };

  /**
   * @private
   * @param {string[]} fields
   * @param {(selector: string) => HTMLElement} queryHandler
   * @returns {string[]} Values.
   */
  inputsToArray = (fields, queryHandler = this.v) => {
    const ret = [];
    for (const input of fields) {
      let value = queryHandler(input);
      if (value) {
        ret.push(value);
      }
    }
    return ret;
  };

  /**
   * @private
   * @param {string[]} keyArray
   * @param {string[]} valueArray
   * @param {(selector: string) => HTMLElement} queryHandler
   * @returns {{[key: string]: value}}
   */
  readKeyValue = (keyArray, valueArray, queryHandler = this.v) => {
    const ret = {};
    const keys = this.inputsToArray(keyArray, queryHandler);
    const values = this.inputsToArray(valueArray, queryHandler);
    keys.forEach((field, index) => {
      if (field && index < values.length) {
        ret[field] = values[index];
      }
    });
    return ret;
  };

  /**
   * Read fields.
   * @param {(selector: string) => HTMLElement} queryHandler
   * @param {string[]} fields
   * @returns {{[field: string]: input.value}}
   */
  read = (fields, queryHandler = this.v) => {
    const serialized = {};
    for (const field of fields) {
      serialized[field] = queryHandler(field);
    }
    return serialized;
  };

  /**
   *
   * @param {string[]} fields
   * @param {(selector: string) => HTMLElement} queryHandler
   * @param {(inputVal: string) => string} formatHandler - Formatter for values.
   * @returns {[field: string]: strin[]}
   */
  readCSV = (fields, queryHandler = this.v, formatHandler = this.format) => {
    const ret = {};
    const serialized = this.read(fields, queryHandler);

    for (const [field, value] of Object.entries(serialized)) {
      let split = value.split(",");
      let formatted = [];
      split.forEach((input) => {
        formatted.push(formatHandler(input));
      });
      ret[field] = formatted;
    }
    return ret;
  };

  /**
   *
   * @param {{[field: string]: {property: value}}} fieldObj
   * @returns {Item | Outfit | User}
   */
  readWeighted = (fieldObj) => {
    const ret = {};
    const unsorted = {};
    const properties = Object.keys(fieldObj);
    let unsortedValues = this.inputsToArray(fieldObj[properties[0]]);
    let unsortedWeights = this.inputsToArray(fieldObj[properties[1]]);

    for (let i = 0; i < unsortedValues.length; i++) {
      if (unsortedWeights[i] && unsortedWeights[i] != 0) {
        unsorted[unsortedValues[i]] = unsortedWeights[i];
      }
    }
    const sorted = Object.fromEntries(
      Object.entries(unsorted)
        .sort(([, a], [, b]) => a - b)
        .reverse()
    );
    ret[properties[0]] = Object.keys(sorted);
    ret[properties[1]] = Object.values(sorted);
    return ret;
  };
}

export default FormParse;
