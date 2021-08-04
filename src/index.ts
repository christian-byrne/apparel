/**
 * Apparel Web App.
 *
 * @author Christian P. Byrne
 */
import { model, Schema, connect, Model } from "mongoose";
import { json, urlencoded } from "body-parser";
import { __prod__ } from "./constants";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import multer from "multer";
import "cookie-parser";
import cookieParser from "cookie-parser";
import { readdir } from "fs/promises";
import "./style-dict";
import { spreadsheetColors } from "./../public_html/csv-port/json_colors";
import { readFile, utils, WorkBook, WorkbookProperties, WorkSheet } from "xlsx";
import { userInfo } from "os";

type ItemFit = "Oversized" | "Loose" | "Casual" | "Fitted" | "Tight";
type BroadCategory = "shirt" | "tshirt" | "sweater";
type MenGeneralSize =
  | "KID"
  | "XXS"
  | "XS"
  | "S"
  | "M"
  | "L"
  | "XL"
  | "XXL"
  | "XXXL"
  | "PLUS";
type WomenGeneralSize = number;
type ShoeSize = number;
type FormalSize = [number, number];

interface ItemColors {
  colors: string[];
  weights: number[];
}

interface ItemMaterials {
  materials: string[];
  weights: number[];
}

interface ItemCondition {
  material: number;
  color: number;
}

interface Item {
  description: string;
  rating: number;
  category: BroadCategory | string;
  subCategory: string;
  type: string;
  fit: ItemFit;
  length: string;
  size: {
    letter: MenGeneralSize | WomenGeneralSize | ShoeSize;
    number: FormalSize;
    dimensions?: string;
  };
  brand?: string;
  purchaseLocation?: string;
  purchaseDate?: Date;
  cost?: number;
  condition?: ItemCondition | number;
  colorCondition: number;
  materialCondition: number;
  washType?: string;
  material?: ItemMaterials;
  primary?: string;
  secondary?: string;
  tertiary?: string;
  quaternary?: string;

  // See styles list.
  styles: string[];
  color: ItemColors;
}

interface Outfit {
  description: string;
  rating: number;
  category: BroadCategory;
  subCategory: string;
  type: string;
  formality: string[];
  setting: string[];
  event: string[];
  lastWorn: Date;
  temperautre: number;
  wearCount: number;
  weather: string[];
  notes?: string;
  items: string[];

  // See styles list.
  styles: string[];
}
interface User {
  username: string;
  password: string;
  outfits: string[];
  items: string[];
  gender: "female" | "male";
  age: number;
  bio: string;
  height: string;
  weight: string;
  favColor1: string;
  favColor2: string;
  favColor3: string;
  favStyle: string;
  favClothingItem: string;
  shoeSize: string;
  pantSize: number[];
}

//
// ─── DATABASE ───────────────────────────────────────────────────────────────────
//

interface Database {
  itemSchema: Schema<Item, Model<any, any, any>, undefined, any>;
  itemModel: Model<Item, {}, {}>;
  userSchema: Schema<User, Model<any, any, any>, undefined, any>;
  userModel: Model<User, {}, {}>;
  outfitSchema: Schema<Outfit, Model<any, any, any>, undefined, any>;
  outfitModel: Model<Outfit, {}, {}>;
  verboseMsg: (devMsg: any) => any | false;
}

