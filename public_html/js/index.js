/**
 * ─── APPARELL ──────────────────────────────────────────────────
 *
 * @author Christian P. Byrne
 *
 * @todo handling of variable data type on size field of add item.
 * @todo add defined styles select array and tooltip from website.
 *
 *
 */

const PORT = 5000;
const IP = "127.0.0.1";
const BASE_URL = `http://${IP}:${PORT}`;

//
// ─── TEMPORARY GLOBALS ──────────────────────────────────────────────────────────
//

function appendUser(data) {
  if (sessionStorage.getItem("username")) {
    data["username"] = sessionStorage.getItem("username");
  }
}

const curUser = () => {
  // return encodeURIComponent(sessionStorage.getItem("username"));
  return sessionStorage.getItem("username");
};

const pushPage = (url = "/home.html") => {
  window.location = url;
};

function clearAllInputs() {
  let inputs = document.querySelectorAll("input");
  for (let input of inputs) {
    if (!input.type === "search") {
      input.value = input.placeholder ? input.placeholder : "";
    }
  }
}

//
// ─── FEATURES ───────────────────────────────────────────────────────────────────
//

class AddOutfit {
  constructor(options) {
    let config = {
      usernameQueryHandler: curUser,
      URL: BASE_URL,
    };
    Object.assign(config, options);
    this.curUser = config.usernameQueryHandler;
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
  constructor(options) {
    let config = {
      usernameQueryHandler: curUser,
      URL: BASE_URL,
    };
    Object.assign(config, options);

    this.config = config;
    this.curUser = config.usernameQueryHandler;
    this.fields = [
      "description",
      "rating",
      "category",
      "subCategory",
      "type",
      "fit",
      "length",
      "brand",
      "purchaseLocation",
      "purchaseDate",
      "cost",
      "condition",
      "washType",
    ];
    this.CSVfields = ["style"];
    this.form = new FormParse();
    this.genIterableIds = (range, suffix) => {
      const ret = [];
      for (let i = range; i > 0; i--) {
        ret.push(`${suffix}${i}`);
      }
      return ret;
    };
    this.mats = {
      materials: this.genIterableIds(4, "mat"),
      weights: this.genIterableIds(4, "matWeight"),
    };
    this.col = {
      colors: this.genIterableIds(6, "color"),
      weights: this.genIterableIds(6, "colorWeight"),
    };

    /** Read and construct into Item shape. */
    this.serialize = () => {
      const ret = {
        ...this.form.read(this.fields),
        ...this.form.readCSV(this.CSVfields),
        size: {
          number: this.form.inputsToArray(["numberSizing1", "numberSizing2"]),
          letter: document.querySelector("#letterSizingInput").value,
        },
        material: this.form.readArrayFields(this.mats),
        color: this.form.readArrayFields(this.col),
      };
      return ret;
    };
  }

  post = () => {
    const ajaxOptions = {
      url: `${this.config.URL}/post/item/${this.curUser()}`,
      type: "POST",
      data: this.serialize(),
      success: () => {},
      error: () => {},
    };
    $.ajax(ajaxOptions);
  };
}

class Search {
  constructor(responseHandler, options) {
    let config = {
      usernameQueryHandler: curUser,
      resultsSelector: "div.searchResultCard",
      URL: BASE_URL,
    };
    Object.assign(config, options);

    this.URL = config.URL;
    this.curUser = config.usernameQueryHandler;
    this.result = config.resultsSelector;

    this.keywordNodeQuery = () => {
      return document
        .querySelector("#searchAll")
        .querySelector("input[type=search]").value;
    };

    this.responseHandler = responseHandler;
  }

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

  validateFieldSelected = async () => {
    if (!document.querySelector("#filterDropdownChoice").getAttribute("data")) {
      this.popoverAlert();
      return false;
    } else {
      return true;
    }
  };

  popoverAlert = () => {
    const location = document.querySelector("#filterDropdownButton");
    let popover = new bootstrap.Popover(location, {
      title: "Select a Filter Type First",
      content:
        "Or search all fields using the other search bar at the top of the page.",
      placement: "top",
      trigger: "focus",
    });
    const killPopover = () => {
      popover.dispose();
      location.removeEventListener("mouseover", killPopover);
    };
    location.addEventListener("mouseover", killPopover);
    setTimeout(() => {
      popover.show();
    }, 10);
  };

