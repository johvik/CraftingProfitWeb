export type PriceType =
  | "lowest"
  | "farOut"
  | "outlier"
  | "mean"
  | "firstQuartile"
  | "secondQuartile"
  | "thirdQuartile";

export type AuctionItem = {
  id: number;
  quantity: number;
  lastUpdate: string;
  lowest: number;
  farOut: number;
  outlier: number;
  mean: number;
  firstQuartile: number;
  secondQuartile: number;
  thirdQuartile: number;
};

export type AuctionInfo = {
  lastModified: string;
  auctions: AuctionItem[];
};

export type ItemInfo = {
  name: string;
  icon: string;
  updated: string;
  price?: number;
};

export type RecipeItem = {
  id: number;
  quantity: number;
};

export type RecipeInfo = {
  crafts?: RecipeItem;
  name: string;
  icon: string;
  profession: string;
  reagents: RecipeItem[];
  updated: string;
};

export type DataInfo = {
  items: [number, ItemInfo][];
  recipes: [number, RecipeInfo][];
};

export type LastUpdateInfo = {
  id: number;
  lastAttempt: string;
  lastModified: string;
};

export type LastUpdate = LastUpdateInfo[];

export type CItemInfo = {
  name?: string;
  icon?: string;
  quantity: number;
  auctions: AuctionItem[];
  vendor: number;
};

export type CostInfo = {
  item?: ItemInfo;
  auctions: AuctionItem[];
  quantity: number;
};

export type AuctionSum = {
  lowest: number;
  farOut: number;
  outlier: number;
  mean: number;
  firstQuartile: number;
  secondQuartile: number;
  thirdQuartile: number;
};

export type Cost = {
  auctionSum: AuctionSum;
  reagents: CostInfo[];
  unknown: CostInfo[];
};

export type Profit = {
  id: number;
  name: string;
  icon: string;
  profession: string;
  crafts?: CostInfo;
  cost: Cost;
};

export type CraftingProfitInterface = {
  updateData(): void;
};

export type ConnectedRealms = string[];
