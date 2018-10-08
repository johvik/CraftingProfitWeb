import { ProfitDom } from "./components/profit"
import { AuctionInfo, DataInfo, RecipeInfos, ItemInfos, RecipeInfo, RecipeItem, ItemInfo, PriceType } from "./types"
import { getJson, NeverNull, NeverUndefined } from "./utils"
import { Update } from "./components/update"
import { BASE_URL, REALM_ID } from "./constants"
import { Filters } from "./components/filters"
import { Settings } from "./components/settings"
import { AuctionPrice } from "./components/item"
import { History } from "./components/history"

type AuctionItemInfo = {
  prices: AuctionPrice[] // Oldest first
}

type AuctionInfos = { [id: number]: AuctionItemInfo | undefined }

function findAuctionPrices(id: number, auctions: AuctionInfos): AuctionPrice[] {
  const auction = auctions[id]
  if (auction) {
    return auction.prices
  }
  return []
}

export type CostInfo = {
  item?: ItemInfo,
  auctionPrices: AuctionPrice[],
  quantity: number
}

function findCostInfo(crafts: RecipeItem, items: ItemInfos, auctions: AuctionInfos): CostInfo {
  const item = items[crafts.id]
  const auctionPrices = findAuctionPrices(crafts.id, auctions)
  return {
    item: item,
    auctionPrices: auctionPrices,
    quantity: crafts.quantity
  }
}

type Cost = {
  auctionPrice: AuctionPrice
  reagents: CostInfo[],
  unknown: CostInfo[]
}

function findCost(recipe: RecipeInfo, items: ItemInfos, auctions: AuctionInfos) {
  return recipe.reagents.reduce(
    (object: Cost, reagent) => {
      const costInfo = findCostInfo(reagent, items, auctions)
      const prices = costInfo.auctionPrices.length
      const lowestCost =
        ((costInfo.item ? costInfo.item.price : 0) || (prices > 0 ? costInfo.auctionPrices[prices - 1].lowestPrice : 0)) * reagent.quantity
      const q1Cost =
        ((costInfo.item ? costInfo.item.price : 0) || (prices > 0 ? costInfo.auctionPrices[prices - 1].firstQuartile : 0)) * reagent.quantity
      const q2Cost =
        ((costInfo.item ? costInfo.item.price : 0) || (prices > 0 ? costInfo.auctionPrices[prices - 1].secondQuartile : 0)) * reagent.quantity
      object.reagents.push(costInfo)
      if (lowestCost) {
        object.auctionPrice.lowestPrice += lowestCost
        object.auctionPrice.firstQuartile += q1Cost
        object.auctionPrice.secondQuartile += q2Cost
      } else {
        object.unknown.push(costInfo)
      }
      return object
    },
    {
      auctionPrice: {
        quantity: 0,
        lowestPrice: 0,
        firstQuartile: 0,
        secondQuartile: 0,
        date: new Date(0)
      },
      reagents: [],
      unknown: []
    }
  )
}

export type Profit = {
  id: number,
  name: string,
  icon: string,
  profession: string,
  crafts?: CostInfo,
  cost: Cost,
}

export function auctionProfit(profit: Profit, craftsPriceType: PriceType, costPriceType: PriceType) {
  return (profit.crafts ?
    Math.floor((profit.crafts.auctionPrices.length > 0 ?
      profit.crafts.auctionPrices[profit.crafts.auctionPrices.length - 1][craftsPriceType] : 0) * profit.crafts.quantity * 0.95) : 0) - profit.cost.auctionPrice[costPriceType]
}

function calculateProfit(id: number, recipe: RecipeInfo, items: ItemInfos, auctions: AuctionInfos): Profit {
  const crafts = recipe.crafts ? findCostInfo(recipe.crafts, items, auctions) : undefined
  return {
    id: id,
    name: recipe.name,
    icon: recipe.icon,
    profession: recipe.profession,
    crafts: crafts,
    cost: findCost(recipe, items, auctions)
  }
}

function calculateProfits(recipes: RecipeInfos, items: ItemInfos, auctionsArray: AuctionInfo, craftsPriceType: PriceType, costPriceType: PriceType) {
  // Convert from an array to help with lookups
  const auctions: AuctionInfos = auctionsArray.auctions.reduce((object: AuctionInfos, auction) => {
    const itemInfo = object[auction.id]
    const price = {
      quantity: auction.quantity,
      lowestPrice: auction.lowestPrice,
      firstQuartile: auction.firstQuartile,
      secondQuartile: auction.secondQuartile,
      date: new Date(auction.lastUpdate)
    }
    if (itemInfo) {
      // Auctions are sorted by date on the server
      itemInfo.prices.push(price)
    } else {
      object[auction.id] = {
        prices: [price]
      }
    }
    return object
  }, {})
  const profits: Profit[] = []

  for (const key in recipes) {
    const recipe = NeverUndefined(recipes[key])
    profits.push(calculateProfit(Number(key), recipe, items, auctions))
  }

  // Sort by: number of unknowns, profit, id
  profits.sort((a, b) => {
    let diff = a.cost.unknown.length - b.cost.unknown.length
    if (diff) {
      return diff
    }
    const profitA = auctionProfit(a, craftsPriceType, costPriceType)
    const profitB = auctionProfit(b, craftsPriceType, costPriceType)
    diff = profitB - profitA
    if (diff) {
      return diff
    }
    return a.id - b.id
  })
  return profits
}

export type DomData = {
  profit: Profit,
  dom: ProfitDom
}

export class CraftingProfit {
  private readonly domData: DomData[] = []
  private readonly settings = new Settings(this)
  private readonly filters = new Filters(this.domData)
  private readonly update = new Update(this, this.settings)

  updateData() {
    const self = this;
    (async function () {
      try {
        const baseUrl = BASE_URL
        const auctions = await getJson(baseUrl + "/auctions/" + REALM_ID) as AuctionInfo
        const data = await getJson(baseUrl + "/data") as DataInfo
        const craftsPriceType: PriceType = self.settings.getCraftsPriceType()
        const costPriceType: PriceType = self.settings.getCostPriceType()
        const profits = calculateProfits(data.recipes, data.items, auctions, craftsPriceType, costPriceType)
        self.update.success(new Date(auctions.lastModified))
        self.updateRecipes(profits)
        self.filters.apply()
      } catch (error) {
        console.error("Failed to get data", error)
        self.update.error()
      }
      self.update.done()
    })()
  }

  private updateRecipes(profits: Profit[]) {
    History.hide()
    const recipesBody = NeverNull(document.getElementById("recipes"))

    while (recipesBody.lastChild) {
      recipesBody.removeChild(recipesBody.lastChild)
    }
    while (this.domData.length > profits.length) {
      this.domData.pop()
    }
    for (let i = 0; i < profits.length; i++) {
      if (this.domData.length <= i) {
        this.domData.push({
          profit: profits[i],
          dom: new ProfitDom()
        })
      } else {
        this.domData[i].profit = profits[i]
      }
    }

    const fragment = document.createDocumentFragment()

    const craftsPriceType = this.settings.getCraftsPriceType()
    const costPriceType = this.settings.getCostPriceType()
    for (const i of this.domData) {
      i.dom.update(i.profit, craftsPriceType, costPriceType)
      fragment.appendChild(i.dom.element)
    }
    recipesBody.appendChild(fragment)
  }
}

const craftingProfit = new CraftingProfit()
craftingProfit.updateData()