class Database {
  constructor(verboseMsg: (msgPrinter: any) => void) {
    this.itemSchema = new Schema<Item>({
      description: String,
      category: String,
      subCategory: String,
      type: String,
      styles: [String],
      fit: String,
      length: String,
      primary: String,
      secondary: String,
      tertiary: String,
      quaternary: String,
      color: {
        colors: [String],
        weights: [Number],
        ordered: [String],
      },
      material: {
        materials: [String],
        weights: [Number],
      },
      brand: String,
      rating: Number,
      size: {
        letter: String,
        number: [
          { type: Number, required: false },
          { type: Number, required: false },
        ],
        dimensions: { type: String, required: false },
      },
      purchaseLocation: { type: String, required: false },
      purchaseDate: { type: Date, required: false },
      cost: { type: Number, required: false },
      washType: { type: String, required: false },
      condition: { type: Number, required: false },
      materialCondition: { type: Number, required: false },
      colorCondition: { type: Number, required: false },
    });

    this.outfitSchema = new Schema<Outfit>({
      description: String,
      rating: Number,
      category: String,
      subCategory: String,
      type: String,
      formality: [String],
      setting: [String],
      event: [String],
      lastWorn: { type: Date, required: false },
      temperautre: { type: Number, required: false },
      wearCount: { type: Number, required: false },
      weather: [String],
      notes: { type: String, required: false },
      items: [String],
    });

    this.userSchema = new Schema<User>({
      username: String,
      password: String,
      outfits: [String],
      items: [String],
      gender: String,
      age: Number,
      bio: String,
      height: String,
      weight: String,
      favColor1: String,
      favColor2: String,
      favColor3: String,
      favStyle: String,
      favClothingItem: String,
      shoeSize: String,
      pantSize: [Number],
    });

    this.itemModel = model<Item>("item", this.itemSchema);
    this.outfitModel = model<Outfit>("outfit", this.outfitSchema);
    this.userModel = model<User>("user", this.userSchema);

    this.verboseMsg = verboseMsg;
  }
}

//
// ─── HTTP SERVER ────────────────────────────────────────────────────────────────
//

interface ExpressServer {
  server: express.Express;
  staticFolder: string;
  bindMiddleware: (middleware: any[]) => void;
  catch: () => void;
  bindstatic: () => void;
}

class ExpressServer {
  constructor(staticFolder = "public_html") {
    this.server = express();
    this.staticFolder = staticFolder;
  }
  bindStatic = () => {
    this.server.use(express.static(this.staticFolder));
    this.server.use(express.json());
  };
  bindMiddleware = (middlewareArray: any[]) => {
    for (const handler of middlewareArray) {
      this.server.use(handler);
    }
  };
  catch = () => {
    this.server.get("/", (req: Request) => {
      if (!__prod__) {
        console.log(req.path);
        console.dir(req);
      }
    });
  };
}

//
// ─── APP AND ROUTERS ────────────────────────────────────────────────────────────
//

// Config objects passed to app constructor.
interface DBConfig {
  name: string;
  port: number;
  modelNames: string[];
}

interface VerboseConfig {
  log: boolean;
  verboseGap: string;
  alert: (title: string) => void;
}

interface AppOptions {
  port?: number;
  ip?: string;
  mediaDir?: string;
  middleware: any[];
  verbose?: VerboseConfig;
  dbConfig: DBConfig;
}

interface App {
  // Paramaters.
  port: number;
  ip: string;
  mediaDir: string;
  verbose: VerboseConfig;
  dbConfig: DBConfig;
  // Attributes.
  db: Database;
  upload: multer.Multer;
  middleware: any[];
  http: ExpressServer;
  sessionKeys: {
    [key: string]: [number, number];
  };
  csvImporter: ExcelParser;
}

interface FilterQuery1D {
  username: string;
  keyword: string;
  field: string;
}

// ────────────────────────────────────────────────────────────────────────────────

interface ExcelParser {
  workbook: WorkBook;
  wardrobeSheet: WorkSheet;
  csvJson: any[];
  apropos: any;
  conditionMap: object;
  parseExcel: () => Promise<void>;
}

