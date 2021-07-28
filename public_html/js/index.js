/**
 *
 * @author Christian P. Byrne
 */

const PORT = 5000;
const IP = "127.0.0.1";
const BASE_URL = `http://${IP}:${PORT}`;

// TODO differentiate sizing type
const styles = [];

const appendUser = (data) => {
  if (sessionStorage.getItem("username")) {
    data["username"] = sessionStorage.getItem("username");
  }
};

const curUser = () => {
  // return encodeURIComponent(sessionStorage.getItem("username"));
  return sessionStorage.getItem("username");
};

const pushPage = (url = "/home.html") => {
  window.location = url;
};

const clearAllInputs = () => {
  let inputs = document.querySelectorAll("input");
  for (let input of inputs) {
    if (!input.type === "search") {
      input.value = input.placeholder ? input.placeholder : "";
    }
  }
};

// ────────────────────────────────────────────────────────────────────────────────

class AddOutfit {
  constructor() {
    let config = {
      usernameQueryHandler: curUser,
      URL: BASE_URL,
    };
    Object.assign(config, options);
    this.curUser = config.curUser;
    this.form = new FormParse();
    this.fields = [
      "description",
      "rating",
      "category",
      "subCategory",
      "type",
      "lastWorn",
      "wearCount",
      "temperature",
      "notes",
    ];
    this.arrayFields = {
      weather: [
        "weatherRain",
        "weatherSnow",
        "weatherSun",
        "weatherWindy",
        "weatherHumid",
      ],
    };
    this.CSVfields = ["formality", "setting", "event"];
  }

  serialize = () => {
    const inputs = {
      ...this.form.read(this.fields),
      ...this.form.readArrayFields(this.arrayFields),
      ...this.form.readCSV(this.CSVfields),
    };
    return inputs;
  };

  postOutfit = () => {
    const ajaxOptions = {
      url: `${this.URL}/post/outfit/${this.curUser()}`,
      type: "POST",
      data: this.serialize(),
      success: () => {},
      error: () => {},
    };
    $.ajax(ajaxOptions);
  };
}

class AddItem {
  constructor() {
    let config = {
      usernameQueryHandler: curUser,
      URL: BASE_URL,
    };
    Object.assign(config, options);
    this.curUser = config.curUser;
    this.fields = [
      "description",
      "rating",
      "category",
      "subCategory",
      "type",
      "fit",
      "length",
      "numberSizing",
      "letterSizing",
      "brand",
      "purchaseLocation",
      "purchaseDate",
      "cost",
      "condition",
      "washType",
      "mat1",
      "mat2",
      "mat3",
    ];

    this.form = new FormParse();
    this.serialize = () => {
      return this.form.read(this.fields);
    };
  }

  post = () => {
    const ajaxOptions = {
      url: `${this.URL}/post/item/${this.curUser()}`,
      type: "POST",
      data: this.serialize(),
      success: () => {},
      error: () => {},
    };
    $.ajax(ajaxOptions);
  };
}

class Search {
  constructor(options) {
    let config = {
      usernameQueryHandler: curUser,
      resultsSelector: "div.card",
    };
    Object.assign(config, options);

    this.curUser = config.curUser;
    this.result = config.resultsSelector;

    this.keywordNodeQuery = () => {
      return document
        .querySelector("#searchAll")
        .querySelector("input[type=search]").value;
    };
  }

  /**
   *
   * @returns {Promise<Item[]>}
   */
  allItems = async () => {
    return $.get(`${BASE_URL}/get/items/${this.curUser()}`, (items) => {
      return items;
    });
  };

  /**
   *
   * @returns {Promise<Outfit[]>}
   */
  allOutfits = async () => {
    return $.get(`${BASE_URL}/get/outfits/${this.curUser()}`, (outfits) => {
      return outfits;
    });
  };

  /**
   *
   * @returns {Promise<Item[]>}
   */
  keywordAllFields = async () => {
    return $.get(
      `${BASE_URL}/search/all/${curUser()}/${this.keywordNodeQuery()}`,
      (searchResults) => {
        return searchResults;
      }
    );
  };

