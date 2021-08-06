/**
 * Template Constructors & Loaders.
 *
 * From: Aug 2021
 * Project: Apparel
 *
 * @exports Templates
 * @author Christian P. Byrne
 *
 */

import ClosestMatch from "./../utils/closest-match.js";

/**
 * @class
 * @implements {ClosestMatch}
 * @param {object} options - Fields, handlers, query functions.
 * @property {string[]} tabCategories - Tab names.
 *
 */
class Templates {
  constructor(options) {
    let config = {
      tabCategories: [
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
      ],
      cardClass: "searchResultCard",
      tabApropos: {},
      placeholder: "https://via.placeholder.com/800",
      fallbackNode: document.querySelector("#otherSearchResults"),
      tabContainerSelectorFn: (tabName) => {
        return document.querySelector(`#${tabName}SearchResults`);
      },
      containerSuffix: "Page",
      tabSuffix: "Tab",
    };
    Object.assign(config, options);
    Object.assign(this, config);

    for (const category of this.tabCategories) {
      if (!Object.keys(this.tabApropos).includes(category)) {
        this.tabApropos[category] = category.toString();
      }
    }
    this.matcher = new ClosestMatch(this.tabApropos, false);
  }

  /**
   * @private
   * @returns {HTMLElement[]}
   */
  tabContainers = () => {
    const ret = {};
    for (const tabName of this.tabCategories) {
      ret[tabName] = this.tabContainerSelectorFn(tabName);
    }
    return ret;
  };

  /**
   * @private
   * @param {Item[]} items
   * @param {string} buttonText
   */
  categoryTabs = (items, buttonText) => {
    let containers = this.tabContainers();
    for (const item of items) {
      let belongsToNode;
      if (item.category) {
        let belongsToId = this.matcher.closestApropos(
          item.category.toLowerCase()
        );
        belongsToNode = containers[belongsToId] || this.fallbackNode;
      } else {
        belongsToNode = this.fallbackNode;
      }
      this.itemCards([item], belongsToNode, buttonText).then(() => {});
    }
    this.activateMostPopulated(Object.values(containers));
  };

  /**
   * @private
   * @param {HTMLElement[]} containers
   */
  activateMostPopulated = (containers) => {
    const lengths = containers.map((node) => node.children.length);
    const retI = lengths.indexOf(Math.max(...lengths));
    // TODO - inconsistent.
    const pageNode = containers[retI].parentElement.parentElement;
    const tabNode = document.querySelector(
      `#${pageNode.id.replace(
        this.containerSuffix,
        this.tabSuffix
      )}`
    );
    // Activate by clicking.
    setTimeout(() => {
      tabNode.click();
    }, 10);
  };

  /**
   *
   * @param {Item} item
   * @returns {string} HTML text.
   */
  smartTags = (item) => {
    let ret = "";
    let mainTagOptions = [
      ...item.styles,
      ...item.material.materials,
      item.brand,
    ];
    let secondaryTags = [item.fit, item.length];
    if (mainTagOptions.length > 0) {
      ret += `<span class="badge bg-secondary">${mainTagOptions[0]}</span>`;
    }
    if (mainTagOptions.length > 1) {
      ret += `<span class="badge bg-secondary">${mainTagOptions[1]}</span>`;
    }
    if (secondaryTags.length > 0) {
      ret += `<span class="badge bg-primary text-dark">${secondaryTags[0]}</span>`;
    } else if (mainTagOptions.length > 2) {
      ret += `<span class="badge bg-primary text-dark">${mainTagOptions[2]}</span>`;
    }
    if (secondaryTags.length > 1) {
      ret += `<span class="badge bg-info text-dark">${secondaryTags[1]}</span>`;
    }
    return ret;
  };

  /**
   *
   * @param {Item} item
   * @returns {string}
   */
  coalesceItemTitle = (item) => {
    return item.category
      ? item.category
      : item.subCategory
      ? item.subCategory
      : item.type
      ? item.type
      : item.brand
      ? item.brand
      : item.color.colors[0]
      ? item.color.colors[0] + "Item"
      : "Item";
  };

  /**
   *
   * @param {Item} item
   * @param {HTMLElement} container
   * @param {string[]} classlist
   */
  listItem = (
    item,
    container,
    classlist = ["list-group-item", "list-group-item-action"]
  ) => {
    this.convertDate(item);
    let itemNode = document.createElement("div");
    itemNode.classList.add(...classlist);
    itemNode.setAttribute("data", item._id);
    container = container || document.querySelector("#items-queue");
    const index = container.children.length + 1;
    itemNode.innerHTML = `
        <a
        aria-current="${index == 1 ? "true" : "false"}"
        class="list-group-item-action text-decoration-none"
        data-bs-toggle="collapse" 
        href="#item${index}" 
        role="button" 
        aria-expanded="${index == 1 ? "true" : "false"}" 
        aria-controls="item${index}"
        >
        <div class="d-flex">
        <div class="flex-fill">
        <h5 class="mb-1">${this.coalesceItemTitle(item)}
          ${this.smartTags(item)}
        </h5>
        <p class="text-dark">${item.category}</p>
        </div>
        <div class="d-flex flex-row-reverse align-items-stretch">
        <div style="background-color: ${
          item.color.colors[0]
        }; border-radius: 3px; color: ${
      item.color.colors[0]
    }" class="ml-2 py-2 my-2 item-color">${item.color.colors[0]}</div>
        </div>
        </div>
        <div class="collapse" id="item${index}">
        <div class="d-flex w-100 justify-content-between">
        <h6 class="mb-1">${item.brand ? item.brand + " | " : ""} ${
      item.subCategory ? item.subCategory + " | " : ""
    } 
        ${item.type ? item.type + " | " : ""}  
        <span class="badge bg-secondary">${item.rating}</span>
        </h6>
        <small> <a role="button" class="mx-1 text-decoration-none text-dark dismiss-queue-item" data="${
          item._id
        }">Remove</a></small>
        </div>
        <p class="mb-1">${item.length ? item.length + " | " : ""} ${
      item.size.letter ? item.size.letter + " | " : ""
    } ${
      item.size.number[0]
        ? item.size.number[0].toString() + "x" + item.size.number[1] + " | "
        : ""
    } ${item.condition ? "Condition: " + item.condition : ""}</p>
        <p><small class="text-muted">
        ${item.purchaseLocation ? "Purchased at " + item.purchaseLocation : ""}
        ${
          (item.purchaseDate && !item.purchaseLocation) ||
          (item.cost && !item.purchaseLocation)
            ? "Purchased "
            : ""
        }
        ${item.purchaseDate ? "on " + item.purchaseDate : ""} ${
      item.cost ? " for $" + item.cost : ""
    }
        </small></p>
        </div>
        </a>`;
    container.appendChild(itemNode);
  };

