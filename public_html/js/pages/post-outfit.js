/**
 * Add Outfit Page Listeners
 *
 * From: Aug 2021
 * Project: Apparel
 *
 * @exports PageAddOutfit
 * @author Christian P. Byrne
 *
 */

import Mannequin from "./../features/mannequin.js";
import Notifications from "./../features/notifications.js";
import Search from "./../features/search.js";
import Suggest from "./../features/suggest.js";
import AddOutfit from "./../features/add-outfit.js";
import Templates from "./../features/templates.js";
import Refresh from "./../utils/refresh.js";
import { gender } from "./../global-handlers.js";

/**
 * @class
 *
 * @param {HTMLElement} itemQueueNode
 * @param {HTMLElement} searchOutputNode
 *
 * @implements {Mannequin}
 * @implements {Notifications}
 * @implements {Suggest}
 * @implements {Search}
 * @implements {AddOutfit}
 * @implements {Templates}
 * @implements {Refresh}
 *
 * @property {Mannequin} mannequin
 *
 * @listens document#click
 * @listens document#submit
 *
 *
 */
class PageAddOutfit {
  constructor(itemQueueNode, searchOutputNode) {
    this.mannequin = new Mannequin(".mask-outlines", gender());
    this.queue = itemQueueNode || document.querySelector("#items-queue");
    this.searchResults =
      searchOutputNode || document.querySelector("#searchResultsMain");
    this.outfit = new AddOutfit();
    this.search = new Search();
    this.templates = new Templates();
    this.refresh = new Refresh(this.queue);
    this.notification = new Notifications();

    document.documentElement.addEventListener("click", (event) => {
      const caller = event.target;
      const callerClasses = Array.from(caller.classList);
      if (caller.id === "submitAddOutfit") {
        this.outfit.postOutfit().then(() => {
          this.search.clearResults();
          this.refresh.fullReset();
          this.mannequin.undressAll();
          this.notification.minimialToast(
            document.querySelector("#main"),
            "Outfit added to your collection."
          );
        });
      } else if (
        caller.tagName === "A" &&
        caller.parentElement.parentElement.id === "filterDropdownChoice"
      ) {
        event.preventDefault();
        this.handleFilterTypeChange(caller);
      } else if (callerClasses.includes("suggest-next")) {
        const suggest = new Suggest();
        const colors = [];
        for (const color of document.querySelectorAll("div.item-color")) {
          colors.push(color.innerHTML);
        }
        suggest.coolors(colors);
      } else if (caller.id === "clearResultsInput") {
        this.search.clearResults();
      } else if (callerClasses.includes("add-to-queue")) {
        let id = caller.getAttribute("data");
        this.search.itemById(id).then((item) => {
          this.templates.listItem(item);
          this.mannequin.dress(item);
        });
      } else if (caller.id === "clear-items-queue") {
        event.preventDefault();
        while (this.queue.children.length > 0) {
          this.queue.firstElementChild.remove();
        }
      } else if (
        callerClasses.includes("dismiss-search-item") ||
        callerClasses.includes("dismiss-queue-item")
      ) {
        let id = caller.getAttribute("data");
        let parent = callerClasses.includes("dismiss-search-item")
          ? this.searchResults
          : this.queue;
        for (const item of parent.children) {
          if (
            item.getAttribute("data") === id ||
            (item.firstElementChild &&
              item.firstElementChild.getAttribute("data") === id)
          ) {
            item.remove();
            break;
          }
        }
      }
    });

    document.documentElement.addEventListener("submit", (event) => {
      const caller = event.target;
      if (caller.id === "searchAll") {
        event.preventDefault();
        this.search.keywordAllFields().then((items) => {
          if (items) {
            this.displaySearchRes(items);
          }
        });
      } else if (caller.id === "filterSearchForm") {
        event.preventDefault();
        this.search.keywordOneField().then((items) => {
          if (items) {
            this.displaySearchRes(items);
          }
        });
      }
    });
  }

  displaySearchRes = (json) => {
    this.search.clearResults().then(() => {
      this.templates.itemCards(json, this.searchResults).then(() => {});
    });
  };

  /**
   * Change data attribute of filter.
   * @param {HTMLElement} caller
   */
  handleFilterTypeChange = (caller) => {
    // When a new choice is selected, set data of ul.
    let choice = caller.innerHTML;
    let ul = caller.parentElement.parentElement;
    ul.setAttribute("data", choice);
    setTimeout(() => {
      document.querySelector("#filterDropdownButton").innerHTML = choice;
      document.querySelector(
        "#filterSearchInput"
      ).placeholder = `Enter ${choice.toLowerCase()} to add filter...`;
    }, 10);
  };
}

export default PageAddOutfit;
