import { formatMoney } from "./money"
import { NeverUndefined } from "../utils"
import { PriceType } from "../types"
import { History } from "./history"

export type AuctionPrice = {
  quantity: number,
  date: Date,
  lowestPrice: number,
  firstQuartile: number,
  secondQuartile: number
}

export type ItemInfo = {
  name?: string,
  icon?: string,
  quantity: number,
  auctionPrices: AuctionPrice[],
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

  private static getAuctionPrice(auctionPrice: AuctionPrice, quantity: number, priceType: PriceType) {
    let price = `${formatMoney(auctionPrice[priceType])}`
    if (quantity > 1) {
      price += ` (${formatMoney(auctionPrice[priceType] * quantity)})`
    }
    return price
  }

  private static getTitle(item: ItemInfo) {
    let title = item.name || "?"
    if (item.vendor) {
      title += `\nVendor: ${formatMoney(item.vendor)}`
      if (item.quantity > 1) {
        title += ` (${formatMoney(item.vendor * item.quantity)})`
      }
    }
    const prices = item.auctionPrices.length
    if (prices > 0) {
      title += `\nLowest: ${Item.getAuctionPrice(item.auctionPrices[prices - 1], item.quantity, "lowestPrice")}`
      title += `\n       Q1: ${Item.getAuctionPrice(item.auctionPrices[prices - 1], item.quantity, "firstQuartile")}`
      title += `\n       Q2: ${Item.getAuctionPrice(item.auctionPrices[prices - 1], item.quantity, "secondQuartile")}`
    }
    return title
  }

  update(item: ItemInfo) {
    this.element.title = Item.getTitle(item)
    const icon = item.icon || "inv_misc_questionmark"
    this.icon.src = `https://wow.zamimg.com/images/wow/icons/medium/${icon}.jpg`
    this.quantity.textContent = item.quantity > 1 ? item.quantity.toString() : ""
    if (item.auctionPrices.length > 0) {
      this.element.classList.add("has-pointer")
    } else {
      this.element.classList.remove("has-pointer")
    }
    this.element.onclick = () => {
      if (item.auctionPrices.length > 0) {
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