class ExcelParser {
  constructor(spreadsheetPath, sheetName) {
    // https://stackoverflow.com/questions/28860728/reading-excel-file-using-node-js
    // https://github.com/SheetJS/sheetjs
    // const html = utils.sheet_to_html

    this.workbook = readFile(spreadsheetPath);
    this.wardrobeSheet = this.workbook.Sheets[sheetName];
    this.csvJson = utils.sheet_to_json(this.wardrobeSheet);

    this.apropos = {
      underwear: ["socks"],
      tshirt: [
        "tee",
        "teeshirt",
        "t-shirt",
        "t-shirts",
        "tank",
        "tanktop",
        "short button-up",
      ],
      shirt: ["long t", "long button-up"],
    };
    this.conditionMap = {
      DS: 10,
      Light: 7.5,
      Medium: 5,
      Heavy: 2.5,
    };

    this.parseExcel = async () => {
      for (const record of this.csvJson) {
        // Condition.
        try {
          let conditionAvg = Math.floor(
            (this.conditionMap[record.condition] +
              this.conditionMap[record.colorCondition]) /
              2
          );
          record.condition =
            typeof conditionAvg === "number" ? conditionAvg : 10;
        } catch (err) {
          record.condition = 10;
        }

        // Mats.
        let materialObj = {
          materials: [],
          weights: [],
        };
        let split = record.material.trim(" ").split(",");
        for (const mat of split) {
          if (record.material.includes("%")) {
            let matW = mat.trim(" ").split(" ")[0].replace("%", "");
            matW = parseInt(matW);
            let matN = mat.trim(" ").split(" ").slice(1).join(" ");
            materialObj.materials.push(matN);
            if (typeof matW === "number") {
              materialObj.weights.push(matW);
            }
          } else {
            materialObj.materials.push(mat.trim(" "));
          }
        }
        record.material = materialObj;

        // Size and Length.
        let sizeObj = {
          letter: record.size ? record.size.toString() : "S",
        };
        record.size = sizeObj;
        record.length = record.sizeLength;

        // Category, type, subCategory, styles.
        if (["socks"].includes(record.subCategory)) {
          record.category = "underwear";
        } else if (
          [
            "tee",
            "teeshirt",
            "t-shirt",
            "t-shirts",
            "tank",
            "tanktop",
            "short button-up",
          ].includes(record.subCategory)
        ) {
          record.category = "tshirt";
        } else if (["long t", "long button-up"].includes(record.subCategory)) {
          record.category = "shirt";
        } else {
          record.category = record.subCategory.toLowerCase();
        }
        record.subCategory = record.subCategory.toLowerCase();
        record.type = record.type.toLowerCase();
        record.styles = record.style.toLowerCase().split(",");

        // Color.
        let colorImport = spreadsheetColors[record.description];
        record.color = colorImport;
        for (let ix = 0; ix < record.color.colors.length; ix++) {
          let temp = record.color.colors[ix];
          if (temp && !temp.includes("#")) {
            record.color.colors[ix] = `#${temp}`;
          }
        }

        delete record.style;
        delete record.sizeLength;
        delete record.colorCondition;
      }
    };
  }
}

// ────────────────────────────────────────────────────────────────────────────────

class App {
  constructor(options: AppOptions) {
    // 1. Update config (default values unless specified).
    const config = {
      port: __prod__ ? 80 : 5000,
      ip: __prod__ ? "143.198.57.139" : "127.0.0.1",
      mediaDir: `${__dirname}/../public_html/img`,
      middleware: [],
    };
    const verboseDefault = {
      log: true,
      verboseGap: "\n\n\n\n",
      alert: (title = "section break") =>
        console.log(
          `${verboseDefault.verboseGap}___ ${title} ___ ${verboseDefault.verboseGap}`
        ),
    };
    const dbDefault = {
      name: "",
      port: 27017,
      modelNames: [],
    };
    Object.assign(verboseDefault, options.verbose);
    Object.assign(dbDefault, options.dbConfig);
    Object.assign(config, options);

    // 2. Destructure configs.
    this.verbose = verboseDefault;
    this.dbConfig = dbDefault;
    this.port = config.port;
    this.ip = config.ip;
    this.mediaDir = config.mediaDir;
    this.middleware = config.middleware;

    // 3. Construct database client.
    connect(`mongodb://localhost:${this.dbConfig.port}/${this.dbConfig.name}`, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }).then((value: typeof import("mongoose")) => {
      if (!__prod__ && this.verbose.log) {
        this.verbose.alert("Mongoose Client Constructed");
        // console.dir(value);
      }
    });

