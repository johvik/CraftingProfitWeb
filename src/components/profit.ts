import { Money, formatMoney } from "./money"
import { Profit, CostInfo, auctionProfit } from "../index"
import { Item, Items, ItemInfo, AuctionPrice } from "./item"
import { PriceType } from "../types"

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
        auctionPrices: profit.crafts.auctionPrices,
        vendor: item ? (item.price || 0) : 0
      }
    }
    return {
      name: useNameAndIcon ? profit.name : undefined,
      icon: useNameAndIcon ? profit.icon : undefined,
      quantity: 1,
      auctionPrices: [],
      vendor: 0
    }
  }

  private static itemInfo(costInfo: CostInfo): ItemInfo {
    const item = costInfo.item
    return {
      name: item ? item.name : undefined,
      icon: item ? item.icon : undefined,
      quantity: costInfo.quantity,
      auctionPrices: costInfo.auctionPrices,
      vendor: item ? (item.price || 0) : 0
    }
  }

  private static itemInfos(costInfos: CostInfo[]): ItemInfo[] {
    return costInfos.map(ProfitDom.itemInfo)
  }

  private static getProfitPrice(profit: Profit, unknown: boolean, craftsPriceType: PriceType, costPriceType: PriceType) {
    let price = `${formatMoney(auctionProfit(profit, craftsPriceType, costPriceType))}`
    if (unknown) {
      price += " - unknown"
    }
    return price
  }

  private static getCostPrice(auctionPrice: AuctionPrice, unknown: boolean, priceType: PriceType) {
    let price = `${formatMoney(auctionPrice[priceType])}`
    if (unknown) {
      price += " + unknown"
    }
    return price
  }

  update(profit: Profit, craftsPriceType: PriceType, costPriceType: PriceType) {
    this.recipe.textContent = profit.name
    this.recipe.href = `https://www.wowhead.com/spell=${profit.id}`

    this.crafts.update(ProfitDom.craftsItemInfo(profit, true))

    this.reagents.update(ProfitDom.itemInfos(profit.cost.reagents))

    this.profitItem.update(ProfitDom.craftsItemInfo(profit, false))
    if (!profit.crafts || profit.crafts.auctionPrices.length === 0) {
      this.profitItem.element.style.display = ""
    } else {
      this.profitItem.element.style.display = "none"
    }
    this.money.update(auctionProfit(profit, craftsPriceType, costPriceType))
    let title = ""
    if ((profit.crafts && profit.crafts.auctionPrices.length > 0) || profit.cost.auctionPrice[costPriceType]) {
      this.money.element.style.display = ""
    } else {
      this.money.element.style.display = "none"
    }
    const unknown = profit.cost.unknown.length > 0
    if (profit.crafts && profit.crafts.auctionPrices.length > 0) {
      title += `Profit\nLowest: ${ProfitDom.getProfitPrice(profit, unknown, "lowestPrice", "lowestPrice")}`
      title += `\n     LQ1: ${ProfitDom.getProfitPrice(profit, unknown, "lowestPrice", "firstQuartile")}`
      title += `\n     LQ2: ${ProfitDom.getProfitPrice(profit, unknown, "lowestPrice", "secondQuartile")}`
      title += `\n       Q1: ${ProfitDom.getProfitPrice(profit, unknown, "firstQuartile", "firstQuartile")}`
      title += `\n  Q1Q2: ${ProfitDom.getProfitPrice(profit, unknown, "firstQuartile", "secondQuartile")}`
      title += `\n       Q2: ${ProfitDom.getProfitPrice(profit, unknown, "secondQuartile", "secondQuartile")}`
    }
    if (profit.cost.auctionPrice.firstQuartile) {
      if (title) {
        title += "\n\n"
      }
      title += `Cost\nLowest: ${ProfitDom.getCostPrice(profit.cost.auctionPrice, unknown, "lowestPrice")}`
      title += `\n       Q1: ${ProfitDom.getCostPrice(profit.cost.auctionPrice, unknown, "firstQuartile")}`
      title += `\n       Q2: ${ProfitDom.getCostPrice(profit.cost.auctionPrice, unknown, "secondQuartile")}`
    }
    this.money.element.title = title
    this.unknownCost.update(ProfitDom.itemInfos(profit.cost.unknown))
    if (unknown) {
      this.unknown.style.display = ""
    } else {
      this.unknown.style.display = "none"
    }
  }
}