  currentResults = () => {
    const ret = [];
    for (const card of document.querySelectorAll(this.result)) {
      if (card.data) {
        ret.push(card.data);
      }
    }
    return ret;
  };

  /**
   * If there are already search results displayed, then only eliminate active results.
   * If there are no results displayed (first search or recently cleared), peform a new
   * query.
   */
  postSearchTargeted = () => {
    const currentResults = activeItems();
    const ajaxOptions = {
      url: `${BASE_URL}/search/field`,
      type: "POST",
      data: {
        username: curUser(),
        keyword: g("#filterSearchInput"),
        field: document.querySelector("#filterDropdownChoice").data,
      },
      success: (searchResults) => {
        displaySearchRes(searchResults);
      },
      error: () => {},
    };

    // Narrowing down currently displayed results.
    if (currentResults.length > 0) {
      Object.assign(ajaxOptions, {
        url: `${BASE_URL}/search/intersection`,
      });
      ajaxOptions.data["narrowTarget"] = currentResults;
    }

    $.ajax(ajaxOptions);
  };

  clearSearchResults = async () => {
    while (document.querySelectorAll("div.card")) {
      document.querySelector("div.card").remove();
    }
    return;
  };

  displaySearchRes = (json) => {
    const placeholder = "https://via.placeholder.com/800";
    const container = document.querySelector("#searchResultsMain");

    clearSearchResults().then(() => {
      for (const item of json) {
        let card = document.createElement("div");
        card.classList.add("col-sm-6");
        card.innerHTML = `  <div class="card mb-3" data="${item._id}" style="max-width: 540px;">
      <div class="row g-0">
      <div class="col-md-4">
      <img src="${placeholder}" class="img-fluid rounded-start" alt="Picture of ${item.description}">
      <div class="container-fluid p-2">
      <div class="row d-flex justify-content-center">
      <p class="card-text"><small class="text-muted">Purchased at ${item.purchaseLocation} ${item.purchaseDate} days ago.</small></p>
      </div>
      </div>
      </div>
      <div class="col-md-8">
      <div class="card-body">
      <h5 class="card-title">${item.description}</h5>
      <p class="card-text">
      ${item.category} | ${item.subCategory} | ${item.type}
      </p>
      </div>
      <ul class="list-group list-group-flush">
      <li class="list-group-item">${item.brand}</li>
      <li class="list-group-item">${item.fit}</li>
      <li class="list-group-item">${item.size}</li>
      </ul>
      <div class="card-body">
      <p class="card-text">${item.length}</p>
      <a data="${item._id}" class="btn btn-primary">Add</a>
      <a class="card-link">Dismiss</a>
      </div>
      </div>
      </div>
      </div>`;
        container.appendChild(card);
      }
    });
  };
}

