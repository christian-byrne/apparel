//
// ─── HTTP SERVER ────────────────────────────────────────────────────────────────
//
// Project: Apparel
// Author: Christian P. Byrne
//

import express from "express";
import { __prod__ } from "./constants";

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
        console.dir(req);
      }
    });
  };
}

export default ExpressServer;
