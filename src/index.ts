import "./components/item"
import { ProfitDom } from "./components/profit"
import { AuctionInfo, AuctionItem, DataInfo, RecipeInfos, ItemInfos, RecipeInfo, RecipeItem, ItemInfo } from "./types"
import { getJson, NeverNull, NeverUndefined } from "./utils"
import { watchForUpdates } from "./components/updated"
import { BASE_URL, REALM_ID } from "./constants"

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

const domData: {
  profit: Profit,
  dom: ProfitDom
}[] = []

function updateRecipes(profits: Profit[]) {
  const recipesBody = NeverNull(document.getElementById("recipes"))

  const fragment = document.createDocumentFragment()

  for (const i in profits) {
    const profit = profits[i]
    const dom = new ProfitDom()
    domData.push({
      profit: profit,
      dom: dom
    })
    dom.update(profit)
    fragment.appendChild(dom.element)
  }
  recipesBody.appendChild(fragment)
}

function applyFilters() {
  const emptyInfo = NeverNull(document.getElementById("empty-info"))
  const filterName = document.getElementById("filter-name") as HTMLInputElement
  const nameFilter = new RegExp(filterName.value, "i")
  const checkboxes = document.querySelectorAll("#filters input")
  const professionFilters = []
  for (const i of checkboxes) {
    const checkbox = i as HTMLInputElement
    if (checkbox.checked && checkbox.value !== "all") {
      professionFilters.push(checkbox.value)
    }
  }

  let empty = true
  for (const i of domData) {
    if ((i.dom.element.innerHTML || "").search(nameFilter) !== -1 && professionFilters.some(value => value === i.profit.profession)) {
      empty = false
      i.dom.element.style.display = ""
    } else {
      i.dom.element.style.display = "none"
    }
  }

  if (empty) {
    emptyInfo.setAttribute("style", "")
  } else {
    emptyInfo.setAttribute("style", "display:none")
  }
}

function connectNameFilter() {
  const filterName = document.getElementById("filter-name") as HTMLInputElement
  filterName.oninput = applyFilters
}

function onProfessionFilterChange(event: Event) {
  const element = event.srcElement as HTMLInputElement
  const checked = element.checked
  const profession = element.value

  if (profession === "all") {
    const checkboxes = document.querySelectorAll("#filters input")
    for (const i of checkboxes) {
      const checkbox = i as HTMLInputElement
      checkbox.checked = checked
    }
  } else {
    const checkboxes = document.querySelectorAll("#filters input")
    let allUnchecked = true
    for (const i of checkboxes) {
      const checkbox = i as HTMLInputElement
      if (checkbox.value !== "all") {
        allUnchecked = allUnchecked && !checkbox.checked
      }
    }
    const allCheckbox = document.querySelector("#filters input") as HTMLInputElement
    allCheckbox.checked = !allUnchecked
  }
  applyFilters()
}

function connectProfessionFilter() {
  const checkboxes = document.querySelectorAll("#filters input")
  for (const i of checkboxes) {
    const checkbox = i as HTMLInputElement
    checkbox.onchange = onProfessionFilterChange
  }
}

(async function () {
  connectNameFilter()
  connectProfessionFilter()
  try {
    const baseUrl = BASE_URL
    const auctions = await getJson(baseUrl + "/auctions/" + REALM_ID) as AuctionInfo
    const data = await getJson(baseUrl + "/data") as DataInfo
    const profits = calculateProfits(data.recipes, data.items, auctions)
    watchForUpdates(new Date(auctions.lastModified))
    updateRecipes(profits)
    applyFilters()
  } catch (error) {
    console.error("Failed to get data", error)
  }
})()