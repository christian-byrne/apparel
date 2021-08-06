/**
 * Apparel Web App.
 *
 * @author Christian P. Byrne
 */

import { connect, Model } from "mongoose";
import { json, urlencoded } from "body-parser";
import { __prod__ } from "./constants";
import { NextFunction, Request, Response } from "express";
import cors from "cors";
import multer from "multer";
import "cookie-parser";
import cookieParser from "cookie-parser";
import { readdir } from "fs/promises";
import "./style-dict";
import Database from "./database";
import ExpressServer from "./server";
import { App, FilterQuery1D } from "options";
import ExcelParser from "./excel-parser";
import { Item, Outfit, User } from "./types/schemas";

const config = {
  middleware: [cookieParser(), cors(), json(), urlencoded({ extended: true })],
  DBname: "apparel",
};

interface Apparel extends App {
  sessionKeys: {
    [key: string]: [number, number];
  };
}

class Apparel {
  constructor(options: App | any) {
    const config = {
      port: __prod__ ? 80 : 5000,
      ip: __prod__ ? "143.198.57.139" : "127.0.0.1",
      mediaDir: `${__dirname}/../public_html/img/user-data`,
      middleware: [],
      log: true,
      verboseGap: "\n\n\n\n",
      alert: (title = "section break", objects) => {
        if (!__prod__ && config.log) {
          console.log(
            `${config.verboseGap}___ ${title} ___ ${config.verboseGap}`
          );
          if (objects) {
            for (const obj of objects) {
              console.dir(obj);
            }
          }
        }
      },
      DBname: "",
      DBport: 27017,
      modelNames: [],
    };

    Object.assign(config, options);
    Object.assign(this, config);

    // Database.
    connect(`mongodb://localhost:${this.DBport}/${this.DBname}`, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }).then((value: typeof import("mongoose")) => {
      this.alert("Mongoose Client Constructed");
    });
    this.db = new Database(this.alert);

    // Server.
    this.http = new ExpressServer();
    this.upload = multer({
      dest: `${this.mediaDir}`,
    });
    this.csvImporter = new ExcelParser(
      "public_html/csv-port/items-copy.xlsx",
      "Wardrobe"
    );
    this.sessionKeys = {};
    setInterval(() => {
      let now = Date.now();
      for (const key in this.sessionKeys) {
        if (this.sessionKeys[key][1] < now - 20000) {
          delete this.sessionKeys[key];
        }
      }
    }, 2000);
    this.http.bindMiddleware([this.authenticate]);
    this.http.bindStatic();
    this.http.bindMiddleware(this.middleware);

    // 4. Routes.
    this.http.server.post("/login", this.login);
    this.http.server.post("/register", this.register);
    this.http.server.post(
      "/post/item/:user",
      this.upload.single("image"),
      this.createItem
    );
    this.http.server.post(
      "/post/outfit/:user",
      this.upload.single("image"),
      this.createOutfit
    );
    this.http.server.post(
      "/user/details/:user",
      this.upload.single("image"),
      this.userDetails
    );
    this.http.server.get("/get/items/:user", this.getItems);
    this.http.server.get("/get/outfits/:user", this.getOutfits);
    this.http.server.get("/get/oneitem/:id", this.getOneFromId);
    this.http.server.get("/search/all/:user/:keyword", this.searchItems);
    this.http.server.get("/filenames/:dir", this.getFileNames);
    this.http.server.post("/search/field", this.filterItems);
    this.http.server.post("/user/gender", this.updateGender);
    this.http.catch();

    this.http.server.listen(this.port, () => {
      this.alert(`listening on ${this.port} at ${this.ip}`);
    });
  }

  // Routers.
  userDetails = (req: Request, res: Response) => {
    if (req.file) {
      Object.assign(req.body, { picture: req.file.filename });
    }
  };

  updateGender = (req: Request, res: Response) => {
    this.db.userModel.findOne({ username: req.body.username }).then((user) => {
      user.gender = req.body.gender;
      user.save().then(() => {
        res.end();
      });
    });
  };

  importItemCSV = async (username: string) => {
    return await this.csvImporter.parseExcel().then(async () => {
      let csv = this.csvImporter.csvJson;
      let itemCt = 1;
      for (const record of csv) {
        if (typeof record.condition !== "number" || typeof record.condition == "string" ) {
          record.condition = 10;
        }
        let mutation = new this.db.itemModel(record);
        await mutation.save().then(async (savedItem) => {
          const newId = savedItem._id;
          await this.pushID(newId, username, "items").catch((reason) => {
            this.alert(reason);
          }).then(() => console.log(itemCt));
        });
        itemCt++
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
        this.alert(reason);
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
      .catch((reason) => this.alert(reason));
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
        this.alert(`User: ${username}  --  ${type} Array Updated`, [success]);
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
    if (req.file) {
      Object.assign(req.body, { picture: req.file.filename });
    }
    let mutation = new this.db.itemModel(req.body);
    this.alert("Item Object Posted:", [mutation]);
    mutation.save().then((savedItem) => {
      const newId = savedItem._id;
      this.pushID(newId, req.params.user, "items").then(() => {
        res.end();
      });
    });
  };

  createOutfit = (req: Request, res: Response) => {
    if (req.file) {
      Object.assign(req.body, { picture: req.file.filename });
    }
    let mutation = new this.db.outfitModel(req.body);
    this.alert("Outfit Object Posted:", [mutation]);
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
      this.alert("Session Cookie", req.cookies);
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

const x = new Apparel(config);
x.importItemCSV("hepburn@gmail.com").then(() => {
  console.log("\n\nFinished")
})