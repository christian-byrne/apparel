/**
 * Add Item.
 *
 * From: Aug 2021
 * Project: Apparel
 *
 * @exports AddItem
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
 *
 */
class AddItem {
  constructor(options) {
    let config = {
      usernameQueryHandler: curUser,
      URL: BASE_URL,
    };
    Object.assign(config, options);

    this.config = config;
    this.curUser = config.usernameQueryHandler;
    this.fields = [
      "description",
      "rating",
      "category",
      "subCategory",
      "type",
      "fit",
      "length",
      "brand",
      "purchaseLocation",
      "purchaseDate",
      "cost",
      "condition",
      "washType",
    ];
    this.CSVfields = ["style"];
    this.form = new FormParse();
    this.genIterableIds = (range, suffix) => {
      const ret = [];
      for (let i = 1; i <= range; i++) {
        ret.push(`${suffix}${i}`);
      }
      return ret;
    };
    this.mats = {
      materials: this.genIterableIds(4, "mat"),
      weights: this.genIterableIds(4, "matWeight"),
    };
    this.col = {
      colors: this.genIterableIds(6, "color"),
      weights: this.genIterableIds(6, "colorWeight"),
    };

    /** Read and construct into Item shape. */
    this.serialize = (bare = false) => {
      const ret = {
        ...this.form.read(this.fields),
        ...this.form.readCSV(this.CSVfields),
        size: {
          number: this.form.inputsToArray(["numberSizing1", "numberSizing2"]),
          letter: document.querySelector("#letterSizingInput").value,
        },
        material: this.form.readWeighted(this.mats),
        color: this.form.readWeighted(this.col),
      };
      if (bare) {
        return ret;
      }
      const multipartData = this.form.jsonToFormData(ret);
      console.log(ret)
      multipartData.append(
        "image",
        document.querySelector("#imageInput").files[0]
      );
      // for (const [key, value] of Object.entries(ret)) {
      //   multipartData.append(key, JSON.stringify(value));
      // }
      return multipartData;
    };
  }

  /**
   * Post outfit to server.
   */
  post = () => {
    const ajaxOptions = {
      url: `${this.config.URL}/post/item/${this.curUser()}`,
      type: "POST",

      enctype: "multipart/form-data",
      processData: false,
      contentType: false,
      cache: false,

      data: this.serialize(),
      success: () => {},
      error: () => {},
    };
    $.ajax(ajaxOptions);
  };
}

export default AddItem;
