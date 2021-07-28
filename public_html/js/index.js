/**
 *
 * @author Christian P. Byrne
 */

const PORT = 5000;
const IP = "127.0.0.1";
const BASE_URL = `http://${IP}:${PORT}`;

const g = (selector) => {
  return document.querySelector(selector).value;
};

/**
 *
 * @param {*} data
 */
const appendUser = (data) => {
  if (sessionStorage.getItem("username")) {
    data["username"] = sessionStorage.getItem("username");
  }
};

const curUser = () => {
  // return encodeURIComponent(sessionStorage.getItem("username"));
  return sessionStorage.getItem("username");
};

/**
 * Handle register/login error responses from server.
 */
const handleError = () => {
  // Temporary:
  alert("error registering");
};

/**
 * Go to new page.
 */
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

const styles = [];
// materials
// differentiate sizing type

const readForm = (fields) => {
  const formInputs = {};
  for (const field of fields) {
    formInputs[field] = g(`#${field}Input`);
  }
  return formInputs;
};

const readFormCSV = (fields) => {
  let serialized = readForm(fields);
  const ret = {};
  for (const [field, value] of Object.entries(serialized)) {
    let split = value.split(",");
    let formatted = [];
    split.forEach((input) => {
      formatted.push(input.trim());
    });
    ret[field] = formatted;
  }
  return ret;
};

const serializeItemForm = () => {
  const fields = [
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
  const formObj = readForm(fields);

  return formObj;
};

const mapWeatherInputs = () => {
  const weatherFields = [
    "weatherRain",
    "weatherSnow",
    "weatherSun",
    "weatherWindy",
    "weatherHumid",
  ];
  const checkedWeathers = [];
  for (const weather of weatherFields) {
    let check = g(`#${weather}Input`);
    if (check) {
      checkedWeathers.push(check);
    }
  }
  return checkedWeathers;
};

const serializeOutfitForm = () => {
  const fields = [
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
  const arrayFields = ["formality", "setting", "event"];
  const formObj = readForm(fields);
  formObj["weather"] = mapWeatherInputs();
  Object.assign(formObj, readFormCSV(arrayFields));
  return formObj;
};

const postItem = () => {
  const ajaxOptions = {
    url: `${BASE_URL}/post/item/${curUser()}`,
    type: "POST",
    data: serializeItemForm(),
    success: () => {},
    error: () => {},
  };
  $.ajax(ajaxOptions);
};

const postOutfit = () => {
  const ajaxOptions = {
    url: `${BASE_URL}/post/outfit/${curUser()}`,
    type: "POST",
    data: serializeOutfitForm(),
    success: () => {},
    error: () => {},
  };
  $.ajax(ajaxOptions);
};

const getItems = async () => {
  return $.get(`${BASE_URL}/get/items/${curUser()}`, (items) => {
    return items;
  });
};

const getOutfits = async () => {
  return $.get(`${BASE_URL}/get/outfits/${curUser()}`, (outfits) => {
    return outfits;
  });
};

/**
 * Handle form submits on login/register forms.
 *
 * @param {string} formType - "login" | "register"
 */
const postUser = (formType) => {
  const ajaxOptions = {
    url: `${BASE_URL}/${formType}`,
    type: "POST",
    data: {
      username:
        formType == "register"
          ? $("#registerEmail").val()
          : $("#loginEmail").val(),
      password:
        formType == "register"
          ? $("#registerPassword").val()
          : $("#loginPassword").val(),
    },
    success: (response) => {
      sessionStorage.setItem("username", $("#registerEmail").val());
      if (formType === "register") {
        pushPage("/add/item");
      } else {
        pushPage("/home");
      }
    },
    error: (reason) => {
      handleError();
    },
  };
  $.ajax(ajaxOptions);
};

const getSearchAll = () => {
  const keyword = document
    .querySelector("#searchAll")
    .querySelector("input[type=search]").value;
  $.get(`${BASE_URL}/search/all/${curUser()}/${keyword}`, (searchResults) => {
    displaySearchRes(searchResults);
  });
};

const displaySearchRes = (json) => {
  const placeholder = "https://via.placeholder.com/800";
  const container = document.querySelector("#searchResultsMain");
  for (const item of json) {
    let card = document.createElement("div");
    card.classList.add("col-sm-6");
    card.innerHTML = `  <div class="card mb-3" style="max-width: 540px;">
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
};

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
      if (caller.id === "submitAddOutfit") {
        event.preventDefault();
        postOutfit();
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
