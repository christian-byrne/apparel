/**
 * App Directory Util.
 *
 * From: Aug 2021
 * Project: Apparel
 *
 * @exports Directory
 * @author Christian P. Byrne
 *
 */

import { BASE_URL } from "./../constants.js";

/**
 * @class
 * @param {object} options
 * @property {string} URL
 */
class Directory {
  constructor(options) {
    let config = {
      URL: BASE_URL,
    };
    Object.assign(config, options);
    Object.assign(this, config);
  }

  /**
   *
   * @param {string} dirName
   * @returns {string[]} Filenames.
   */
  fileNames = async (dirName) => {
    return $.get(
      `${this.URL}/filenames/${encodeURIComponent(dirName)}`,
      (fileNames) => {
        return fileNames;
      }
    );
  };
}

export default Directory;
