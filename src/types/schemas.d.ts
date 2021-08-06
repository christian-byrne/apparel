//
// ─── DB SCHEMAS ───────────────────────────────────────────────────────────
//
// Project: Apparel
// Author: Christian P. Byrne
//

export type ItemFit = "Oversized" | "Loose" | "Casual" | "Fitted" | "Tight";
export type BroadCategory = "shirt" | "tshirt" | "sweater";
export type MenGeneralSize =
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

export type WomenGeneralSize = number;
export type ShoeSize = number;
export type FormalSize = [number, number];
export interface ItemColors {
  colors: string[];
  weights: number[];
}
export interface ItemMaterials {
  materials: string[];
  weights: number[];
}
export interface ItemCondition {
  material: number;
  color: number;
}

export interface Item {
  description: string;
  rating: number;
  category: BroadCategory | string;
  subCategory: string;
  type: string;
  fit: ItemFit;
  image: string;
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
  styles: string[];
  color: ItemColors;
}

export interface Outfit {
  description: string;
  rating: number;
  category: BroadCategory;
  subCategory: string;
  type: string;
  formality: string[];
  setting: string[];
  image: string;
  event: string[];
  lastWorn: Date;
  temperautre: number;
  wearCount: number;
  weather: string[];
  notes?: string;
  items: string[];
  styles: string[];
}

export interface User {
  username: string;
  hash: string,
  salt: string,
  outfits: string[];
  items: string[];
  gender: "female" | "male";
  age: number;
  bio: string;
  height: string;
  weight: string;
  favColors: string[];
  favStyles: string;
  favType: string;
  favCategory: string;
  shoeSize: number;
  pantSize: string;
  image: string;
  size: {
    letter: MenGeneralSize | WomenGeneralSize | ShoeSize;
    number: FormalSize;
    dimensions?: string;
  };
}