    // 4. Construct DB Resolvers/Models instance.
    this.db = new Database(this.verbose.alert);

    // 5. Construct server client
    this.http = new ExpressServer();

    // 6. Init and bind middleware to server.

    // Image uploading.
    this.upload = multer({
      dest: `${this.mediaDir}`,
    });
    // Cookie authentification.
    this.sessionKeys = {};
    setInterval(() => {
      let now = Date.now();
      for (let key in this.sessionKeys) {
        if (this.sessionKeys[key][1] < now - 10000) {
          delete this.sessionKeys[key];
        }
      }
    }, 2000);
    this.http.bindMiddleware([this.authenticate]);
    this.http.bindStatic();
    this.http.bindMiddleware(this.middleware);

    // CSV import/export utils.
    this.csvImporter = new ExcelParser(
      "public_html/csv-port/items-copy.xlsx",
      "Wardrobe"
    );

    // 7. Bind routers.
    this.http.server.post("/login", this.login);
    this.http.server.post("/register", this.register);
    this.http.server.post("/post/item/:user", this.createItem);
    this.http.server.post("/post/outfit/:user", this.createOutfit);
    this.http.server.get("/get/items/:user", this.getItems);
    this.http.server.get("/get/outfits/:user", this.getOutfits);
    this.http.server.get("/get/oneitem/:id", this.getOneFromId);
    this.http.server.get("/search/all/:user/:keyword", this.searchItems);
    this.http.server.get("/filenames/:dir", this.getFileNames);
    this.http.server.post("/search/field", this.filterItems);
    this.http.server.post("/user/gender", this.updateGender);
    this.http.catch();

