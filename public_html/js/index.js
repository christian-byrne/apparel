/**
 * ─── APPARELL ──────────────────────────────────────────────────
 *
 * @author Christian P. Byrne
 *
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

//
// ─── UTIL HELPERS ───────────────────────────────────────────────────────────────
//

class ClosestMatch {
  constructor(apropos, fallback) {
    // Related words to potential matches.
    this.apropros = apropos;
    this.fallback = fallback || false;

    this.closestApropos = (word) => {
      let ret;
      for (const [candidate, related] of Object.entries(apropos)) {
        let relatedCopy = [...related];
        relatedCopy.push(candidate.toString());
        if (this.closestInArray(word, relatedCopy)) {
          return candidate;
        }
      }
      if (!ret) {
        return this.fallback;
      }
    };

    this.getMatch = (word) => {
      let ret;
      for (const [candidate, related] of Object.entries(apropos)) {
        let relatedCopy = [...related];
        relatedCopy.push(candidate.toString());
        let result = this.closestInArray(word, relatedCopy);
        if (result) {
          return result;
        }
      }
      if (!ret) {
        return this.fallback;
      }
    };
  }

  closestInArray = (word, againstArray, errorMargin) => {
    errorMargin = errorMargin || Math.floor(word.length / 3);
    for (const candidate of againstArray) {
      let diff = this.calcDiff(word, candidate);
      if (diff <= errorMargin) {
        return candidate;
      }
    }
    return false;
  };

  letterCount = (word, letter) => {
    return Array.from(word).filter((x) => x == letter).length;
  };

  getDuplicates = (word) => {
    let duplicates = Array.from(word).reduce(function (acc, el, i, arr) {
      if (arr.indexOf(el) !== i && acc.indexOf(el) < 0) acc.push(el);
      return acc;
    }, []);
    return duplicates;
  };

  mapLetterCts = (word) => {
    const ret = {};
    for (const letter of Array.from(word)) {
      ret[letter] = this.letterCount(word, letter);
    }
    return ret;
  };

  letterIntersection = (word, against) => {
    let agArr = Array.from(against);
    return Array.from(word).filter((letter) => agArr.includes(letter));
  };

  calcDiff = (refWord, againstWord) => {
    let ret = 0;
    const sharedLetters = this.letterIntersection(refWord, againstWord);
    const refLetterCts = this.mapLetterCts(refWord);
    const againstLetterCts = this.mapLetterCts(againstWord);

    // Count unique differences.
    const uniqueDiff = (letterCounts) => {
      for (const [unique, ct] of Object.entries(letterCounts)) {
        if (!sharedLetters.includes(unique)) {
          ret += ct;
        }
      }
    };
    uniqueDiff(refLetterCts);
    uniqueDiff(againstLetterCts);
    // Shallow intersection copies.
    const intersectCopy = (ogWord, intersect) => {
      let sCopy = [...ogWord].join("");
      let lettersCopy = Array.from(ogWord);
      for (const ltr of lettersCopy) {
        if (!sharedLetters.includes(ltr)) {
          sCopy = sCopy.replace(ltr, "");
        }
      }
      return Array.from(sCopy);
    };
    let adjustedWord = intersectCopy(refWord);
    let adjustedAgainst = intersectCopy(againstWord);

    for (const [shared, ct] of Object.entries(refLetterCts)) {
      // Difference in count of shared letters.
      if (sharedLetters.includes(shared)) {
        ret += Math.abs(ct - againstLetterCts[shared]);
        // Difference in position of shared letters
        if (adjustedWord.indexOf(shared) != adjustedAgainst.indexOf(shared)) {
          ret += 1;
          // Rearrange to not count all letters after as out of place as well.
          let posWord = adjustedWord.indexOf(shared);
          let posAgainst = adjustedAgainst.indexOf(shared);
          adjustedWord[posAgainst] = shared;
          adjustedWord[posWord] = adjustedAgainst[posWord];
        }
      }
    }

    return ret;
  };
}

class FormParse {
  constructor() {
    this.v = (selector) => {
      const node = document.querySelector(`#${selector}Input`);
      return node ? node.value : false;
    };
    this.siblingQuery = (selector) => {
      return document.querySelector(`#${selector}Input`).nextElementSibling
        .value;
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
      let value = queryHandler(input);
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
      serialized[field] = queryHandler(field);
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

  readWeighted = (fieldObj) => {
    const ret = {};
    const unsorted = {};
    const properties = Object.keys(fieldObj);
    let unsortedValues = this.inputsToArray(fieldObj[properties[0]]);
    let unsortedWeights = this.inputsToArray(fieldObj[properties[1]]);

    for (let i = 0; i < unsortedValues.length; i++) {
      if (unsortedWeights[i] && unsortedWeights[i] != 0) {
        unsorted[unsortedValues[i]] = unsortedWeights[i];
      }
    }
    const sorted = Object.fromEntries(
      Object.entries(unsorted)
        .sort(([, a], [, b]) => a - b)
        .reverse()
    );
    ret[properties[0]] = Object.keys(sorted);
    ret[properties[1]] = Object.values(sorted);
    return ret;
  };
}

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

  scrollToTop = () => {
    setTimeout(function () {
      window.scrollTo(0, 0);
    }, 50);
  };

  reset = () => {
    for (const container of this.containers) {
      while (container.children.length > 0) {
        container.children[0].remove();
      }
    }
  };

  defaultTab = () => {
    let firstTab = document.querySelector("ul.nav-tabs > li:nth-of-type(1)");
    if (firstTab) {
      firstTab.click();
      if (firstTab.firstElementChild) {
        firstTab.firstElementChild.click();
      }
    }
  };

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

  fullReset = async () => {
    this.clearInputs();
    this.reset();
    this.defaultTab();
    this.scrollToTop();
    return;
  };
}

class Color {
  // https://stackoverflow.com/questions/42966641/how-to-transform-black-into-any-given-color-using-only-css-filters/43960991#43960991
  constructor(r, g, b) {
    this.set(r, g, b);
  }

  toString() {
    return `rgb(${Math.round(this.r)}, ${Math.round(this.g)}, ${Math.round(
      this.b
    )})`;
  }

  set(r, g, b) {
    this.r = this.clamp(r);
    this.g = this.clamp(g);
    this.b = this.clamp(b);
  }

  hueRotate(angle = 0) {
    angle = (angle / 180) * Math.PI;
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);

    this.multiply([
      0.213 + cos * 0.787 - sin * 0.213,
      0.715 - cos * 0.715 - sin * 0.715,
      0.072 - cos * 0.072 + sin * 0.928,
      0.213 - cos * 0.213 + sin * 0.143,
      0.715 + cos * 0.285 + sin * 0.14,
      0.072 - cos * 0.072 - sin * 0.283,
      0.213 - cos * 0.213 - sin * 0.787,
      0.715 - cos * 0.715 + sin * 0.715,
      0.072 + cos * 0.928 + sin * 0.072,
    ]);
  }

  grayscale(value = 1) {
    this.multiply([
      0.2126 + 0.7874 * (1 - value),
      0.7152 - 0.7152 * (1 - value),
      0.0722 - 0.0722 * (1 - value),
      0.2126 - 0.2126 * (1 - value),
      0.7152 + 0.2848 * (1 - value),
      0.0722 - 0.0722 * (1 - value),
      0.2126 - 0.2126 * (1 - value),
      0.7152 - 0.7152 * (1 - value),
      0.0722 + 0.9278 * (1 - value),
    ]);
  }

  sepia(value = 1) {
    this.multiply([
      0.393 + 0.607 * (1 - value),
      0.769 - 0.769 * (1 - value),
      0.189 - 0.189 * (1 - value),
      0.349 - 0.349 * (1 - value),
      0.686 + 0.314 * (1 - value),
      0.168 - 0.168 * (1 - value),
      0.272 - 0.272 * (1 - value),
      0.534 - 0.534 * (1 - value),
      0.131 + 0.869 * (1 - value),
    ]);
  }

  saturate(value = 1) {
    this.multiply([
      0.213 + 0.787 * value,
      0.715 - 0.715 * value,
      0.072 - 0.072 * value,
      0.213 - 0.213 * value,
      0.715 + 0.285 * value,
      0.072 - 0.072 * value,
      0.213 - 0.213 * value,
      0.715 - 0.715 * value,
      0.072 + 0.928 * value,
    ]);
  }

  multiply(matrix) {
    const newR = this.clamp(
      this.r * matrix[0] + this.g * matrix[1] + this.b * matrix[2]
    );
    const newG = this.clamp(
      this.r * matrix[3] + this.g * matrix[4] + this.b * matrix[5]
    );
    const newB = this.clamp(
      this.r * matrix[6] + this.g * matrix[7] + this.b * matrix[8]
    );
    this.r = newR;
    this.g = newG;
    this.b = newB;
  }

  brightness(value = 1) {
    this.linear(value);
  }
  contrast(value = 1) {
    this.linear(value, -(0.5 * value) + 0.5);
  }

  linear(slope = 1, intercept = 0) {
    this.r = this.clamp(this.r * slope + intercept * 255);
    this.g = this.clamp(this.g * slope + intercept * 255);
    this.b = this.clamp(this.b * slope + intercept * 255);
  }

  invert(value = 1) {
    this.r = this.clamp((value + (this.r / 255) * (1 - 2 * value)) * 255);
    this.g = this.clamp((value + (this.g / 255) * (1 - 2 * value)) * 255);
    this.b = this.clamp((value + (this.b / 255) * (1 - 2 * value)) * 255);
  }

  hsl() {
    // Code taken from https://stackoverflow.com/a/9493060/2688027, licensed under CC BY-SA.
    const r = this.r / 255;
    const g = this.g / 255;
    const b = this.b / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h,
      s,
      l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;

        case g:
          h = (b - r) / d + 2;
          break;

        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return {
      h: h * 100,
      s: s * 100,
      l: l * 100,
    };
  }

  clamp(value) {
    if (value > 255) {
      value = 255;
    } else if (value < 0) {
      value = 0;
    }
    return value;
  }
}

class Solver {
  constructor(target, baseColor) {
    this.target = target;
    this.targetHSL = target.hsl();
    this.reusedColor = new Color(0, 0, 0);
  }

  solve() {
    const result = this.solveNarrow(this.solveWide());
    return {
      values: result.values,
      loss: result.loss,
      filter: this.css(result.values),
    };
  }

  solveWide() {
    const A = 5;
    const c = 15;
    const a = [60, 180, 18000, 600, 1.2, 1.2];

    let best = { loss: Infinity };
    for (let i = 0; best.loss > 25 && i < 3; i++) {
      const initial = [50, 20, 3750, 50, 100, 100];
      const result = this.spsa(A, a, c, initial, 1000);
      if (result.loss < best.loss) {
        best = result;
      }
    }
    return best;
  }

  solveNarrow(wide) {
    const A = wide.loss;
    const c = 2;
    const A1 = A + 1;
    const a = [0.25 * A1, 0.25 * A1, A1, 0.25 * A1, 0.2 * A1, 0.2 * A1];
    return this.spsa(A, a, c, wide.values, 500);
  }

  spsa(A, a, c, values, iters) {
    const alpha = 1;
    const gamma = 0.16666666666666666;

    let best = null;
    let bestLoss = Infinity;
    const deltas = new Array(6);
    const highArgs = new Array(6);
    const lowArgs = new Array(6);

    for (let k = 0; k < iters; k++) {
      const ck = c / Math.pow(k + 1, gamma);
      for (let i = 0; i < 6; i++) {
        deltas[i] = Math.random() > 0.5 ? 1 : -1;
        highArgs[i] = values[i] + ck * deltas[i];
        lowArgs[i] = values[i] - ck * deltas[i];
      }

      const lossDiff = this.loss(highArgs) - this.loss(lowArgs);
      for (let i = 0; i < 6; i++) {
        const g = (lossDiff / (2 * ck)) * deltas[i];
        const ak = a[i] / Math.pow(A + k + 1, alpha);
        values[i] = fix(values[i] - ak * g, i);
      }

      const loss = this.loss(values);
      if (loss < bestLoss) {
        best = values.slice(0);
        bestLoss = loss;
      }
    }
    return { values: best, loss: bestLoss };

    function fix(value, idx) {
      let max = 100;
      if (idx === 2 /* saturate */) {
        max = 7500;
      } else if (idx === 4 /* brightness */ || idx === 5 /* contrast */) {
        max = 200;
      }

      if (idx === 3 /* hue-rotate */) {
        if (value > max) {
          value %= max;
        } else if (value < 0) {
          value = max + (value % max);
        }
      } else if (value < 0) {
        value = 0;
      } else if (value > max) {
        value = max;
      }
      return value;
    }
  }

  loss(filters) {
    // Argument is array of percentages.
    const color = this.reusedColor;
    color.set(0, 0, 0);

    color.invert(filters[0] / 100);
    color.sepia(filters[1] / 100);
    color.saturate(filters[2] / 100);
    color.hueRotate(filters[3] * 3.6);
    color.brightness(filters[4] / 100);
    color.contrast(filters[5] / 100);

    const colorHSL = color.hsl();
    return (
      Math.abs(color.r - this.target.r) +
      Math.abs(color.g - this.target.g) +
      Math.abs(color.b - this.target.b) +
      Math.abs(colorHSL.h - this.targetHSL.h) +
      Math.abs(colorHSL.s - this.targetHSL.s) +
      Math.abs(colorHSL.l - this.targetHSL.l)
    );
  }

  css(filters) {
    function fmt(idx, multiplier = 1) {
      return Math.round(filters[idx] * multiplier);
    }
    return `invert(${fmt(0)}%) sepia(${fmt(1)}%) saturate(${fmt(
      2
    )}%) hue-rotate(${fmt(3, 3.6)}deg) brightness(${fmt(4)}%) contrast(${fmt(
      5
    )}%)`;
  }
}

