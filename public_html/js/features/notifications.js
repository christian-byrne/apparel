/**
 * Notification Handlers & Constructors.
 *
 * From: Aug 2021
 * Project: Apparel
 *
 * @exports Notifications
 * @author Christian P. Byrne
 *
 */

/**
 * Notifications constructors/handlers.
 * @param {object} options
 * @class
 */
class Notifications {
  constructor(options) {
    let config = {};
    Object.assign(config, options);
    Object.assign(this, config);
  }

  /**
   * Create toast notification with only a title and message.
   * @param {HTMLElement} container
   * @param {string} message
   */
  minimialToast = (container, message) => {
    const toastEl = this.constructToast();
    toastEl.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">
          ${message}
        </div>
        <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>`;
    container.prepend(toastEl);
    this.initializeToast(toastEl);
  };

  /**
   * @private
   * @param {HTMLDivElement} toastEl
   */
  initializeToast = (toastEl) => {
    setTimeout(() => {
      const toast = new bootstrap.Toast(toastEl, {
        delay: 2000,
        autohide: false,
      });
      setTimeout(() => {
        toast.show();
      }, 10);
    }, 200);
  };

  /**
   * @private
   * @returns {HTMLDivElement}
   */
  constructToast = () => {
    const toastEl = document.createElement("div");
    toastEl.classList.add("toast");
    toastEl.setAttribute("role", "alert");
    toastEl.setAttribute("aria-live", "assertive");
    toastEl.setAttribute("aria-atomic", "true");
    return toastEl;
  };

  /**
   *
   * @param {HTMLElement} container
   * @param {string} title
   * @param {string} message
   * @param {string} color - Hex formatted color.
   */
  centeredToast = (container, title, message, color) => {
    const div = document.createElement("div");
    div.classList.add(
      "pb-5",
      "d-flex",
      "justify-content-center",
      "align-items-center",
      "w-100"
    );
    div.setAttribute("aria-live", "polite");
    div.setAttribute("aria-atomic", "true");
    container.prepend(div);
    this.toast(div, title, message, color);
  };

  /**
   *
   * @param {HTMLElement} container
   * @param {string} title
   * @param {string} message
   * @param {string} color - Hex formatted color.
   * @param {Boolean} prepend - Prepend or append element.
   */
  toast = (container, title, message, color, prepend = true) => {
    const toastEl = this.constructToast();
    toastEl.innerHTML = `<div class="toast-header">
          <div class="rounded me-2 toast-icon" style="background: ${color};"></div>
          <strong class="me-auto">${title}</strong>
          <small>1 min ago</small>
          <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">
          ${message}
        </div>`;
    if (prepend) {
      container.prepend(toastEl);
    } else {
      container.appendChild(toastEl);
    }
    this.initializeToast(toastEl);
  };

  /**
   * Create a popover tooltip and display.
   *
   * @param {HTMLElement} location
   * @param {object} config - Bootstrap popover config object.
   */
  popoverTooltip = async (location, config) => {
    const popover = new bootstrap.Popover(location, config);
    const killPopover = () => {
      popover.dispose();
      location.removeEventListener("mouseover", killPopover);
      document.documentElement.removeEventListener("click", killPopover);
    };
    document.documentElement.addEventListener("click", killPopover);
    location.addEventListener("mouseover", killPopover);
    setTimeout(() => {
      popover.show();
    }, 10);
  };
}

export default Notifications;
