/**
 * Registration Page Listeners
 *
 * From: Aug 2021
 * Project: Apparel
 *
 * @exports PageRegistration
 * @author Christian P. Byrne
 *
 */

import Mannequin from "./../features/mannequin.js";
import User from "./../features/user.js";
import Notifications from "./../features/notifications.js";
import ColorRotator from "./../utils/animate.js";

/**
 * @class
 *
 * @implements {Mannequin}
 * @implements {User}
 * @implements {Notifications}
 * @implements {ColorRotator}
 *
 * @property {Mannequin} male
 * @property {Mannequin} female
 *
 * @listens document#click
 *
 *
 */
class PageRegistration {
  constructor() {
    this.male = new Mannequin("div.mask-outlines:nth-of-type(1)", "male");
    this.female = new Mannequin("div.female", "female");
    this.user = new User();
    this.notify = new Notifications();

    document.documentElement.addEventListener("click", (event) => {
      const caller = event.target;
      const callerCss = Array.from(caller.classList);
      const id = caller.id;

      if (id === "femaleInput" || id === "maleInput") {
        this.notify.toast(
          document.querySelector("div.row:nth-of-type(2)"),
          "Preferences Updated",
          "The other fields are optional. Click the submit button whenver you want to proceed.",
          "#dee2ff",
          false
        );
        this.user.updateGender(`${id == "femaleInput" ? "female" : "male"}`);
      } else if (id === "submitFinal") {
        event.preventDefault();
        window.location = "/add/item";
      }
    });

    setTimeout(() => {
      this.male.addProp("pants", "#121212");
      this.male.addProp("shirt", "#b3b3b3");
      this.male.addProp("shoes", "#000000");
      this.female.addProp("jumpsuit", "#5673B7");
      this.female.addProp("shoes", "#96736A");
      setTimeout(() => {
        let propList = this.male.maskLayers();
        this.maleRotator = new ColorRotator(propList);
        propList = this.female.maskLayers();
        this.femaleRotator = new ColorRotator(propList);
        this.maleRotator.init();
      }, 100);
    }, 575);
  }
}

export default PageRegistration;