class SketchColors {
  constructor() {}
  hexToRgb = (hex) => {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => {
      return r + r + g + g + b + b;
    });
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [
          parseInt(result[1], 16),
          parseInt(result[2], 16),
          parseInt(result[3], 16),
        ]
      : null;
  };

  filterConvert = (hexCode) => {
    const rgb = this.hexToRgb(hexCode);
    const color = new Color(rgb[0], rgb[1], rgb[2]);
    const solver = new Solver(color);
    const result = solver.solve();
    return result.filter;
  };
}

class Directory {
  constructor(options) {
    let config = {
      URL: BASE_URL,
    };
    Object.assign(config, options);
    Object.assign(this, config);
  }

  fileNames = async (dirName) => {
    return $.get(
      `${this.URL}/filenames/${encodeURIComponent(dirName)}`,
      (fileNames) => {
        return fileNames;
      }
    );
  };
}

//
// ─── FEATURES ───────────────────────────────────────────────────────────────────
//

class Notifications {
  constructor(options) {
    let config = {};
    Object.assign(config, options);
    Object.assign(this, config);
  }

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

  constructToast = () => {
    const toastEl = document.createElement("div");
    toastEl.classList.add("toast");
    toastEl.setAttribute("role", "alert");
    toastEl.setAttribute("aria-live", "assertive");
    toastEl.setAttribute("aria-atomic", "true");
    return toastEl;
  };

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