class User {
  constructor(options) {
    let config = {
      URL: "127.0.0.1:5000",
      registerRedirect: "/add/item",
      loginRedirect: "/home",
      loginNodes: {
        username: "loginEmail",
        password: "loginPassword",
      },
      registerNodes: {
        username: "registerEmail",
        password: "registerPassword",
      },
    };
    Object.assign(config, options);
    this.URL = config.url;
    this.config = config;
    this.redirect = pushPage; // TODO

    this.v = (selector) => {
      return document.querySelector(selector).value;
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

  request = {
    login: () => {
      const ajaxOptions = {
        url: `${this.URL}/login`,
        data: {
          username: this.v(this.config.loginNodes.username),
          password: this.v(this.config.loginNodes.password),
        },
        success: () => {
          this.successHandler(
            this.config.loginNodes.username,
            this.config.loginRedirect
          );
        },
      };
      Object.assign(ajaxOptions, this.ajaxConfig);
      $.ajax(ajaxOptions);
    },

    register: () => {
      const ajaxOptions = {
        url: `${this.URL}/register`,
        data: {
          username: this.v(this.config.registerNodes.username),
          password: this.v(this.config.registerNodes.password),
        },
        success: () => {
          this.successHandler(
            this.config.registerNodes.username,
            this.config.registerRedirect
          );
        },
      };
      Object.assign(ajaxOptions, this.ajaxConfig);
      $.ajax(ajaxOptions);
    },
  };
}

class FormParse {
  constructor() {
    this.v = (selector) => {
      return document.querySelector(selector).value;
    };

    this.format = (inputVal) => {
      return inputVal.trim().toLowerCase();
    };
  }

  /**
   * Handle register/login error responses from server.
   */
  handleError = () => {
    // Temporary:
    alert("error registering");
  };

  /**
   *
   * @param {{[property: string] : string[]}} arrayObject Object in which the
   *  keys are kept the same but the associated array values are used to collect
   *  the input data for (using the query selector func of instance) and mapped
   *  into a new array.
   *
   */
  readArrayFields = (arrayObject) => {
    const ret = {};
    for (const [field, inputIds] of arrayObject) {
      ret[field] = this.inputsToArray(inputIds);
    }
  };

  inputsToArray = (fields, queryHandler = this.v) => {
    const ret = [];
    for (const input of fields) {
      let value = queryHandler(`#${weather}Input`);
      if (value) {
        ret.push(value);
      }
    }
    return ret;
  };

  read = (fields, queryHandler = this.v) => {
    const serialized = {};
    for (const input of fields) {
      serialized[input] = queryHandler(`#${field}Input`);
    }
    return serialized;
  };

  readCSV = (fields, queryHandler = this.v, formatHandler = this.format) => {
    const ret = {};
    const serialized = this.read(fields, queryHandler);

    for (const [field, value] of Object.entries(serialized)) {
      let split = value.split(",");
      let formatted = [];
      split.forEach((input) => {
        formatted.push(formatHandler(input));
      });
      ret[field] = formatted;
    }
    return ret;
  };
}

// ────────────────────────────────────────────────────────────────────────────────

window.onload = () => {
  // Apply these handlers to every page of app:
  document.documentElement.addEventListener("submit", (event) => {
    const caller = event.target;
    if (caller.id === "searchAll") {
      event.preventDefault();
      getSearchAll();
    }
  });
  document.documentElement.addEventListener("click", (event) => {
    const caller = event.target;
    if (caller.id === "clearForm") {
      clearAllInputs();
    }
  });

  if (window.location.pathname.includes("/add/outfit")) {
    document.documentElement.addEventListener("click", (event) => {
      const caller = event.target;
      if (
        caller.tagName === "A" &&
        caller.parentElement.parentElement.id === "filterDropdownChoice"
      ) {
        event.preventDefault();

        // When a new choice is selected, set data of ul.
        let choice = caller.innerHTML;
        let ul = caller.parentElement.parentElement;
        console.log(ul);
        ul.setAttribute("data", choice);
        setTimeout(() => {
          document.querySelector("#filterDropdownButton").innerHTML = choice;
          document.querySelector(
            "#filterSearchInput"
          ).placeholder = `Enter ${choice.toLowerCase()} to add filter...`;
        }, 10);
      }
    });
  } else if (window.location.pathname.includes("/add/item")) {
    document.documentElement.addEventListener("click", (event) => {
      const caller = event.target;
      if (caller.id === "submitAddItem") {
        event.preventDefault();
        postItem();
      }
    });
  } else if (window.location.pathname.includes("/wardrobe")) {
    document.documentElement.addEventListener("click", (event) => {
      const caller = event.target;

      if (caller.tagName === "BUTTON") {
        getItems().then((res) => {
          console.log(res);
        });
      }
    });
  } else {
    document.documentElement.addEventListener("click", (event) => {
      const caller = event.target;

      if (caller.tagName === "BUTTON" && caller.innerHTML.includes("Sign up")) {
        event.preventDefault();
        postUser("register");
      } else if (
        caller.tagName === "BUTTON" &&
        caller.innerHTML.includes("Login")
      ) {
        event.preventDefault();
        postUser("login");
      }
    });
  }
};

export { appendUser, BASE_URL, pushPage };