    // 8. Construct HTTP server.
    this.http.server.listen(this.port, () => {
      if (!__prod__ || this.verbose.log) {
        console.log(`listening on ${this.port} at ${this.ip}`);
      }
    });
  }

  updateGender = (req: Request, res: Response) => {
    this.db.userModel
      .findOne(
        { username: req.body.username },
        )
        .then((user) => {
          user.gender = req.body.gender;
          user.save().then(() => {
            res.end();
          })
      });
  };

  importItemCSV = async (username: string) => {
    return this.csvImporter.parseExcel().then(async () => {
      let csv = this.csvImporter.csvJson;
      for (const record of csv) {
        if (typeof record.condition !== "number") {
          record.condition = 10;
        }
        let mutation = new this.db.itemModel(record);
        await mutation.save().then(async (savedItem) => {
          const newId = savedItem._id;
          await this.pushID(newId, username, "items").catch((reason) => {
            if (!__prod__ && this.verbose.log) {
              console.error(reason);
            }
          });
        });
      }
    });
  };

  fileNames = async (dir: string): Promise<object> => {
    return await readdir(dir);
  };

  getFileNames = (req: Request, res: Response) => {
    this.fileNames(`public_html/${decodeURIComponent(req.params.dir)}`)
      .then((files) => {
        res.json(files);
      })
      .catch((reason) => {
        console.error(reason);
      });
  };

  toCamelCase = (fieldName) => {
    if (fieldName.trim().split(" ").length > 1) {
      return (
        fieldName.trim().charAt(0).toLowerCase() +
        fieldName.slice(1).replace(/ /g, "")
      );
    }
    return fieldName.trim().toLowerCase();
  };

  filterNumberField = async (items, field, keyword) => {
    return items.filter((item: Item) => {
      if (item[field]) {
        if (item[field] == parseInt(keyword)) {
          return item;
        }
      }
    });
  };

  filterStringField = async (items, field, keyword) => {
    return items.filter((item: Item) => {
      if (item[field].toLowerCase().includes(keyword.toLowerCase())) {
        return item;
      }
    });
  };

  filterObjField = async (items, field, keyword) => {
    return items.filter((item: Item) => {
      for (const arrayVal of Object.values(item[field])) {
        if (typeof arrayVal === "string") {
          if (arrayVal.toLowerCase().includes(keyword.toLowerCase())) {
            return item;
          }
        } else if (Array.isArray(arrayVal)) {
          let match = arrayVal.filter((element) => {
            if (
              (typeof element === "string" &&
                element.toLowerCase().includes(keyword.toLowerCase())) ||
              (typeof element === "number" && element === parseInt(keyword))
            ) {
              return element;
            }
          });
          if (match.length > 0) {
            return item;
          }
        }
      }
    });
  };

  filter1DField = async (query: FilterQuery1D): Promise<Item[]> => {
    return this.usersItems(query.username).then((items: Item[]) => {
      const fieldFormatted = this.toCamelCase(query.field);
      if (items[0]) {
        const fieldProto = typeof items[0][fieldFormatted];
        // Curry?
        let resolverF;
        if (fieldProto === "number") {
          resolverF = this.filterNumberField;
        } else if (fieldProto === "string") {
          resolverF = this.filterStringField;
        } else if (fieldProto === "object") {
          resolverF = this.filterObjField;
        }
        return resolverF(items, fieldFormatted, query.keyword).then(
          (filtered) => {
            return filtered;
          }
        );
      }
    });
  };

  filterItems = (req: Request, res: Response) => {
    this.filter1DField(req.body)
      .then((items: Item[]) => {
        res.json(items);
      })
      .catch((reason) => console.log(reason));
  };

  /**
   * Generalized Search.
   */
  filterItemsBroad = async (
    username: string,
    keyword: string
  ): Promise<Item[]> => {
    return this.usersItems(username).then((items: Item[]) => {
      return items.filter((item: Item) => {
        const stringProperties = [
          item.description,
          item.brand,
          item.category,
          item.type,
          item.subCategory,
          item.fit,
          item.length,
          item.purchaseLocation,
        ];
        const arrayProperties = [
          item.material.materials,
          item.styles,
          stringProperties,
        ];
        for (const prop of arrayProperties) {
          if (prop) {
            for (const val of prop) {
              if (val && typeof val !== "number" && val.includes(keyword)) {
                return item;
              }
            }
          }
        }
      });
    });
  };

  searchItems = (req: Request, res: Response) => {
    this.filterItemsBroad(req.params.user, req.params.keyword).then(
      (item: Item[]) => {
        res.json(item);
      }
    );
  };

  getOneFromId = (req: Request, res: Response) => {
    this.db.itemModel.findById(req.params.id).then((item: Item) => {
      res.json(item);
    });
  };

  findAllFromId = async (idArray: string[], collection: Model<any, {}, {}>) => {
    const ret = [];
    for (const id of idArray) {
      await collection.findById(id).then((record) => {
        if (record) {
          ret.push(record);
        }
      });
    }
    return ret;
  };

  pushID = async (id: string, username: string, type: "items" | "outfits") => {
    this.db.userModel.findOne({ username: username }).then((user) => {
      user[type].push(id);
      user.save().then((success) => {
        if (!__prod__ && this.verbose.log) {
          this.verbose.alert(`User: ${username}  --  ${type} Array Updated`);
          console.dir(success);
        }
        return;
      });
    });
  };

  usersOutfits = async (username: string): Promise<Outfit[]> => {
    return this.db.userModel
      .findOne({ username: username })
      .then((user: User) => {
        const itemIds = user.items;
        return this.findAllFromId(itemIds, this.db.outfitModel).then(
          (outfits: Outfit[]) => {
            return outfits;
          }
        );
      });
  };

  usersItems = async (username: string): Promise<Item[]> => {
    return this.db.userModel
      .findOne({ username: username })
      .then((user: User) => {
        const itemIds = user.items;
        return this.findAllFromId(itemIds, this.db.itemModel).then(
          (items: Item[]) => {
            return items;
          }
        );
      });
  };

  getOutfits = (req: Request, res: Response): void => {
    this.usersOutfits(req.params.user).then((outfits: Outfit[]) => {
      res.json(outfits);
    });
  };

  getItems = (req: Request, res: Response): void => {
    this.usersItems(req.params.user).then((items: Item[]) => {
      res.json(items);
    });
  };

  createItem = (req: Request, res: Response) => {
    let mutation = new this.db.itemModel(req.body);
    if (!__prod__ && this.verbose.log) {
      this.verbose.alert("Item Object posted:");
      console.dir(mutation);
    }
    mutation.save().then((savedItem) => {
      const newId = savedItem._id;
      this.pushID(newId, req.params.user, "items").then(() => {
        res.end();
      });
    });
  };

  createOutfit = (req: Request, res: Response) => {
    let mutation = new this.db.outfitModel(req.body);
    if (!__prod__ && this.verbose.log) {
      this.verbose.alert("Outfit Object posted:");
      console.dir(mutation);
    }
    mutation.save().then((savedOutfit) => {
      const newId = savedOutfit._id;
      this.pushID(newId, req.params.user, "outfits").then(() => {
        res.end();
      });
    });
  };

  /**
   * Session cookie generator.
   * @param username
   * @param res
   */
  createSessionCookie = async (username: string, res: Response) => {
    let sessionKey = Math.floor(Math.random() * 10000);
    this.sessionKeys[username] = [sessionKey, Date.now()];
    res.cookie(
      "login",
      { username: username, key: sessionKey },
      { maxAge: 20000 }
    );
  };

  /**
   * Authentication middleware.
   * @param req
   * @param res
   * @param next
   */
  authenticate = (req: Request, res: Response, next: NextFunction) => {
    if (
      req.url.includes("/login") ||
      req.url.includes("/register") ||
      req.url == "/" ||
      true
    ) {
      next();
    } else {
      if (!__prod__ && this.verbose.log) {
        this.verbose.alert("Session Cookie");
        console.log(req.cookies);
      }
      if (Object.keys(req.cookies).length > 0) {
        if (
          this.sessionKeys[req.cookies.login.username][0] ==
          req.cookies.login.key
        ) {
          next();
        } else {
          res.send(false);
        }
      } else {
        res.send(false);
      }
    }
  };

  /**
   * Login router.
   * @param req
   * @param res
   */
  login = (req: Request, res: Response) => {
    this.db.userModel
      .find({
        username: req.body.username,
        password: req.body.password,
      })
      .then((user: User[]) => {
        if (user.length === 1) {
          this.createSessionCookie(req.body.username, res).then(() => {
            res.send(true);
          });
        } else {
          res.send(false);
        }
      });
  };

  /**
   * Register router.
   * @param req
   * @param res
   */
  register = (req: Request, res: Response) => {
    this.db.userModel
      .find({
        username: req.body.username,
        password: req.body.password,
      })
      .then((user: User[]) => {
        if (user.length > 0) {
          res.send(false);
        } else {
          let newUser = new this.db.userModel({
            username: req.body.username,
            password: req.body.password,
          });
          newUser.save().then(() => {
            this.createSessionCookie(req.body.username, res).then(() => {
              res.end();
            });
          });
        }
      });
  };
}

//
// ─── MAIN: RUN APP ──────────────────────────────────────────────────────────────
//

const config = {
  middleware: [cors(), json(), urlencoded({ extended: true }), cookieParser()],
  dbConfig: {
    name: "apparel",
    port: 27017,
    modelNames: ["item"],
  },
};
const apparel = new App(config);