  /**
   *
   * @returns {Promise<Item[]>}
   */
  keywordAllFields = async () => {
    return $.get(
      `${this.URL}/search/all/${this.curUser()}/${this.keywordNodeQuery()}`,
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
   * If there are already search results displayed, then only
   * eliminate active results.If there are no results
   * displayed (first search or recently cleared),
   * peform a new query.
   */
  keywordOneField = async () => {
    return this.validateFieldSelected().then((validated) => {
      if (!validated) {
        return;
      } else {
        const active = this.currentResults();
        const ajaxOptions = {
          url: `${this.URL}/search/field`,
          type: "POST",
          data: {
            username: this.curUser(),
            keyword: document.querySelector("#filterSearchInput").value,
            field: document
              .querySelector("#filterDropdownChoice")
              .getAttribute("data"),
          },
          success: (searchResults) => {
            return searchResults;
          },
          error: (reason) => {
            console.log(reason);
          },
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

  clearResults = async () => {
    while (document.querySelectorAll(this.result).length > 0) {
      document.querySelector(this.result).remove();
    }
    return;
  };
}

class User {
  constructor(options) {
    let config = {
      URL: "http://127.0.0.1:5000",
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
    this.URL = config.URL;
    this.config = config;
    this.redirect = pushPage; // TODO

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
      const node = document.querySelector(selector);
      return node ? node.value : false;
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
    for (const [field, inputIds] of Object.entries(arrayObject)) {
      ret[field] = this.inputsToArray(inputIds);
    }
    return ret;
  };

  inputsToArray = (fields, queryHandler = this.v) => {
    const ret = [];
    for (const input of fields) {
      let value = queryHandler(`#${input}Input`);
      if (value) {
        ret.push(value);
      }
    }
    return ret;
  };

  readKeyValue = (keyArray, valueArray, queryHandler = this.v) => {
    const ret = {};
    const keys = this.inputsToArray(keyArray, queryHandler);
    const values = this.inputsToArray(valueArray, queryHandler);
    keys.forEach((field, index) => {
      if (field && index < values.length) {
        ret[field] = values[index];
      }
    });
    return ret;
  };

  read = (fields, queryHandler = this.v) => {
    const serialized = {};
    for (const field of fields) {
      serialized[field] = queryHandler(`#${field}Input`);
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

class Templates {
  constructor() {
    this.tabCategories = [
      "tshirt",
      "pants",
      "shorts",
      "innerwear",
      "sweater",
      "outerwear",
      "formal",
      "shoes",
      "accessories",
      "shirt",
    ];
    this.placeholder = "https://via.placeholder.com/800";
    this.fallbackNode = document.querySelector("#otherSearchResults");
  }

  tabContainers = () => {
    const ret = {};
    for (const tabName of this.tabCategories) {
      ret[tabName] = document.querySelector(`#${tabName}SearchResults`);
    }
    return ret;
  };

  permutate = (word) => {
    const alpha = Array.from("abcdefghijklmnopqrstuvwxyz");
    const ret = [];
    for (let i = word.length; i > 0; i--) {
      let before = word.slice(0, i - 1);
      let after = word.slice(i);
      for (const letter of alpha) {
        ret.push(before + letter + after);
      }
    }
    return ret;
  };

  permutateMatch = (word, ref) => {
    const wordP = permutate(word);
    const refP = permutate(ref);
    for (const candidate of refP) {
      if (wordP.includes(candidate)) {
        return candidate;
      }
    }
    return false;
  };

  getClosestMatch = (tArray, keyword) => {
    let target = keyword.toLowerCase();
    if (tArray.includes(target)) {
      return keyword;
    }
    try {
      while (target.length > 0) {
        for (const candidate of tArray) {
          let result =
            permutateMatch(target, candidate) ||
            permutateMatch(target.slice(1), candidate);
          if (result) {
            return result;
          }
        }
        target = target.slice(0, target.length - 1);
      }
    } catch (error) {
      return "other";
    }
    return "other";
  };

  categoryTabs = (items) => {
    let containers = this.tabContainers();
    for (const item of items) {
      console.log("Item category", item.category);
      let belongsToId = this.getClosestMatch(this.tabCategories, item.category);
      let belongsToNode = containers[belongsToId] || this.fallbackNode;
      console.log("belongstoId -----", belongsToId);
      console.log("belongsToNode ----", belongsToNode);
      this.itemCards([item], belongsToNode).then(() => {});
    }
    this.activateMostPopulated(Object.values(containers));
    // active.parentElement.parentElement.classList.add("show", "active");
  };

  activateMostPopulated = (containers) => {
    const lengths = containers.map((node) => node.children.length);
    const retI = lengths.indexOf(Math.max(...lengths));
    const pageNode = containers[retI].parentElement.parentElement;
    const navTab = document.querySelector(
      `#${pageNode.id.replace("Page", "Tab")}`
    );
    setTimeout(() => {
      navTab.click();
    }, 10);
  };

  itemCards = async (items, container) => {
    for (const item of items) {
      let card = document.createElement("div");
      card.classList.add("col-sm-6");
      card.classList.add("searchResultCard");
      card.innerHTML = `  <div class="card mb-3" data="${
        item._id
      }" style="max-width: 540px;">
          <div class="row g-0">
          <div class="col-md-4">
          <img src="${
            this.placeholder
          }" class="img-fluid rounded-start" alt="Picture of ${
        item.description
      }">
          <div class="container-fluid p-2">
          <div class="row d-flex justify-content-center">
          <p class="card-text"><small class="text-muted">Purchased at ${
            item.purchaseLocation
          } ${
        item.purchaseDate ? item.purchaseDate.toString() + " days ago" : ""
      }</small></p>
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
          <li class="list-group-item">${
            item.size.letter ? "Size " + item.size.letter + " | " : ""
          }  ${
        item.size.number.length > 1
          ? item.size.number[0].toString() + "x" + item.size.number[1]
          : ""
      }</li>
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
  };
}

//
// ─── PAGES ──────────────────────────────────────────────────────────────────────
//

class PageAddOutfit {
  constructor() {
    this.outfit = new AddOutfit();
    this.search = new Search();

    document.documentElement.addEventListener("click", (event) => {
      const caller = event.target;
      if (
        caller.tagName === "A" &&
        caller.parentElement.parentElement.id === "filterDropdownChoice"
      ) {
        event.preventDefault();
        this.handleFilterTypeChange(caller);
      } else if (caller.id === "clearResultsInput") {
        this.search.clearResults();
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
    const placeholder = "https://via.placeholder.com/800";
    const container = document.querySelector("#searchResultsMain");

    this.search.clearResults().then(() => {
      for (const item of json) {
        let card = document.createElement("div");
        card.classList.add("col-sm-6");
        card.classList.add("searchResultCard");
        card.innerHTML = `  <div class="card mb-3" data="${
          item._id
        }" style="max-width: 540px;">
          <div class="row g-0">
          <div class="col-md-4">
          <img src="${placeholder}" class="img-fluid rounded-start" alt="Picture of ${
          item.description
        }">
          <div class="container-fluid p-2">
          <div class="row d-flex justify-content-center">
          <p class="card-text"><small class="text-muted">Purchased at ${
            item.purchaseLocation
          } ${
          item.purchaseDate ? item.purchaseDate.toString() + " days ago" : ""
        }</small></p>
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
          <li class="list-group-item">${
            item.size.letter ? "Size " + item.size.letter + " | " : ""
          }  ${
          item.size.number.length > 1
            ? item.size.number[0].toString() + "x" + item.size.number[1]
            : ""
        }</li>
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

class PageAddItem {
  constructor() {
    this.item = new AddItem();

    document.documentElement.addEventListener("click", (event) => {
      const caller = event.target;
      if (caller.id === "submitAddItem") {
        event.preventDefault();
        this.item.post();
      }
    });
  }
}

class PageWardrobe {
  constructor() {
    this.search = new Search();
    this.templates = new Templates();

    this.displaySearchRes = (json) => {
      const container = document.querySelector("#searchResultsMain");

      this.search.clearResults().then(() => {
        this.templates.categoryTabs(json, container);
      });
    };

    setTimeout(() => {
      this.search.allItems().then((items) => {
        this.displaySearchRes(items);
      });
    }, 20);
  }
}

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

//
// ─── INJECT ─────────────────────────────────────────────────────────────────────
//

const globalAppListeners = () => {
  // Apply these handlers to every page of app:
  document.documentElement.addEventListener("click", (event) => {
    const caller = event.target;
    if (caller.id === "clearForm") {
      clearAllInputs();
    }
  });
};

window.onload = () => {
  globalAppListeners();
  if (window.location.pathname.includes("/add/outfit")) {
    new PageAddOutfit();
  } else if (window.location.pathname.includes("/add/item")) {
    new PageAddItem();
  } else if (window.location.pathname.includes("/wardrobe")) {
    new PageWardrobe();
  } else {
    // ROOT PATH.
    new PageEntry();
  }
};

export { appendUser, BASE_URL, pushPage };
