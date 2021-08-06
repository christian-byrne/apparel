/**
 * Mannequin Objects.
 *
 * From: Aug 2021
 * Project: Apparel
 *
 * @exports Mannequin
 * @author Christian P. Byrne
 *
 */

import FormParse from "./../utils/form-parse.js";
import Directory from "./../utils/dir.js";
import SketchColors from "./../utils/filter.js";
import ClosestMatch from "./../utils/closest-match.js";

/**
 * Mannequin Outline with customizable clothing and props.
 *
 * @class
 * @param {(string) => HTMLElement} containerSelector
 * @param {string} gender
 *
 * @implements {FormParse}
 * @implements {Directory}
 * @implements {ClosestMatch}
 * @implements {SketchColors}
 *
 * @listens window#resize
 *
 * @property {HTMLElement} itemsQueueNode
 *
 */
class Mannequin {
  constructor(containerSelector, gender) {
    this.containerSelector = containerSelector;
    this.container = document.querySelector(containerSelector);
    this.referenceLayer = document.querySelector(
      `${containerSelector} > img:nth-of-type(1)`
    );
    this.files = new Directory();
    this.colors = new SketchColors();
    this.match = new ClosestMatch();
    this.gender = gender;
    this.clothes;
    this.propOptions().then((items) => {
      this.clothes = items;
    });

    this.maskLayers = () => {
      return document.querySelectorAll(
        `${containerSelector} > img:nth-of-type(n + 2)`
      );
    };
    window.addEventListener("resize", () => {
      setTimeout(() => {
        this.resize();
      }, 10);
    });

    /**
     *
     * @returns {[width: string, height: string]}
     */
    this.computedSize = () => {
      let reference = window.getComputedStyle(this.referenceLayer);
      return [reference.width, reference.height];
    };
  }

  get dimensions() {
    return this.computedSize();
  }

  /**
   *
   * @param {Boolean} accents
   * @returns {Promise<string[]>}
   */
  propOptions = async (accents = false) => {
    return this.files
      .fileNames(`img/${this.gender}/${accents ? "accent" : ""}`)
      .then((names) => {
        const ret = [];
        names.forEach((file) => ret.push(file.split(".")[0]));
        this.clothingOptions = ret;
        return ret;
      });
  };

  /**
   * Remove all props from mannequin.
   * @returns {Promise<void>}
   */
  undressAll = async () => {
    while (this.maskLayers().length > 0) {
      this.maskLayers()[0].remove();
    }
    return;
  };

  /**
   * @private
   * Resize mask layers on window resize.
   */
  resize = () => {
    const [newWidth, newHeight] = this.computedSize();
    for (const stackedImg of this.maskLayers()) {
      stackedImg.style.setProperty("height", newHeight);
      stackedImg.style.setProperty("width", newWidth);
      stackedImg.style.setProperty(
        "margin-top",
        `${parseInt(newHeight) * -1}px`
      );
    }
  };

  // TODO can implement pattern or print layer on top using mask image

  /**
   * Add item to mannequin.
   * @param {Item} item
   */
  dress = (item) => {
    console.log(item);
    this.propOptions().then((images) => {
      console.log(images);
      const match = new ClosestMatch(images);
      let layer;
      // Try an image layer for type then subcategory then category. Else, do nothing..
      for (const characteristic of ["type", "subCategory", "category"]) {
        if (item[characteristic]) {
          layer = match.closestInArray(item[characteristic], images);
          console.log(layer);
        }
        if (layer) {
          break;
        }
      }
      if (layer) {
        this.addProp(layer, item.color.colors[0]);
        // Get accent props for colors after main color.
        this.propOptions(true).then((accentImgs) => {
          let accentWeights = [];
          accentImgs.forEach((accent) =>
            accentWeights.push(accent.replace(/[^0-9]+/g, ""))
          );
          const getClosest = (weight) => {
            return accentWeights.reduce(function (pre, cur) {
              return Math.abs(cur - weight) < Math.abs(pre - weight)
                ? cur
                : pre;
            });
          };
          for (let i = 1; i < item.color.colors.length; i++) {
            let closest = getClosest(item.color.weights[i]);
            let accentFile = `accent/${layer}-${closest}`;
            this.addProp(accentFile, item.color.colors[i]);
            // Remove from options so not choosing same layer for multiple colors.
            accentWeights = accentWeights.filter((value) => value != closest);
            // Return when no accent image layers left.
            if (accentWeights.length == 0) {
              return;
            }
          }
        });
      }
    });
  };

  /**
   * @private
   * @param {HTMLElement} node
   */
  positionNode = (node) => {
    const dimensions = this.computedSize();
    [node.style.width, node.style.height] = dimensions;
    node.style.marginTop = `${parseInt(dimensions[1]) * -1}px`;
  };

  /**
   * @private
   * Add accent for n+1 color of an item.
   *
   * @param {string} itemName
   * @param {string} color - Hex formatted color.
   * @returns {Promise<void>}
   */
  addProp = async (itemName, color) => {
    if (!this.clothes.includes(itemName)) {
      return;
    }
    const imgLayer = document.createElement("img");
    imgLayer.src = `/img/${this.gender}/${itemName}.png`;
    imgLayer.loading = "eager";
    imgLayer.alt = `${color} ${itemName} layer on mannequin.`;
    // imgLayer.id = `#mask-${itemName}`;

    const filters = this.colors.filterConvert(color);
    imgLayer.style.filter = filters;
    imgLayer.style.opacity = "1.0";

    setTimeout(() => {
      this.positionNode(imgLayer);
      this.container.appendChild(imgLayer);
    }, 20);
    return;
  };
}

export default Mannequin;
