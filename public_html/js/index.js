/**
 * 
 * @author Christian P. Byrne 
 */

const PORT = 5000;
const IP = "127.0.0.1"
const BASE_URL = `http://${IP}:${PORT}`;

/**
 * 
 * @param {*} data 
 */
const appendUser = (data) => {
    if ( sessionStorage.getItem("login")) {
        data["username"] = sessionStorage.getItem("login")
    }
}

/**
 * Go to new page.
 */
const pushPage = (url="/home.html") => {
  window.location = url;
};


export { appendUser, BASE_URL, pushPage }