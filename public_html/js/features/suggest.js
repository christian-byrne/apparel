/**
 * Suggest / Auto-Complete Outfits.
 *
 * From: Aug 2021
 * Project: Apparel
 *
 * @exports Suggest
 * @author Christian P. Byrne
 *
 */

/**
 * @class
 *
 */
class Suggest {
  constructor() {
    /**
     * Opens coolors.co page of the current outfit's color
     * palette.
     *
     * @param {string[]} hexList
     */
    this.coolors = (hexList) => {
      let hexCodes = hexList.join("-").replace(/#/g, "");
      let url = `https://coolors.co/${hexCodes}`;
      let hyper = document.createElement("a");
      hyper.href = url;
      hyper.target = "_blank";
      setTimeout(() => {
        hyper.click();
      }, 10);
    };
  }
}

export default Suggest;
