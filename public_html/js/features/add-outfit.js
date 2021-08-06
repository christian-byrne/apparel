/**
 * Add Outfit.
 *
 * From: Aug 2021
 * Project: Apparel
 *
 * @exports AddOutfit
 * @author Christian P. Byrne
 *
 */

import FormParse from "./../utils/form-parse.js";
import { BASE_URL } from "./../constants.js";
import { curUser } from "./../global-handlers.js";

/**
 * @class
 * @implements {FormParse}
 * @param {object} options - Fields, handlers, query functions.
 * @property {() => string} curUser
 * @property {string} URL
 * @property {HTMLElement} itemsQueueNode
 *
 */
class AddOutfit {
  constructor(options) {
    let config = {
      curUser: curUser,
      URL: BASE_URL,
      itemsQueueNode: document.querySelector("#items-queue"),
      fields: [
        "description",
        "rating",
        "category",
        "subCategory",
        "type",
        "lastWorn",
        "wearCount",
        "temperature",
        "notes",
      ],
      arrayFields: {
        weather: [
          "weatherRain",
          "weatherSnow",
          "weatherSun",
          "weatherWindy",
          "weatherHumid",
        ],
      },
      CSVfields: ["formality", "setting", "event"],
    };
    Object.assign(config, options);
    Object.assign(this, config);
    this.form = new FormParse();

    /**
     * Id from data attributes.
     * @returns {string[]}
     */
    this.itemQueueIds = () => {
      const ret = [];
      for (const item of this.itemsQueueNode.children) {
        if (item && item.getAttribute("data")) {
          ret.push(item.getAttribute("data"));
        }
      }
      return ret;
    };

    /**
     *
     * @returns {[key: string]: string}
     */
    this.serialize = () => {
      return {
        ...this.form.read(this.fields),
        ...this.form.readArrayFields(this.arrayFields),
        ...this.form.readCSV(this.CSVfields),
        items: this.itemQueueIds(),
      };
    };
  }

  /**
   * Post outfit to server.
   * @returns {Promise<void>}
   */
  postOutfit = async () => {
    console.log(this.serialize());
    const ajaxOptions = {
      url: `${this.URL}/post/outfit/${this.curUser()}`,
      xhrFields: {
        withCredentials: true,
      },
      type: "POST",
      data: this.serialize(),
      success: () => {
        return;
      },
      error: () => {},
    };
    return $.ajax(ajaxOptions);
  };
}

export default AddOutfit;
