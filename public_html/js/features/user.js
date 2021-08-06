/**
 * User/Login/Registration/Account Handlers.
 *
 * From: Aug 2021
 * Project: Apparel
 *
 * @exports User
 * @author Christian P. Byrne
 *
 */

import FormParse from "./../utils/form-parse.js";
import Notifications from "./../features/notifications.js";
import { BASE_URL } from "./../constants.js";
import { curUser } from "./../global-handlers.js";

/**
 * @class
 * @implements {FormParse}
 * @implements {FormData}
 * @param {object} options - Fields, handlers, query functions.
 * @property {() => string} curUser
 * @property {string} URL
 *
 */
class User {
  constructor(options) {
    let config = {
      URL: BASE_URL,
      registerRedirect: "/register",
      loginRedirect: "/wardrobe",
      loginNodes: {
        username: "loginEmail",
        password: "loginPassword",
      },
      registerNodes: {
        username: "registerEmail",
        password: "registerPassword",
      },
      curUser: curUser,
    };
    Object.assign(config, options);
    Object.assign(this, config);

    this.redirect = (url = "/wardrobe") => {
      window.location = url;
    };
    this.genIterableIds = (range, suffix) => {
      const ret = [];
      for (let i = 1; i <= range; i++) {
        ret.push(`${suffix}${i}`);
      }
      return ret;
    };
    this.col = {
      colors: this.genIterableIds(6, "color"),
      weights: this.genIterableIds(6, "colorWeight"),
    };
    this.fields = [
      "bio",
      "favCategory",
      "favType",
      "favBrand",
      "age",
      "weight",
      "height",
      "pantSize",
      "shoeSize",
      "favStyles",
    ];
    this.form = new FormParse();
    this.v = (selector) => {
      return document.querySelector(`#${selector}`).value;
    };
    this.ajaxConfig = {
      type: "POST",
      error: (reason) => {
        console.log(reason);
      },
    };
    this.successHandler = (usernameNodeId, redirectURL) => {
      sessionStorage.setItem("username", this.v(usernameNodeId));
      this.redirect(redirectURL);
    };
  }

  /**
   *
   * @returns {FormData}
   */
  serialize = () => {
    const ret = {
      ...this.form.read(this.fields),
      size: {
        number: this.form.inputsToArray(["numberSizing1", "numberSizing2"]),
        letter: document.querySelector("#letterSizingInput").value,
      },
      favColors: this.form.readWeighted(this.col),
    };
    const multipartData = new FormData();
    multipartData.append(
      "image",
      document.querySelector("#imageInput").files[0]
    );
    for (const [key, value] of Object.entries(ret)) {
      multipartData.append(key, value);
    }
    return multipartData;
  };

  /**
   * Post new user data from account customization page.
   */
  profilePost = () => {
    const ajaxOptions = {
      url: `${this.URL}/user/details/${this.curUser()}`,
      type: "POST",
      enctype: "multipart/form-data",
      processData: false,
      contentType: false,
      cache: false,
      data: this.serialize(),
      success: () => {},
      error: () => {},
    };
    $.ajax(ajaxOptions);
  };

  /**
   *
   * @param {string} gender
   */
  updateGender = (gender) => {
    let ajaxOptions = {
      url: `${this.URL}/user/gender/`,
      type: "POST",
      data: {
        username: sessionStorage.getItem("username"),
        gender: gender,
      },
      success: () => {
        sessionStorage.setItem("gender", gender);
      },
      error: (reason) => {
        console.error(reason);
      },
    };
    $.ajax(ajaxOptions);
  };

  request = {
    /**
     * Login handler.
     */
    login: () => {
      const ajaxOptions = {
        url: `${this.URL}/login`,
        data: {
          username: this.v(this.loginNodes.username),
          password: this.v(this.loginNodes.password),
        },
        success: (response) => {
          if (response === true) {
            this.successHandler(this.loginNodes.username, this.loginRedirect);
          } else {
            let notify = new Notifications();
            notify.toast(
              document.querySelector("div.row"),
              "Oops",
              "Incorrect username/password combination.",
              "#800f2f",
              false
            );
          }
        },
      };
      Object.assign(ajaxOptions, this.ajaxConfig);
      $.ajax(ajaxOptions);
    },

    /**
     * Registration handler.
     */
    register: () => {
      const ajaxOptions = {
        url: `${this.URL}/register`,
        data: {
          username: this.v(this.registerNodes.username),
          password: this.v(this.registerNodes.password),
        },
        success: () => {
          this.successHandler(
            this.registerNodes.username,
            this.registerRedirect
          );
        },
      };
      Object.assign(ajaxOptions, this.ajaxConfig);
      $.ajax(ajaxOptions);
    },
  };
}

export default User;
