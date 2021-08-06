/**
 * ─── APPARELL ──────────────────────────────────────────────────
 *
 * Main script that constructs imported class instances depending 
 * on window location. Class instances bind listeners and handle
 * events.
 * 
 * @author Christian P. Byrne
 * @module Apparel
 *
 */

import { globalAppListeners } from "./global-handlers.js";
import PageAddOutfit from "./pages/post-outfit.js";
import PageAddItem from "./pages/post-item.js";
import PageWardrobe from "./pages/wardrobe.js";
import PageRegistration from "./pages/register.js";
import PageEntry from "./pages/entry.js";
import PageOutfits from "./pages/outfits.js"

//
// ─── ROUTES ─────────────────────────────────────────────────────────────────────
//

window.onload = () => {
  globalAppListeners();
  let route = window.location.pathname;
  const checkRoute = (path) => {
    return route.includes(path);
  };
  if (checkRoute("/add/outfit")) {
    new PageAddOutfit();
  } else if (checkRoute("/add/item")) {
    new PageAddItem();
  } else if (checkRoute("/wardrobe")) {
    new PageWardrobe();
  } else if (checkRoute("/outfits")) {
    new PageOutfits();
  } else if (checkRoute("/register")) {
    new PageRegistration();
  } else {
    // ROOT PATH.
    if (sessionStorage.getItem("username")) {
      new PageEntry();
      // window.location = "/wardrobe";
    } else {
      new PageEntry();
    }
  }
};
