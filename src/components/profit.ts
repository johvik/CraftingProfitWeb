import { Money, formatMoney } from "./money"
import { Profit, CostInfo } from "../index"
import { Item, Items, ItemInfo } from "./item"

export class ProfitDom {
  readonly element = document.createElement("tr")
  private readonly recipe = document.createElement("a")
  private readonly crafts = new Item()
  private readonly reagents = new Items()
  private readonly profitItem = new Item()
  private readonly money = new Money()
  private readonly unknown = document.createElement("span")
  private readonly unknownCost = new Items()

  constructor() {
    const recipe = document.createElement("td")
    recipe.appendChild(this.recipe)

    const crafts = document.createElement("td")
    crafts.appendChild(this.crafts.element)

    const reagents = document.createElement("td")
    reagents.appendChild(this.reagents.element)

    const profit = document.createElement("td")
    profit.appendChild(this.profitItem.element)
    profit.appendChild(this.money.element)
    profit.appendChild(this.unknown)
    this.unknown.textContent = " - "
    this.unknown.appendChild(this.unknownCost.element)

    this.element.appendChild(recipe)
    this.element.appendChild(crafts)
    this.element.appendChild(reagents)
    this.element.appendChild(profit)
  }

  private static craftsItemInfo(profit: Profit, useNameAndIcon: boolean): ItemInfo {
    if (profit.crafts) {
      const item = profit.crafts.item
      return {
        name: item ? item.name : undefined,
        icon: item ? item.icon : undefined,
        quantity: profit.crafts.quantity,
        auction: profit.crafts.auctionPrice,
        vendor: item ? (item.price || 0) : 0
      }
    }
    return {
      name: useNameAndIcon ? profit.name : undefined,
      icon: useNameAndIcon ? profit.icon : undefined,
      quantity: 1,
      auction: 0,
      vendor: 0
    }
  }

  private static itemInfo(costInfo: CostInfo): ItemInfo {
    const item = costInfo.item
    return {
      name: item ? item.name : undefined,
      icon: item ? item.icon : undefined,
      quantity: costInfo.quantity,
      auction: costInfo.auctionPrice,
      vendor: item ? (item.price || 0) : 0
    }
  }

  private static itemInfos(costInfos: CostInfo[]): ItemInfo[] {
    return costInfos.map(ProfitDom.itemInfo)
  }

  update(profit: Profit) {
    this.recipe.textContent = profit.name
    this.recipe.href = `https://www.wowhead.com/spell=${profit.id}`

    this.crafts.update(ProfitDom.craftsItemInfo(profit, true))

    this.reagents.update(ProfitDom.itemInfos(profit.cost.reagents))

    this.profitItem.update(ProfitDom.craftsItemInfo(profit, false))
    if (!profit.crafts || !profit.crafts.auctionPrice) {
      this.profitItem.element.style.display = ""
    } else {
      this.profitItem.element.style.display = "none"
    }
    this.money.update((profit.crafts ? (profit.crafts.auctionPrice * profit.crafts.quantity) : 0) - profit.cost.cost)
    if ((profit.crafts && profit.crafts.auctionPrice) || profit.cost.cost) {
      this.money.element.style.display = ""
    } else {
      this.money.element.style.display = "none"
    }
    if (profit.cost.cost) {
      let title = `Cost: ${formatMoney(profit.cost.cost)}`
      if (profit.cost.unknown.length > 0) {
        title += " + unknown"
      }
      this.money.element.title = title
    } else {
      this.money.element.title = ""
    }
    this.unknownCost.update(ProfitDom.itemInfos(profit.cost.unknown))
    if (profit.cost.unknown.length === 0) {
      this.unknown.style.display = "none"
    } else {
      this.unknown.style.display = ""
    }
  }
}