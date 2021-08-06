/**
 * Outfit Collection Page Listeners
 *
 * From: Aug 2021
 * Project: Apparel
 *
 * @exports PageOutfits
 * @author Christian P. Byrne
 *
 */

import Search from "./../features/search.js";
import Templates from "./../features/templates.js";

/**
 * @class
 * Wardrobe Page.
 *
 * @param {HTMLElement} itemQueueNode
 * @param {HTMLElement} searchOutputNode
 * @property {(json) => any} displaySearchRes
 *
 * @implements {Search}
 * @implements {Templates}
 *
 * @listens document#click
 * @listens document#submit
 *
 */
class PageOutfits {
  constructor(itemQueueNode) {
    this.queue = itemQueueNode || document.querySelector("#items-queue");
    this.search = new Search();
    this.templates = new Templates();

    /**
     * Handle item array server response.
     * @param {Item[]} json
     */
    this.displaySearchRes = (json) => {
      this.search.clearResults().then(() => {
        this.templates.categoryTabs(json, "Edit");
      });
    };

    setTimeout(() => {
      this.search.allOutfits().then((outfits) => {
        // this.displaySearchRes(items);
        let container = document.querySelector("#right-content");
        this.templates.outfitRow(outfits).then((divs) => {
            console.log(divs)
            for ( const div of divs ) {
                container.appendChild(div)
            }
        })
      });
    }, 20);

    document.documentElement.addEventListener("click", (event) => {
      const caller = event.target;
      const callerCss = Array.from(caller.classList);

      if (callerCss.includes("add-to-queue")) {
        // TODO: Edit item modal.
        event.preventDefault();
        window.location = "/add/item";
      } else if (callerCss.includes("dismiss-search-item")) {
        let data = caller.getAttribute("data");
        for (const card of document.querySelectorAll("div.card")) {
          if (card.getAttribute("data") === data) {
            card.parentElement.remove();
            break;
          }
        }
      }
    });
  }
}

export default PageOutfits;
