//
// ─── EXCEL PARSER ───────────────────────────────────────────────────────────────
//
// Project: Apparel
// Author: Christian P. Byrne
//

import { spreadsheetColors } from "./../public_html/csv-port/json_colors";
import { readFile, utils, WorkBook, WorkSheet } from "xlsx";

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
        // try {
        //   let conditionAvg = Math.floor(
        //     (this.conditionMap[record.condition] +
        //       this.conditionMap[record.colorCondition]) /
        //       2
        //   );
        //   record.condition =
        //     typeof conditionAvg === "number" ? conditionAvg : 10;
        // } catch (err) {
        //   record.condition = 10;
        // }
        record.condition = 10;

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

          if ( record.cost == "-" ) {
            record.cost = 0
          }
        delete record.style;
        delete record.sizeLength;
        delete record.colorCondition;
      }
    };
  }
}

export default ExcelParser;
