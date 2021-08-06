//
// ─── APP AND ROUTERS ────────────────────────────────────────────────────────────
//
// Project: Apparel
// Author: Christian P. Byrne
//

import multer from "multer";
import ExcelParser from "./../excel-parser";
import Database from "./../database";
import ExpressServer from "./../server";

interface DBConfig {
  DBname: string;
  DBport: number;
  modelNames: string[];
}

interface VerboseConfig {
  log: boolean;
  verboseGap: string;
  alert: (title: string, objects?: any[]) => void;
}

export interface App extends DBConfig, VerboseConfig {
  port: number;
  ip: string;
  mediaDir: string;
  db: Database;
  upload: multer.Multer;
  middleware: any[];
  http: ExpressServer;
  sessionKeys: {
    [key: string]: [number, number];
  };
  csvImporter: ExcelParser;
}

export interface FilterQuery1D {
  username: string;
  keyword: string;
  field: string;
}
