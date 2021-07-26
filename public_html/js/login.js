const BASE_URL = "http://127.0.0.1:5000";

/**
 * Go to home page on successful login or registration.
 */
const pushPage = () => {
  window.location = "/home.html";
};

/**
 * Handle register/login error responses from server.
 */
const handleError = () => {
  // Temporary:
  alert("error registering");
};


/**
 * Handle form submits on login/register forms.
 * 
 * @param {string} formType - "login" | "register" 
 */
const formSubmitHandler = (formType) => {
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
      pushPage();
    },
    error: (reason) => {
      handleError();
    },
  };
  $.ajax(ajaxOptions);
};


/** Bind listeners structure. */
window.onload = () => {
    document.documentElement.addEventListener("click", (event) => {
        const caller = event.target;

        if ( caller.tagName === "BUTTON" && caller.innerHTML.includes("Sign up")) {
            formSubmitHandler("register")
        }
        else if ( caller.tagName === "BUTTON" && caller.innerHTML.includes("Login")) {
            formSubmitHandler("login")
        }
    
    })
}