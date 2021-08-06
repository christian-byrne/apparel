//
// ─── DB IMPLEMENTATIONS ───────────────────────────────────────────────────────────
//
// Project: Apparel
// Author: Christian P. Byrne
//

import { Item, Outfit, User } from "apparelDB";
import { model, Model, Schema } from "mongoose";

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
      image: String,
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
      image: String,
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
      size: {
        letter: String,
        number: [
          { type: Number, required: false },
          { type: Number, required: false },
        ],
        dimensions: { type: String, required: false },
      },
      password: String,
      outfits: [String],
      items: [String],
      gender: String,
      age: Number,
      bio: String,
      image: String,
      height: String,
      weight: String,
      favColors: [String],
      favStyles: String,
      favType: String,
      favCategory: String,
      shoeSize: Number,
      pantSize: String,
    });

    this.itemModel = model<Item>("item", this.itemSchema);
    this.outfitModel = model<Outfit>("outfit", this.outfitSchema);
    this.userModel = model<User>("user", this.userSchema);

    this.verboseMsg = verboseMsg;
  }
}

export default Database;