  toast = (container, title, message, color) => {
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
    container.prepend(toastEl);
    this.initializeToast(toastEl);
  };

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

class AddOutfit {
  constructor(options) {
    let config = {
      curUser: curUser,
      URL: BASE_URL,
      itemsQueueNode: document.querySelector("#items-queue"),
      fields: [
        "description",
        "rating",
        "category",
        "subCategory",
        "type",
        "lastWorn",
        "wearCount",
        "temperature",
        "notes",
      ],
      arrayFields: {
        weather: [
          "weatherRain",
          "weatherSnow",
          "weatherSun",
          "weatherWindy",
          "weatherHumid",
        ],
      },
      CSVfields: ["formality", "setting", "event"],
    };
    Object.assign(config, options);
    Object.assign(this, config);
    this.form = new FormParse();

    this.itemQueueIds = () => {
      const ret = [];
      for (const item of this.itemsQueueNode.children) {
        if (item && item.getAttribute("data")) {
          ret.push(item.getAttribute("data"));
        }
      }
      return ret;
    };

    this.serialize = () => {
      return {
        ...this.form.read(this.fields),
        ...this.form.readArrayFields(this.arrayFields),
        ...this.form.readCSV(this.CSVfields),
        items: this.itemQueueIds(),
      };
    };
  }

