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
  weights: {
    [color: string]: number;
  };
  ordered?: string[];
}

interface ItemMaterials {
  materials: string[];
  weights: {
    [material: string]: number;
  };
}

interface ItemCondition {
  material: number;
  color: number;
}

interface Item {
  // A description that it is helpful to the user -- something that they can
  // see to help them remember what the item refers to.
  description: string;
  rating: number;
  // Broad category.
  category: BroadCategory;
  // Type of the given category.
  subCategory: string;
  // Hihgly specific type of given category.
  type: string;
  fit: ItemFit;
  length: string;
  size: MenGeneralSize | WomenGeneralSize | ShoeSize | FormalSize;
  brand: string;
  purchaseLocation?: string;
  purchaseDate?: Date;
  cost?: number;
  condition?: ItemCondition;
  washType?: string;
  material: ItemMaterials;

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
const styles = [
  // https://my-brandable.com/en/blog/types-of-fashion-styles-with-pictures-b65.html
  "vintage",
  "artsy",
  "casual",
  "grunge",
  "chic",
  "bohemian",
  "sexy",
];

interface User {
  username: string;
  password: string;
  outfits: string[];
  items: string[];
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
      color: {
        colors: [String],
        weight: {
          color: Number,
        },
        ordered: { type: [String], required: false },
      },
      material: {
        materials: [String],
        weights: {
          material: Number,
        },
      },
      brand: String,
      rating: Number,
      size: String || [Number, Number],
      purchaseLocation: { type: String, required: false },
      purchaseDate: { type: Date, required: false },
      cost: { type: Number, required: false },
      washType: { type: String, required: false },
      condition: {
        material: { type: Number, required: false },
        color: { type: Number, required: false },
      },
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
}

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
        console.dir(value);
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

    // 7. Bind routers.
    this.http.server.post("/login", this.login);
    this.http.server.post("/register", this.register);
    this.http.server.post("/post/item/:user", this.createItem);
    this.http.server.post("/post/outfit/:user", this.createOutfit);
    this.http.catch();

    // 8. Construct HTTP server.
    this.http.server.listen(this.port, () => {
      console.log(`listening on ${this.port} at ${this.ip}`);
    });
  }

  pushID = async (id, username, type) => {
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
