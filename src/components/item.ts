import { formatMoney } from "./money"
import { NeverUndefined } from "../utils"
import { PriceType, AuctionItem } from "../types"
import { History } from "./history"

export type ItemInfo = {
  name?: string,
  icon?: string,
  quantity: number,
  auctions: AuctionItem[],
  vendor: number
}

export class Item {
  readonly element = document.createElement("span")
  private readonly icon = document.createElement("img")
  private readonly quantity = document.createElement("span")

  constructor() {
    this.element.classList.add("item-wrapper")
    this.element.appendChild(this.icon)
    this.element.appendChild(this.quantity)
  }

  private static getAuctionPrice(auction: AuctionItem, quantity: number, priceType: PriceType) {
    let price = `${formatMoney(auction[priceType])}`
    if (quantity > 1) {
      price += ` (${formatMoney(auction[priceType] * quantity)})`
    }
    return price
  }

  private static getTitle(item: ItemInfo) {
    let title = item.name || "?"
    if (item.vendor) {
      title += `\nVendor:\t${formatMoney(item.vendor)}`
      if (item.quantity > 1) {
        title += ` (${formatMoney(item.vendor * item.quantity)})`
      }
    }
    const auctions = item.auctions.length
    if (auctions > 0) {
      title += `\nLowest:\t${Item.getAuctionPrice(item.auctions[auctions - 1], item.quantity, "lowest")}`
      title += `\nFar out:\t${Item.getAuctionPrice(item.auctions[auctions - 1], item.quantity, "farOut")}`
      title += `\nOutlier:\t${Item.getAuctionPrice(item.auctions[auctions - 1], item.quantity, "outlier")}`
      title += `\nMean:\t${Item.getAuctionPrice(item.auctions[auctions - 1], item.quantity, "mean")}`
      title += `\nFirst: \t${Item.getAuctionPrice(item.auctions[auctions - 1], item.quantity, "firstQuartile")}`
      title += `\nSecond:\t${Item.getAuctionPrice(item.auctions[auctions - 1], item.quantity, "secondQuartile")}`
      title += `\nThird:\t${Item.getAuctionPrice(item.auctions[auctions - 1], item.quantity, "thirdQuartile")}`
    }
    return title
  }

  update(item: ItemInfo) {
    this.element.title = Item.getTitle(item)
    const icon = item.icon || "inv_misc_questionmark"
    this.icon.src = `https://wow.zamimg.com/images/wow/icons/medium/${icon}.jpg`
    this.quantity.textContent = item.quantity > 1 ? item.quantity.toString() : ""
    if (item.auctions.length > 0) {
      this.element.classList.add("has-pointer")
    } else {
      this.element.classList.remove("has-pointer")
    }
    this.element.onclick = () => {
      if (item.auctions.length > 0) {
        History.show(item, this.element)
      } else {
        History.hide()
      }
    }
  }
}

export class Items {
  readonly element = document.createElement("span")
  private readonly items: Item[] = []

  update(itemInfos: ItemInfo[]) {
    // Reuse old elemets and add new ones if needed
    while (this.items.length > itemInfos.length) {
      const item = NeverUndefined(this.items.pop())
      this.element.removeChild(item.element)
    }
    while (this.items.length < itemInfos.length) {
      const item = new Item()
      this.items.push(item)
      this.element.appendChild(item.element)
    }

    // Update
    for (let i = 0; i < this.items.length; i++) {
      this.items[i].update(itemInfos[i])
    }
  }
}