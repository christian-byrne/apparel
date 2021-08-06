/**
 * Refresh Page Element Handlers.
 *
 * From: Aug 2021
 * Project: Apparel
 *
 * @exports Refresh
 * @author Christian P. Byrne
 *
 */

/**
 * @class
 * Refresher
 * @param {HTMLElement[]} containers - Nodes that should have their
 *     children removed on a refresh.
 * @param {object} options
 * @param {object} options.defaultValues Default values of input elements.
 */
class Refresh {
  constructor(containers, options) {
    let config = {
      defaultValues: {
        text: "",
        number: "",
        date: "",
        file: "",
        color: "#000000",
        search: "",
      },
      exclude: [],
    };
    Object.assign(config, options);
    Object.assign(this, config);

    this.containers = containers || [];
    if (!Array.isArray(containers)) {
      this.containers = [containers];
    } else {
      this.containers = containers;
    }
  }

  /**
   * Scroll to top.
   */
  scrollToTop = () => {
    setTimeout(function () {
      window.scrollTo(0, 0);
    }, 50);
  };

  /**
   * Clear containers member.
   */
  reset = () => {
    for (const container of this.containers) {
      while (container.children.length > 0) {
        container.children[0].remove();
      }
    }
  };

  /**
   * Activate default tab in a tabbed container.
   */
  defaultTab = () => {
    let firstTab = document.querySelector("ul.nav-tabs > li:nth-of-type(1)");
    if (firstTab) {
      firstTab.click();
      if (firstTab.firstElementChild) {
        firstTab.firstElementChild.click();
      }
    }
  };

  /**
   * Clear all inputs and reset value properties to default values.
   */
  clearInputs() {
    let inputs = document.querySelectorAll("input");
    for (let input of inputs) {
      if (Object.keys(this.defaultValues).includes(input.type)) {
        input.value = this.defaultValues[input.type];
      } else {
        input.value = "";
      }
    }
  }

  /**
   * Call all instance methods asynchronously.
   *
   * @returns {Promise<void>}
   */
  fullReset = async () => {
    this.clearInputs();
    this.reset();
    this.defaultTab();
    this.scrollToTop();
    return;
  };
}

export default Refresh;
