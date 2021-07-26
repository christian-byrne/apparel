/**
 * Apparel Web App.
 *
 * @author Christian P. Byrne
 */
import { model, Schema, connect } from "mongoose";
import { json, urlencoded } from "body-parser";
import { __prod__ } from "./constants";
import express from "express";
import cors from "cors";
import multer from "multer";
import "boostrap";
import "./scss/app.scss";
var styles = [
    // https://my-brandable.com/en/blog/types-of-fashion-styles-with-pictures-b65.html
    "vintage",
    "artsy",
    "casual",
    "grunge",
    "chic",
    "bohemian",
    "sexy",
];
var Database = /** @class */ (function () {
    function Database(verboseMsg) {
        this.itemSchema = new Schema({
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
        this.userSchema = new Schema({
            username: String,
            password: String,
        });
        this.itemModel = model("item", this.itemSchema);
        this.userModel = model("usre", this.userSchema);
        this.verboseMsg = verboseMsg;
    }
    return Database;
}());
var ExpressServer = /** @class */ (function () {
    function ExpressServer(staticFolder) {
        var _this = this;
        if (staticFolder === void 0) { staticFolder = "public_html"; }
        this.bindMiddleware = function (middlewareArray) {
            for (var _i = 0, middlewareArray_1 = middlewareArray; _i < middlewareArray_1.length; _i++) {
                var handler = middlewareArray_1[_i];
                _this.server.use(handler);
            }
        };
        this.server = express();
        this.server.use(express.static(staticFolder));
        this.server.use(express.json());
        this.server.get("/", function (req) {
            if (!__prod__) {
                console.dir(req);
            }
        });
    }
    return ExpressServer;
}());
var App = /** @class */ (function () {
    function App(options) {
        var _this = this;
        // 1. Update config (default values unless specified).
        var config = {
            port: __prod__ ? 80 : 5000,
            ip: __prod__ ? "143.198.57.139" : "127.0.0.1",
            mediaDir: __dirname + "/../public_html/img",
            middleware: [],
        };
        var verboseDefault = {
            log: false,
            verboseGap: "\n\n\n\n",
            alert: function (title) {
                if (title === void 0) { title = "section break"; }
                return console.log(verboseDefault.verboseGap + "___ " + title + " ___ " + verboseDefault.verboseGap);
            },
        };
        var dbDefault = {
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
        connect("mongodb://localhost:" + this.dbConfig.port + "/" + this.dbConfig.name, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        }).then(function (value) {
            if (!__prod__ && _this.verbose.log) {
                _this.verbose.alert("Mongoose Client Constructed");
                console.dir(value);
            }
        });
        // 4. Construct DB Resolvers/Models instance.
        this.db = new Database(this.verbose.alert);
        // 5. Construct HTTP Server
        this.http = new ExpressServer();
        // 6. Init and bind middleware to server.
        this.upload = multer({
            dest: "" + this.mediaDir,
        });
        this.http.bindMiddleware(this.middleware);
        // 7. Declare controllers and routers.
        // Login
        this.http.server.post("/login", function (req, res) {
            _this.db.userModel
                .find({
                username: req.body.username,
                password: req.body.password,
            })
                .then(function (user) {
                if (user.length === 1) {
                    res.send(true);
                }
                else {
                    res.send(false);
                }
            });
        });
        // Register.
        this.http.server.post("/register", function (req, res) {
            _this.db.userModel.find({
                username: req.body.username,
                password: req.body.password
            }).then(function (user) {
                if (user.length > 0) {
                    res.send(false);
                }
                else {
                    var newUser = new _this.db.userModel({
                        username: req.body.username,
                        password: req.body.password
                    });
                    newUser.save().then(function () {
                        res.end();
                    });
                }
            });
        });
    }
    return App;
}());
//
// ─── MAIN: RUN APP ──────────────────────────────────────────────────────────────
//
var config = {
    middleware: [cors(), json(), urlencoded({ extended: true })],
    dbConfig: {
        name: "apparel",
        port: 27017,
        modelNames: ["item"],
    },
};
var apparel = new App(config);
