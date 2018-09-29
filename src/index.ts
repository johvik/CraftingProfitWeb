import "./components/item"
import "./components/money"
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

type CostInfo = {
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

type Profit = {
  id: number,
  name: string,
  icon: string,
  profession: string,
  crafts?: CostInfo,
  cost: Cost
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

function updateXItem(costInfo: CostInfo | undefined, element: Element) {
  if (costInfo) {
    element.setAttribute("name", costInfo.item ? costInfo.item.name : "")
    element.setAttribute("quantity", costInfo.quantity + "")
    element.setAttribute("icon", costInfo.item ? costInfo.item.icon : "")
    element.setAttribute("vendor", costInfo.item ? (costInfo.item.price + "") : "")
    element.setAttribute("auction", costInfo.auctionPrice + "")
  } else {
    element.setAttribute("name", "")
    element.setAttribute("quantity", "")
    element.setAttribute("icon", "")
    element.setAttribute("vendor", "")
    element.setAttribute("auction", "")
  }
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
  if (!profit.crafts || !profit.crafts.auctionPrice) {
    updateXItem(profit.crafts, item)
    item.setAttribute("vendor", "")
    item.setAttribute("style", "")
  } else {
    item.setAttribute("style", "display:none")
  }

  if ((profit.crafts && profit.crafts.auctionPrice) || profit.cost.cost) {
    money.setAttribute("copper", ((profit.crafts ? (profit.crafts.auctionPrice * profit.crafts.quantity) : 0) - profit.cost.cost) + "")
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
  element.setAttribute("profession", profit.profession)
  const recipe = NeverNull(element.querySelector(".recipe"))
  const craftsItem = NeverNull(NeverNull(element.querySelector(".crafts")).firstElementChild)
  const reagents = NeverNull(element.querySelector(".reagents"))
  const item = NeverNull(element.querySelector(".item"))
  const money = NeverNull(element.querySelector(".money"))
  const unknown = NeverNull(element.querySelector(".unknown"))

  recipe.textContent = profit.name
  updateXItem(profit.crafts, craftsItem)
  if (!profit.crafts) {
    craftsItem.setAttribute("name", profit.name)
    craftsItem.setAttribute("icon", profit.icon)
  }
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

function applyFilters() {
  const emptyInfo = NeverNull(document.getElementById("empty-info"))
  const filterName = document.getElementById("filter-name") as HTMLInputElement
  const recipes = NeverNull(document.getElementById("recipes"))
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
  for (const i of recipes.children) {
    const profession = i.getAttribute("profession")
    if ((i.innerHTML || "").search(nameFilter) !== -1 && professionFilters.some(value => value === profession)) {
      empty = false
      i.setAttribute("style", "")
    } else {
      i.setAttribute("style", "display:none")
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
  try {
    const baseUrl = BASE_URL
    const auctions = await getJson(baseUrl + "/auctions/" + REALM_ID) as AuctionInfo
    const data = await getJson(baseUrl + "/data") as DataInfo
    const profits = calculateProfits(data.recipes, data.items, auctions)
    watchForUpdates(new Date(auctions.lastModified))
    updateRecipes(profits)
    applyFilters()
    connectNameFilter()
    connectProfessionFilter()
  } catch (error) {
    console.error("Failed to get data", error)
  }
})()