  postOutfit = async () => {
    console.log(this.serialize());
    const ajaxOptions = {
      url: `${this.URL}/post/outfit/${this.curUser()}`,
      type: "POST",
      data: this.serialize(),
      success: () => {
        return;
      },
      error: () => {},
    };
    return $.ajax(ajaxOptions);
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
      for (let i = 1; i <= range; i++) {
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
        material: this.form.readWeighted(this.mats),
        color: this.form.readWeighted(this.col),
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
  constructor(options, responseHandler) {
    let config = {
      URL: BASE_URL,
      curUser: curUser,
      filterTxtSelector: () => {
        return document.querySelector("#filterSearchInput");
      },
      searchTxtSelector: () => {
        return document
          .querySelector("#searchAll")
          .querySelector("input[type=search]").value;
      },
      filterTypeSelector: () => {
        return document
          .querySelector("#filterDropdownChoice")
          .getAttribute("data");
      },
      tooltipNodeLoc: document.querySelector("#filterDropdownButton"),
      filterTitle: "Filter Type",
      requiredErrorMsg:
        "Or Search all fields using the other search bar at the top of the page",
      ajaxErrorHanlder: (reason) => console.log(reason),
      resultsSelector: () => {
        return document.querySelectorAll("div.searchResultCard");
      },
    };
    Object.assign(config, options);
    Object.assign(this, config);
    this.responseHandler = responseHandler;
    this.notify = new Notifications();

    // Can capture.
    this.validateFilter = async () => {
      if (!this.filterTypeSelector()) {
        this.notify.popoverTooltip(this.tooltipNodeLoc, {
          title: `Select a ${this.filterTitle} First`,
          content: this.requiredErrorMsg,
          placement: "top",
          trigger: "focus",
        });
        return false;
      } else {
        return true;
      }
    };
  }

  currentResults = () => {
    const ret = [];
    for (const card of this.resultsSelector()) {
      if (card.data) {
        ret.push(card.data);
      }
    }
    return ret;
  };

  clearResults = async () => {
    while (this.resultsSelector().length > 0) {
      this.resultsSelector()[0].remove();
    }
    return;
  };

  /**
   *
   * @returns {Promise<Item[]>}
   */
  itemById = async (id) => {
    return $.get(`${this.URL}/get/oneitem/${id}`, (items) => {
      return items;
    });
  };

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

  /**
   *
   * @returns {Promise<Item[]>}
   */
  keywordAllFields = async () => {
    return $.get(
      `${this.URL}/search/all/${this.curUser()}/${this.searchTxtSelector()}`,
      (searchResults) => {
        return searchResults;
      }
    );
  };

  /**
   * If there are already search results displayed, then only
   * eliminate active results.If there are no results
   * displayed (first search or recently cleared),
   * peform a new query.
   */
  keywordOneField = async () => {
    return this.validateFilter().then((validated) => {
      if (!validated) {
        return;
      } else {
        const active = this.currentResults();
        const ajaxOptions = {
          url: `${this.URL}/search/field`,
          type: "POST",
          data: {
            username: this.curUser(),
            keyword: this.filterTxtSelector().value,
            field: this.filterTypeSelector(),
          },
          success: (searchResults) => {
            return searchResults;
          },
          error: this.ajaxErrorHanlder,
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
      tabCategoriesApropos: {},
      placeholder: "https://via.placeholder.com/800",
      fallbackNode: document.querySelector("#otherSearchResults"),
      tabContainerSelectorFn: (tabName) => {
        return document.querySelector(`#${tabName}SearchResults`);
      },
      containerSuffix: "Page",
      tabSuffix: "Tab",
    };
    Object.assign(config, options);
    this.config = config;
    this.tabApropos = config.tabCategoriesApropos;

    for (const category of this.config.tabCategories) {
      if (!Object.keys(this.tabApropos).includes(category)) {
        this.tabApropos[category] = category.toString();
      }
    }
    this.matcher = new ClosestMatch(this.tabApropos, false);
  }

  tabContainers = () => {
    const ret = {};
    for (const tabName of this.config.tabCategories) {
      ret[tabName] = this.config.tabContainerSelectorFn(tabName);
    }
    return ret;
  };

  categoryTabs = (items) => {
    let containers = this.tabContainers();
    for (const item of items) {
      let belongsToId = this.matcher.closestApropos(
        item.category.toLowerCase()
      );
      let belongsToNode = containers[belongsToId] || this.config.fallbackNode;
      this.itemCards([item], belongsToNode).then(() => {});
    }
    this.activateMostPopulated(Object.values(containers));
  };

  activateMostPopulated = (containers) => {
    const lengths = containers.map((node) => node.children.length);
    const retI = lengths.indexOf(Math.max(...lengths));
    // TODO - inconsistent.
    const pageNode = containers[retI].parentElement.parentElement;
    const tabNode = document.querySelector(
      `#${pageNode.id.replace(
        this.config.containerSuffix,
        this.config.tabSuffix
      )}`
    );
    // Activate by clicking.
    setTimeout(() => {
      tabNode.click();
    }, 10);
  };

  listItem = (
    item,
    container,
    classlist = ["list-group-item", "list-group-item-action"]
  ) => {
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
        <h5 class="mb-1">${item.description}
        <span class="badge bg-secondary">Style 1</span>
        <span class="badge bg-secondary">Style 2</span>
        <span class="badge bg-primary text-dark">Fit</span>
        <span class="badge bg-info text-dark" >Fit</span>
        </h5>
        <p class="text-dark">${item.category}</p>
        </div>
        <div class="d-flex flex-row-reverse align-items-stretch">
        <div style="background-color: ${
          item.color.colors[0]
        }; border-radius: 3px; color: ${
      item.color.colors[0]
    }" class="ml-2 py-2 my-2">${item.color.colors[0]}</div>
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
        ${
          item.purchaseDate ? item.purchaseDate.toString() + " days ago" : ""
        } ${item.cost ? " for $" + item.cost : ""}
        </small></p>
        </div>
        </a>`;
    container.appendChild(itemNode);
  };

  paletteToGradient = (itemColors) => {
    const [colors, percents] = [itemColors.colors, itemColors.weights];
    let template = `background: ${colors[0]}; background: radial-gradient(circle`;
    for (let i = 0; i < itemColors.colors.length; i++) {
      template += `, ${colors[i]} ${percents[i]}%`;
    }
    return template + ");";
  };

  itemCards = async (items, container, classlist = ["col-sm-6"]) => {
    if (!Array.isArray(items)) {
      items = [items];
    }

    for (const item of items) {
      let card = document.createElement("div");
      card.classList.add(...classlist);

      let image;
      if (item.image) {
        image = `<img src="${this.image}" loading="lazy" class="img-fluid rounded-start" alt="Picture of ${item.description}"></img>`;
      } else {
        image = `<div class="rounded-start item-card-color" style="${this.paletteToGradient(
          item.color
        )};"></div>`;
      }

      card.classList.add(this.config.cardClass);
      card.innerHTML = `  <div class="card mb-3" data="${
        item._id
      }" style="max-width: 540px;">
          <div class="row g-0">
          <div class="col-md-4">
          ${image}
          <div class="container-fluid p-2">
          <div class="row d-flex justify-content-center">
          <p class="card-text"><small class="text-muted">${
            item.purchaseLocation ? "Purchased at " + item.purchaseLocation : ""
          }
          ${
            (item.purchaseDate && !item.purchaseLocation) ||
            (item.cost && !item.purchaseLocation)
              ? "Purchased "
              : ""
          }
           ${
             item.purchaseDate ? item.purchaseDate.toString() + " days ago" : ""
           } ${item.cost ? " for $" + item.cost : ""}</small></p>
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
          <a data="${item._id}" class="btn btn-primary add-to-queue">Add</a>
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

class Mannequin {
  constructor(containerSelector, gender) {
    this.containerSelector = containerSelector;
    this.container = document.querySelector(containerSelector);
    this.referenceLayer = document.querySelector(
      `${containerSelector} > img:nth-of-type(1)`
    );
    this.files = new Directory();
    this.colors = new SketchColors();
    this.match = new ClosestMatch();
    this.gender = gender;
    this.clothes;
    this.propOptions().then((items) => {
      this.clothes = items;
    });

    this.maskLayers = () => {
      return document.querySelectorAll(
        `${containerSelector} > img:nth-of-type(n + 2)`
      );
    };
    window.addEventListener("resize", () => {
      setTimeout(() => {
        this.resize();
      }, 10);
    });

    /**
     *
     * @returns {[width: string, height: string]}
     */
    this.computedSize = () => {
      let reference = window.getComputedStyle(this.referenceLayer);
      return [reference.width, reference.height];
    };
  }

  get dimensions() {
    return this.computedSize();
  }

  propOptions = async (accents = false) => {
    return this.files
      .fileNames(`img/${this.gender}/${accents ? "accent" : ""}`)
      .then((names) => {
        const ret = [];
        names.forEach((file) => ret.push(file.split(".")[0]));
        this.clothingOptions = ret;
        return ret;
      });
  };

  undressAll = async () => {
    while (this.maskLayers().length > 0) {
      this.maskLayers()[0].remove();
    }
    return;
  };

  resize = () => {
    const [newWidth, newHeight] = this.computedSize();
    for (const stackedImg of this.maskLayers()) {
      stackedImg.style.setProperty("height", newHeight);
      stackedImg.style.setProperty("width", newWidth);
      stackedImg.style.setProperty(
        "margin-top",
        `${parseInt(newHeight) * -1}px`
      );
    }
  };

  // TODO can implement pattern or print layer on top using mask image

  dress = (item) => {
    this.propOptions().then((images) => {
      const match = new ClosestMatch(images);
      let layer;
      // Try an image layer for type then subcategory then category. Else, do nothing..
      for (const characteristic of [
        item.type,
        item.subCategory,
        item.category,
      ]) {
        layer = match.closestInArray(characteristic, images);
        if (layer) {
          break;
        }
      }
      if (layer) {
        this.addProp(layer, item.color.colors[0]);
        // Get accent props for colors after main color.
        this.propOptions(true).then((accentImgs) => {
          let accentWeights = [];
          accentImgs.forEach((accent) =>
            accentWeights.push(accent.replace(/[^0-9]+/g, ""))
          );
          const getClosest = (weight) => {
            return accentWeights.reduce(function (pre, cur) {
              return Math.abs(cur - weight) < Math.abs(pre - weight)
                ? cur
                : pre;
            });
          };
          for (let i = 1; i < item.color.colors.length; i++) {
            let closest = getClosest(item.color.weights[i]);
            let accentFile = `accent/${layer}-${closest}`;
            this.addProp(accentFile, item.color.colors[i]);
            // Remove from options so not choosing same layer for multiple colors.
            accentWeights = accentWeights.filter((value) => value != closest);
            // Return when no accent image layers left.
            if (accentWeights.length == 0) {
              return;
            }
          }
        });
      }
    });
  };

  positionNode = (node) => {
    const dimensions = this.computedSize();
    [node.style.width, node.style.height] = dimensions;
    node.style.marginTop = `${parseInt(dimensions[1]) * -1}px`;
  };

  addProp = (itemName, color) => {
    if (!this.clothes.includes(itemName)) {
      return;
    }
    const imgLayer = document.createElement("img");
    imgLayer.src = `/img/${this.gender}/${itemName}.png`;
    imgLayer.loading = "eager";
    imgLayer.alt = `${color} ${itemName} layer on mannequin.`;
    // imgLayer.id = `#mask-${itemName}`;

    const filters = this.colors.filterConvert(color);
    imgLayer.style.filter = filters;
    imgLayer.style.opacity = "1.0";

    setTimeout(() => {
      this.positionNode(imgLayer);
      this.container.appendChild(imgLayer);
    }, 20);
  };
}

//
// ─── PAGES ──────────────────────────────────────────────────────────────────────
//

class PageAddOutfit {
  constructor(itemQueueNode, searchOutputNode) {
    this.mannequin = new Mannequin(".mask-outlines", "male");
    this.queue = itemQueueNode || document.querySelector("#items-queue");
    this.searchResults =
      searchOutputNode || document.querySelector("#searchResultsMain");
    this.outfit = new AddOutfit();
    this.search = new Search();
    this.templates = new Templates();
    this.refresh = new Refresh(this.queue);
    this.notification = new Notifications();

    document.documentElement.addEventListener("click", (event) => {
      const caller = event.target;
      const callerClasses = Array.from(caller.classList);
      if (caller.id === "submitAddOutfit") {
        this.outfit.postOutfit().then(() => {
          this.search.clearResults();
          this.refresh.fullReset();
          this.mannequin.undressAll();
          this.notification.minimialToast(
            document.querySelector("#main"),
            "Outfit added to your collection."
          );
        });
      } else if (
        caller.tagName === "A" &&
        caller.parentElement.parentElement.id === "filterDropdownChoice"
      ) {
        event.preventDefault();
        this.handleFilterTypeChange(caller);
      } else if (caller.id === "clearResultsInput") {
        this.search.clearResults();
      } else if (callerClasses.includes("add-to-queue")) {
        let id = caller.getAttribute("data");
        this.search.itemById(id).then((item) => {
          this.templates.listItem(item);
          this.mannequin.dress(item);
        });
      } else if (caller.id === "clear-items-queue") {
        while (this.queue.children.length > 0) {
          this.queue.firstElementChild.remove();
        }
      } else if (
        callerClasses.includes("dismiss-search-item") ||
        callerClasses.includes("dismiss-queue-item")
      ) {
        let id = caller.getAttribute("data");
        let parent = callerClasses.includes("dismiss-search-item")
          ? this.searchResults
          : this.queue;
        for (const item of parent.children) {
          if (
            item.getAttribute("data") === id ||
            (item.firstElementChild &&
              item.firstElementChild.getAttribute("data") === id)
          ) {
            item.remove();
            break;
          }
        }
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
        // this.search.activeFiltersToast();
        this.search.keywordOneField().then((items) => {
          if (items) {
            this.displaySearchRes(items);
          }
        });
      }
    });
  }

  displaySearchRes = (json) => {
    this.search.clearResults().then(() => {
      this.templates.itemCards(json, this.searchResults).then(() => {});
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
    this.mannequin = new Mannequin(".mask-outlines", "male");
    this.refresh = new Refresh([]);
    this.notification = new Notifications();

    document.documentElement.addEventListener("change", (event) => {
      const caller = event.target;
      if (
        ["categoryInput", "typeInput", "subCategoryInput"].includes(
          caller.id
        ) ||
        caller.id.includes("color")
      ) {
        // Parse form to get current item object.
        let currItem = this.item.serialize();
        // If atleast 1 color field filled out, undress then update mannequin.
        if (currItem.color.weights.length > 0) {
          this.mannequin.undressAll().then(() => {
            this.mannequin.dress(currItem);
          });
        }
      }
    });

    document.documentElement.addEventListener("click", (event) => {
      const caller = event.target;
      if (caller.id === "submitAddItem") {
        event.preventDefault();
        this.item.post();
        this.notification.centeredToast(
          document.querySelector("div.col-lg-6:nth-of-type(2)"),
          "Item Added!",
          "Item added to your collection.",
          document.querySelector("input[type=color]").value
        );
        setTimeout(() => {
          this.mannequin.undressAll();
          this.refresh.fullReset();
        }, 30);
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
