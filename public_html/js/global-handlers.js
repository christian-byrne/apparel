/**
 * Global Cross-App Listeners.
 * 
 * From: Aug 2021
 * Project: Apparel
 * 
 * @exports globalAppListeners
 * @author Christian P. Byrne
 *
 */


/**
 * Binds global listeners.
 */
const globalAppListeners = () => {
  document.documentElement.addEventListener("submit", (event) => {
    const caller = event.target;
    const globalSearch = document.querySelector("header input[type='search']")
    event.preventDefault()
    if (caller == globalSearch || globalSearch.parentElement && caller == globalSearch.parentElement) {
      event.preventDefault();
      for ( const page of ["/add/outfit", "/help", "/import", "/add/item", "/wardrobe", "/outfits", "/register"]) {
        if ( page.includes(globalSearch.value) || globalSearch.value.includes(page) ) {
          window.location = page;
        }
      }
      // TODO: search feature defaults to searching wardrobe or. . .?
      window.location = "/wardrobe"
    }
  });


	document.documentElement.addEventListener("click", (event) => {
		if ( event.target.id === "logout-button") {
			if ( sessionStorage.getItem("username") ) {
			sessionStorage.removeItem("username");
			}
		setTimeout(() => {
		window.location = "/";
		}, 20)
			}

	});

  // Update manequin gender.
  if (gender() && gender() === "female" && !window.location.pathname.includes("/register")) {
    let images = document.querySelectorAll(".mask-outlines > img");
    for (const img of images) {
      let curSrc = img.src;
      console.log(curSrc);
      curSrc = curSrc.replace(/male/g, "female");
      console.log(curSrc);
      img.src = curSrc;
    }
  }
};

//
// ─── TEMPORARY GLOBALS ──────────────────────────────────────────────────────────
//

/**
 * 
 * Appends username to FormData
 * @param {FormData} data 
 */
function appendUser(data) {
  if (sessionStorage.getItem("username")) {
    data.append("username", sessionStorage.getItem("username"));
  }
}

/**
 * 
 * @returns {string} Gender of current user.
 */
const gender = () => {
  let seshGender = sessionStorage.getItem("gender");
  if (seshGender) {
    return seshGender;
  }
  for (const img of document.querySelectorAll(".mask-outlines > img")) {
    if (img.src && img.src.includes("female")) {
      return "female";
    }
  }
  return "male";
};

/**
 * 
 * @returns {string} Username is session storage.
 */
const curUser = () => {
  // return encodeURIComponent(sessionStorage.getItem("username"));
  return sessionStorage.getItem("username");
};


export { globalAppListeners, appendUser, gender, curUser };
