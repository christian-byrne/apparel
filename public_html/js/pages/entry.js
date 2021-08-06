/**
 * Entry Page Listeners
 *
 * From: Aug 2021
 * Project: Apparel
 *
 * @exports PageEntry
 * @author Christian P. Byrne
 *
 */

import User from "./../features/user.js";

/**
 * @class
 * Entry Page Functions.
 *
 * @implements {User}
 * @listens document#click
 *
 *
 */
class PageEntry {
  constructor() {
    this.user = new User();

    document.documentElement.addEventListener("click", (event) => {
      const caller = event.target;
      if (caller.tagName === "BUTTON" && caller.innerHTML.includes("Sign up")) {
        event.preventDefault();
        this.user.request.register();
      } else if (
        caller.tagName === "BUTTON" &&
        caller.innerHTML.includes("Login")
      ) {
        event.preventDefault();
        this.user.request.login();
      }
    });
  }
}

export default PageEntry;
