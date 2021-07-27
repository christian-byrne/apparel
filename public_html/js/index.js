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
    url: `${BASE_URL}/post/item/${sessionStorage.getItem("username")}`,
    type: "POST",
    data: serializeItemForm(),
    success: () => {},
    error: () => {},
  };
  $.ajax(ajaxOptions);
};

const postOutfit = () => {
  const ajaxOptions = {
    url: `${BASE_URL}/post/outfit/${sessionStorage.getItem("username")}`,
    type: "POST",
    data: serializeOutfitForm(),
    success: () => {},
    error: () => {},
  };
  $.ajax(ajaxOptions);
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

window.onload = () => {
  // Apply these handlers to every page of app:
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
