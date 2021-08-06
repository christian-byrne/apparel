/**
 * Add Item Page Listeners
 *
 * From: Aug 2021
 * Project: Apparel
 *
 * @exports PageAddItem
 * @author Christian P. Byrne
 *
 */

import Mannequin from "./../features/mannequin.js";
import Notifications from "./../features/notifications.js";
import AddItem from "./../features/add-item.js";
import Refresh from "./../utils/refresh.js";

/**
 * @class
 *
 * @param {HTMLElement} itemQueueNode
 * @param {HTMLElement} searchOutputNode
 *
 * @implements {Mannequin}
 * @implements {Notifications}
 * @implements {AddItem}
 * @implements {Refresh}
 *
 * @listens document#click
 * @listens document#submit
 *
 *
 */
class PageAddItem {
  constructor() {
    this.item = new AddItem();
    this.mannequin = new Mannequin(".mask-outlines", "male");
    this.refresh = new Refresh([]);
    this.notification = new Notifications();

    document.documentElement.addEventListener("change", (event) => {
      const caller = event.target;
      if (
        ["categoryInput", "typeInput", "subCategoryInput"].includes(
          caller.id
        ) ||
        caller.id.includes("color")
      ) {
        setTimeout(() => {
          // Parse form to get current item object.
          let currItem = this.item.serialize("bare");
          // If atleast 1 color field filled out, undress then update mannequin.
          if (currItem.color && currItem.color.weights.length > 0) {
            this.mannequin.undressAll().then(() => {
              this.mannequin.dress(currItem);
            });
          }
        }, 100);
      }
    });

    document.documentElement.addEventListener("click", (event) => {
      const caller = event.target;
      if (caller.id === "submitAddItem") {
        event.preventDefault();
        this.item.post();
        this.notification.centeredToast(
          document.querySelector("div.col-lg-6:nth-of-type(2)"),
          "Item Added!",
          "Item added to your collection.",
          document.querySelector("input[type=color]").value
        );
        setTimeout(() => {
          this.mannequin.undressAll();
          this.refresh.fullReset();
        }, 30);
      }
    });
  }
}

export default PageAddItem;
