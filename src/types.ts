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

export type Item = {
  name: string,
  icon: string,
  price: number,
  stackSize: number
}

type ItemInfo = {
  updated: string,
  item?: Item
}

export type ItemInfos = {
  [id: number]: ItemInfo | undefined
}

export type RecipeItem = {
  id: number,
  quantity: number
}

export type Recipe = {
  name: string,
  rank: number,
  trade: string,
  reagents: RecipeItem[],
  crafts: RecipeItem
}

type RecipeInfo = {
  updated: string,
  recipe?: Recipe
}

export type RecipeInfos = {
  [id: number]: RecipeInfo | undefined
}