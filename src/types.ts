export type AuctionItem = {
  id: number,
  lowestPrice: number,
  firstQuartile: number,
  secondQuartile: number,
  quantity: number,
  lastUpdate: string
}

export type AuctionInfo = {
  lastModified: string,
  auctions: AuctionItem[]
}

export type ItemInfo = {
  name: string,
  icon: string,
  updated: string,
  price?: number
}

export type RecipeItem = {
  id: number,
  quantity: number
}

export type RecipeInfo = {
  crafts?: RecipeItem,
  name: string,
  icon: string,
  profession: string,
  reagents: RecipeItem[],
  updated: string
}

export type ItemInfos = {
  [id: number]: ItemInfo | undefined
}

export type RecipeInfos = {
  [id: number]: RecipeInfo | undefined
}

export type DataInfo = {
  items: ItemInfos,
  recipes: RecipeInfos
}