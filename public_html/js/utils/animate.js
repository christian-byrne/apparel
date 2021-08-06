/**
 * Color Rotator Animations.
 *
 * From: Aug 2021
 * Project: Apparel
 *
 * @exports ColorRotator
 * @author Christian P. Byrne
 *
 */

import SketchColors from "./filter.js";

/**
 * @class
 * @param {HTMLElement[]} targets
 */
class ColorRotator {
  constructor(targets) {
    this.appTheme = ["#dee2ff", "#8e9aaf", "#feeafa", "#efd3d7", "#985277"];
    this.palette = [
      "#BDBDBD",
      "#000000",
      "#A17859",
      "#C9B0A5",
      "#966D45",
      "#A17859",
      "#37281A",
      "#726C48",
      "#354550",
      "#000066",
      "#CDEBF9",
    ];
    this.target = targets;
    this.paletteCopy = [...this.palette];
    this.infinitePal = this.palette.concat(this.paletteCopy);
    this.filter = new SketchColors();

    /**
     * @private
     */
    this.iterColor = () => {
      for (let i = 0; i < targets.length; i++) {
        let nxtColor = this.infinitePal[i];
        let filterProp = this.filter.filterConvert(nxtColor);
        targets[i].style.setProperty("filter", filterProp);
        this.infinitePal.push(this.infinitePal.shift());
      }
    };

    /**
     * Initialize animation.
     */
    this.init = () => {
      let interval = setInterval(this.iterColor, 6000);
      setTimeout(() => {
        clearInterval(interval);
      }, 100000);
    };
  }
}

export default ColorRotator;
