import "./components/item"
import "./components/money"
import { AuctionInfo, AuctionItem, Item, ItemInfos, Recipe, RecipeInfos, RecipeItem } from "./types"
import { getJson, NeverNull, NeverUndefined } from "./utils"

type AuctionInfos = { [id: number]: AuctionItem | undefined }

function findAuctionPrice(id: number, auctions: AuctionInfos) {
  const auction = auctions[id]
  if (auction) {
    return auction.lowestPrice
  }
  return 0
}

type CostInfo = {
  item?: Item,
  auctionPrice: number,
  quantity: number
}

function findCostInfo(reagent: RecipeItem, items: ItemInfos, auctions: AuctionInfos): CostInfo {
  const item = items[reagent.id]
  const auctionPrice = findAuctionPrice(reagent.id, auctions)
  if (item) {
    return {
      item: item.item,
      auctionPrice: auctionPrice,
      quantity: reagent.quantity
    }
  }
  return {
    auctionPrice: auctionPrice,
    quantity: reagent.quantity
  }
}

type Cost = {
  cost: number,
  reagents: CostInfo[],
  unknown: CostInfo[]
}

function findCost(recipe: Recipe, items: ItemInfos, auctions: AuctionInfos) {
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

type Profit = {
  id: number,
  name: string,
  crafts: CostInfo,
  cost: Cost
}

function calculateProfit(id: number, recipe: Recipe, items: ItemInfos, auctions: AuctionInfos): Profit {
  const crafts = findCostInfo(recipe.crafts, items, auctions)
  return {
    id: id,
    name: recipe.name,
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
    const recipe = NeverUndefined(recipes[key]).recipe
    if (recipe) {
      profits.push(calculateProfit(Number(key), recipe, items, auctions))
    }
  }

  // Sort by: number of unknowns, profit, id
  profits.sort((a, b) => {
    let diff = a.cost.unknown.length - b.cost.unknown.length
    if (diff) {
      return diff
    }
    const profitA = (a.crafts.auctionPrice * a.crafts.quantity) - a.cost.cost
    const profitB = (b.crafts.auctionPrice * b.crafts.quantity) - b.cost.cost
    diff = profitB - profitA
    if (diff) {
      return diff
    }
    return a.id - b.id
  })
  return profits
}

type FilterOption = {
  key: string,
  text: string
}

function calculateFilterOptions(recipes: RecipeInfos): FilterOption[] {
  const options: { [id: string]: string | undefined } = {}

  for (const key in recipes) {
    const recipe = NeverUndefined(recipes[key]).recipe
    if (recipe) {
      const key = recipe.trade
      if (!options[key]) {
        const match = key.toLowerCase().match(/[a-z]+_(.+)/)
        if (match) {
          options[key] = match[1].charAt(0).toUpperCase() + match[1].slice(1)
        }
      }
    }
  }

  const array: FilterOption[] = []
  for (const key in options) {
    const text = NeverUndefined(options[key])
    array.push({ key: key, text: text })
  }
  return array.sort()
}

const template = document.createElement("template")

template.innerHTML = `
<tr>
  <td class="recipe"></td>
  <td class="crafts"><x-item></x-item></td>
  <td class="reagents"></td>
  <td>
    <x-item class="item"></x-item>
    <x-money class="money"></x-money>
    <span class="unknown">
      - <span></span>
    </span>
  </td>
</tr>
`

function updateXItem(costInfo: CostInfo, element: Element) {
  element.setAttribute("name", costInfo.item ? costInfo.item.name : "")
  element.setAttribute("quantity", costInfo.quantity + "")
  element.setAttribute("icon", costInfo.item ? costInfo.item.icon : "")
  element.setAttribute("vendor", costInfo.item ? (costInfo.item.price + "") : "")
  element.setAttribute("auction", costInfo.auctionPrice + "")
}

function updateReagents(reagents: CostInfo[], element: Element) {
  while (element.lastChild && element.childElementCount > reagents.length) {
    element.removeChild(element.lastChild)
  }
  while (element.childElementCount < reagents.length) {
    element.appendChild(document.createElement("x-item"))
  }
  if (element.childElementCount !== reagents.length) {
    throw new Error(`Element count ${element.childElementCount} does not match profit length ${reagents.length}`)
  }

  for (const i in reagents) {
    updateXItem(reagents[i], element.children[i])
  }
}

function updateProfit(profit: Profit, item: Element, money: Element, unknownMain: Element) {
  if (!profit.crafts.auctionPrice) {
    updateXItem(profit.crafts, item)
    item.setAttribute("vendor", "")
    item.setAttribute("style", "")
  } else {
    item.setAttribute("style", "display:none")
  }

  if (profit.crafts.auctionPrice || profit.cost.cost) {
    money.setAttribute("copper", (profit.crafts.auctionPrice - profit.cost.cost) + "")
  } else {
    money.setAttribute("style", "display:none")
  }

  const unknown = NeverNull(unknownMain.querySelector("span"))
  if (profit.cost.unknown.length === 0) {
    unknownMain.setAttribute("style", "display:none")
  } else {
    unknownMain.setAttribute("style", "")

    while (unknown.lastChild && unknown.childElementCount > profit.cost.unknown.length) {
      unknown.removeChild(unknown.lastChild)
    }
    while (unknown.childElementCount < profit.cost.unknown.length) {
      unknown.appendChild(document.createElement("x-item"))
    }
    if (unknown.childElementCount !== profit.cost.unknown.length) {
      throw new Error(`Element count ${unknown.childElementCount} does not match profit length ${profit.cost.unknown.length}`)
    }

    for (const i in profit.cost.unknown) {
      updateXItem(profit.cost.unknown[i], unknown.children[i])
    }
  }
}

function updateRecipe(element: Element, profit: Profit) {
  const recipe = NeverNull(element.querySelector(".recipe"))
  const craftsItem = NeverNull(NeverNull(element.querySelector(".crafts")).firstElementChild)
  const reagents = NeverNull(element.querySelector(".reagents"))
  const item = NeverNull(element.querySelector(".item"))
  const money = NeverNull(element.querySelector(".money"))
  const unknown = NeverNull(element.querySelector(".unknown"))

  recipe.textContent = profit.name
  updateXItem(profit.crafts, craftsItem)
  craftsItem.setAttribute("vendor", "")
  updateReagents(profit.cost.reagents, reagents)
  updateProfit(profit, item, money, unknown)
}

function updateRecipes(profits: Profit[]) {
  const recipesBody = NeverNull(document.getElementById("recipes"))

  const fragment = document.createDocumentFragment()

  // Reuse old elemets
  while (recipesBody.lastChild) {
    fragment.appendChild(recipesBody.removeChild(recipesBody.lastChild))
  }
  while (fragment.lastChild && fragment.childElementCount > profits.length) {
    fragment.removeChild(fragment.lastChild)
  }

  // Add new ones if needed
  while (fragment.childElementCount < profits.length) {
    fragment.appendChild(template.content.cloneNode(true))
  }
  if (fragment.childElementCount !== profits.length) {
    throw new Error(`Element count ${fragment.childElementCount} does not match profit length ${profits.length}`)
  }

  for (const i in profits) {
    updateRecipe(fragment.children[i], profits[i])
  }
  recipesBody.appendChild(fragment)
}

(async function () {
  try {
    const baseUrl = "https://localhost:3000"
    const auctions = await getJson(baseUrl + "/auctions/1") as AuctionInfo
    const items = await getJson(baseUrl + "/items") as ItemInfos
    const recipes = await getJson(baseUrl + "/recipes") as RecipeInfos
    const profits = calculateProfits(recipes, items, auctions)
    const filters = calculateFilterOptions(recipes)
    updateRecipes(profits)
    console.log(filters) // TODO
  } catch (error) {
    console.error("Failed to get data", error)
  }
})()