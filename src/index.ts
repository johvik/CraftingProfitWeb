import "./components/item"
import { ProfitDom } from "./components/profit"
import { AuctionInfo, AuctionItem, DataInfo, RecipeInfos, ItemInfos, RecipeInfo, RecipeItem, ItemInfo } from "./types"
import { getJson, NeverNull, NeverUndefined } from "./utils"
import { Update } from "./components/update"
import { BASE_URL, REALM_ID } from "./constants"
import { Filters } from "./components/filters"

type AuctionInfos = { [id: number]: AuctionItem | undefined }

function findAuctionPrice(id: number, auctions: AuctionInfos) {
  const auction = auctions[id]
  if (auction) {
    return auction.lowestPrice
  }
  return 0
}

export type CostInfo = {
  item?: ItemInfo,
  auctionPrice: number,
  quantity: number
}

function findCostInfo(crafts: RecipeItem, items: ItemInfos, auctions: AuctionInfos): CostInfo {
  const item = items[crafts.id]
  const auctionPrice = findAuctionPrice(crafts.id, auctions)
  return {
    item: item,
    auctionPrice: auctionPrice,
    quantity: crafts.quantity
  }
}

type Cost = {
  cost: number,
  reagents: CostInfo[],
  unknown: CostInfo[]
}

function findCost(recipe: RecipeInfo, items: ItemInfos, auctions: AuctionInfos) {
  return recipe.reagents.reduce(
    (object: Cost, reagent) => {
      const costInfo = findCostInfo(reagent, items, auctions)
      const cost =
        ((costInfo.item ? costInfo.item.price : 0) || costInfo.auctionPrice) * reagent.quantity
      object.reagents.push(costInfo)
      if (cost) {
        object.cost += cost
      } else {
        object.unknown.push(costInfo)
      }
      return object
    },
    {
      cost: 0,
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

function calculateProfits(recipes: RecipeInfos, items: ItemInfos, auctionsArray: AuctionInfo) {
  // Convert from an array to help with lookups
  const auctions: AuctionInfos = auctionsArray.auctions.reduce((object: AuctionInfos, auction) => {
    object[auction.id] = auction
    delete auction.id
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
    const profitA = (a.crafts ? (a.crafts.auctionPrice * a.crafts.quantity) : 0) - a.cost.cost
    const profitB = (b.crafts ? (b.crafts.auctionPrice * b.crafts.quantity) : 0) - b.cost.cost
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
  private readonly filters = new Filters(this.domData)
  private readonly update = new Update(this)

  updateData() {
    const self = this;
    (async function () {
      try {
        const baseUrl = BASE_URL
        const auctions = await getJson(baseUrl + "/auctions/" + REALM_ID) as AuctionInfo
        const data = await getJson(baseUrl + "/data") as DataInfo
        const profits = calculateProfits(data.recipes, data.items, auctions)
        self.update.success(new Date(auctions.lastModified))
        self.updateRecipes(profits)
        self.filters.apply()
      } catch (error) {
        console.error("Failed to get data", error)
      }
      self.update.done()
    })()
  }

  private updateRecipes(profits: Profit[]) {
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

    for (const i of this.domData) {
      i.dom.update(i.profit)
      fragment.appendChild(i.dom.element)
    }
    recipesBody.appendChild(fragment)
  }
}

const craftingProfit = new CraftingProfit()
craftingProfit.updateData()