  /**
   *
   * @param {string[]} itemColors
   * @returns {string}
   */
  paletteToGradient = (itemColors) => {
    const [colors, percents] = [itemColors.colors, itemColors.weights];
    let template = `background: ${colors[0]}; background: radial-gradient(circle`;
    for (let i = 0; i < itemColors.colors.length; i++) {
      template += `, ${colors[i]} ${percents[i]}%`;
    }
    return template + ");";
  };

  /**
   *
   * @param {Item} item
   */
  convertDate = (item) => {
    if (item.purchaseDate) {
      let d = new Date(item.purchaseDate);
      item.purchaseDate = d.toLocaleDateString();
    }
  };

  /**
   *
   * @param {Item} item
   * @returns {string}
   */
  graphItemAttrs = (item) => {
    let ret = `<ul class="list-group list-group-horizontal">`;
    let columns = 0;

    const attrs = ["type", "subCategory", "brand", "fit", "length", "styles"];
    const sizeAttrs = ["letter", "number", "dimensions"];
    for (const property of attrs) {
      if (item[property]) {
        ret += `<li class="list-group-item text-muted">${property}</li>
            <li class="list-group-item">${item[property]}</li>`;
        columns++;
      }
      if (columns % 2 === 0 || item[property].length + property.length > 14) {
        ret += `</ul><ul class="list-group list-group-horizontal">`;
      }
    }
    if (item.size) {
      for (const sizeProperty of sizeAttrs) {
        if (item.size[sizeProperty] && item.size[sizeProperty].length > 0) {
          ret += `<li class="list-group-item text-muted">${sizeProperty} Size</li>
            <li class="list-group-item">${item.size[sizeProperty]}</li>`;
          columns++;
          if (
            columns % 2 === 0 ||
            item.size[sizeProperty].length + sizeProperty.length > 14
          ) {
            ret += `</ul><ul class="list-group list-group-horizontal">`;
          }
        }
      }
    }
    return ret + "</ul>";
  };

  /**
   *
   * @param {Item} item
   * @returns {string}
   */
  purchaseDetails = (item) => {
    let ret = "";
    if (item.purchaseLocation) {
      ret += `Purchased at ${item.purchaseLocation}`;
    } else if (item.cost || item.purchaseDate) {
      ret += "Purchased ";
    }
    if (item.purchaseDate) {
      ret += `on ${item.purchaseDate}`;
    }
    if (item.cost) {
      ret += ` for $${item.cost}`;
    }
    return ret;
  };

  /**
   *
   * @param {Item[]} items
   * @param {HTMLElement} container
   * @param {string} buttonTxt
   * @param {string[]} classlist
   * @returns {Promise<void>}
   */
  itemCards = async (
    items,
    container,
    buttonTxt,
    classlist = ["col-sm-auto", "align-self-stretch", "d-flex"]
  ) => {
    if (!Array.isArray(items)) {
      items = [items];
    }

    for (const item of items) {
      console.log(item.image)
      this.convertDate(item);
      let card = document.createElement("div");
      card.classList.add(...classlist);

      let image;
      if (item.image && item.image != undefined && item.image != "undefined") {
        image = `<img src="${this.image}" loading="lazy" class="img-fluid rounded-start m-2" alt="Picture of ${item.description}"></img>`;
      } else {
        image = `<div class="rounded-start item-card-color m-2" style="${this.paletteToGradient(
          item.color
        )};"></div>`;
      }

      card.classList.add(this.cardClass);
      card.innerHTML = `  <div class="card mb-3" data="${
        item._id
      }" style="max-width: 550px;">
          <div class="row g-4">
          <div class="col-md-4">
          ${image}
          <div class="container-fluid p-2">
          <div class="row d-flex justify-content-center">
          <p class="card-text"><small class="text-muted">
          ${this.purchaseDetails(item)}
          </small></p>
          </div>
          </div>
          </div>
          <div class="col-md-8">
          <div class="card-body">
          <h5 class="card-title">${this.coalesceItemTitle(
            item
          ).toUpperCase()}</h5>
          <p class="card-text">
          ${item.description}
          </p>
          </div>
          ${this.graphItemAttrs(item)}
          <div class="card-body">
          <a data="${item._id}" class="btn btn-primary add-to-queue">${
        buttonTxt ? buttonTxt : "Add"
      }</a>
          <a data="${
            item._id
          }" class="card-link dismiss-search-item">Dismiss</a>
          </div>
          </div>
          </div>
          </div>`;
      container.appendChild(card);
    }
  };
}

export default Templates;
