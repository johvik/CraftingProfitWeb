import { Money, formatMoney } from "./money"
import { Profit, CostInfo, auctionProfit, AuctionSum } from "../index"
import { Item, Items, ItemInfo } from "./item"
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
        auctions: profit.crafts.auctions,
        vendor: item ? (item.price || 0) : 0
      }
    }
    return {
      name: useNameAndIcon ? profit.name : undefined,
      icon: useNameAndIcon ? profit.icon : undefined,
      quantity: 1,
      auctions: [],
      vendor: 0
    }
  }

  private static itemInfo(costInfo: CostInfo): ItemInfo {
    const item = costInfo.item
    return {
      name: item ? item.name : undefined,
      icon: item ? item.icon : undefined,
      quantity: costInfo.quantity,
      auctions: costInfo.auctions,
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

  private static getCostPrice(auctionSum: AuctionSum, unknown: boolean, priceType: PriceType) {
    let price = `${formatMoney(auctionSum[priceType])}`
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
    if (!profit.crafts || profit.crafts.auctions.length === 0) {
      this.profitItem.element.style.display = ""
    } else {
      this.profitItem.element.style.display = "none"
    }
    this.money.update(auctionProfit(profit, craftsPriceType, costPriceType))
    let title = ""
    if ((profit.crafts && profit.crafts.auctions.length > 0) || profit.cost.auctionSum[costPriceType]) {
      this.money.element.style.display = ""
    } else {
      this.money.element.style.display = "none"
    }
    const unknown = profit.cost.unknown.length > 0
    if (profit.crafts && profit.crafts.auctions.length > 0) {
      // TODO Fix this with ditto
      const lowestlowest = ProfitDom.getProfitPrice(profit, unknown, "lowest", "lowest")
      title += `Profit\nLowest-Lowest:\t${lowestlowest}`

      const lowestfarOut = ProfitDom.getProfitPrice(profit, unknown, "lowest", "farOut")
      title += `\nLowest-Far out:\t${lowestfarOut !== lowestlowest ? lowestfarOut : "〃"}`

      const lowestfirstQuartile = ProfitDom.getProfitPrice(profit, unknown, "lowest", "firstQuartile")
      title += `\nLowest-First:    \t${lowestfirstQuartile !== lowestfarOut ? lowestfirstQuartile : "〃"}`

      const farOutlowest = ProfitDom.getProfitPrice(profit, unknown, "farOut", "lowest")
      title += `\nFar out-Lowest:\t${farOutlowest !== lowestfirstQuartile ? farOutlowest : "〃"}`

      const farOutfarOut = ProfitDom.getProfitPrice(profit, unknown, "farOut", "farOut")
      title += `\nFar out-Far out:\t${farOutfarOut !== farOutlowest ? farOutfarOut : "〃"}`

      const farOutfirstQuartile = ProfitDom.getProfitPrice(profit, unknown, "farOut", "firstQuartile")
      title += `\nFar out-First:    \t${farOutfirstQuartile !== farOutfarOut ? farOutfirstQuartile : "〃"}`
    }
    if (profit.cost.auctionSum.firstQuartile) {
      if (title) {
        title += "\n\n"
      }
      const lowest = ProfitDom.getCostPrice(profit.cost.auctionSum, unknown, "lowest")
      title += `Cost\nLowest:\t${lowest}`

      const farOut = ProfitDom.getCostPrice(profit.cost.auctionSum, unknown, "farOut")
      title += `\nFar out:\t${farOut !== lowest ? farOut : "〃"}`

      const outlier = ProfitDom.getCostPrice(profit.cost.auctionSum, unknown, "outlier")
      title += `\nOutlier:\t${outlier !== farOut ? outlier : "〃"}`

      const mean = ProfitDom.getCostPrice(profit.cost.auctionSum, unknown, "mean")
      title += `\nMean:\t${mean !== outlier ? mean : "〃"}`

      const firstQuartile = ProfitDom.getCostPrice(profit.cost.auctionSum, unknown, "firstQuartile")
      title += `\nFirst: \t${firstQuartile !== mean ? firstQuartile : "〃"}`

      const secondQuartile = ProfitDom.getCostPrice(profit.cost.auctionSum, unknown, "secondQuartile")
      title += `\nSecond:\t${secondQuartile !== firstQuartile ? secondQuartile : "〃"}`

      const thirdQuartile = ProfitDom.getCostPrice(profit.cost.auctionSum, unknown, "thirdQuartile")
      title += `\nThird:\t${thirdQuartile !== secondQuartile ? thirdQuartile : "〃"}`
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