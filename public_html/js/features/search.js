/**
 * Search Features.
 *
 * From: Aug 2021
 * Project: Apparel
 *
 * @exports Search
 * @author Christian P. Byrne
 *
 */

import Notifications from "./notifications.js";
import { BASE_URL } from "./../constants.js";
import { curUser } from "./../global-handlers.js";

/**
 * @class
 * @implements {Notifications}
 * @param {object} options - Fields, handlers, query functions.
 * @property {() => string} curUser
 * @property {string} URL
 * @property {HTMLElement} tooltipNodeLoc
 *
 */
class Search {
  constructor(options, responseHandler) {
    let config = {
      URL: BASE_URL,
      curUser: curUser,
      filterTxtSelector: () => {
        return document.querySelector("#filterSearchInput");
      },
      searchTxtSelector: () => {
        return document
          .querySelector("#searchAll")
          .querySelector("input[type=search]").value;
      },
      filterTypeSelector: () => {
        return document
          .querySelector("#filterDropdownChoice")
          .getAttribute("data");
      },
      tooltipNodeLoc: document.querySelector("#filterDropdownButton"),
      filterTitle: "Filter Type",
      requiredErrorMsg:
        "Or Search all fields using the other search bar at the top of the page",
      ajaxErrorHanlder: (reason) => console.log(reason),
      resultsSelector: () => {
        return document.querySelectorAll("div.searchResultCard");
      },
    };
    Object.assign(config, options);
    Object.assign(this, config);
    this.responseHandler = responseHandler;
    this.notify = new Notifications();

    /**
     * Can capture.
     * @returns {Promise<Boolean>}
     */
    this.validateFilter = async () => {
      if (!this.filterTypeSelector()) {
        this.notify.popoverTooltip(this.tooltipNodeLoc, {
          title: `Select a ${this.filterTitle} First`,
          content: this.requiredErrorMsg,
          placement: "top",
          trigger: "focus",
        });
        return false;
      } else {
        return true;
      }
    };
  }

  /**
   *
   * @returns {string[]} Ids of current results being displayed.
   */
  currentResults = () => {
    const ret = [];
    for (const card of this.resultsSelector()) {
      if (card.data) {
        ret.push(card.data);
      }
    }
    return ret;
  };

  /**
   *
   * @returns {Promise<void>}
   */
  clearResults = async () => {
    while (this.resultsSelector().length > 0) {
      this.resultsSelector()[0].remove();
    }
    return;
  };

  /**
   *
   * @returns {Promise<Item[]>}
   */
  itemById = async (id) => {
    return $.get(`${this.URL}/get/oneitem/${id}`, (items) => {
      return items;
    });
  };

  /**
   *
   * @returns {Promise<Item[]>}
   */
  allItems = async () => {
    return $.get(`${this.URL}/get/items/${this.curUser()}`, (items) => {
      return items;
    });
  };

  /**
   *
   * @returns {Promise<Outfit[]>}
   */
  allOutfits = async () => {
    return $.get(`${this.URL}/get/outfits/${this.curUser()}`, (outfits) => {
      return outfits;
    });
  };

  /**
   *
   * @returns {Promise<Item[]>}
   */
  keywordAllFields = async () => {
    return $.get(
      `${this.URL}/search/all/${this.curUser()}/${this.searchTxtSelector()}`,
      (searchResults) => {
        return searchResults;
      }
    );
  };

  /**
   * If there are already search results displayed, then only
   * eliminate active results.If there are no results
   * displayed (first search or recently cleared),
   * peform a new query.
   *
   * @returns {Promise<void>}
   */
  keywordOneField = async () => {
    return this.validateFilter().then((validated) => {
      if (!validated) {
        return;
      } else {
        const active = this.currentResults();
        const ajaxOptions = {
          url: `${this.URL}/search/field`,
          type: "POST",
        xhrFields: {
          withCredentials: true
        },
          data: {
            username: this.curUser(),
            keyword: this.filterTxtSelector().value,
            field: this.filterTypeSelector(),
          },
          success: (searchResults) => {
            return searchResults;
          },
          error: this.ajaxErrorHanlder,
        };

        // Narrowing down currently displayed results.
        if (active.length > 0) {
          Object.assign(ajaxOptions, {
            url: `${this.URL}/search/intersection`,
          });
          ajaxOptions.data["narrowTarget"] = currentResults;
        }

        return $.ajax(ajaxOptions);
      }
    });
  };
}

export default Search;
