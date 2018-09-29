import { formatMoney } from "./money"
import { NeverUndefined } from "../utils"

export type ItemInfo = {
  name?: string,
  icon?: string,
  quantity: number,
  auction: number,
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

  private static getTitle(item: ItemInfo) {
    let title = item.name || "?"
    if (item.vendor) {
      title += `\nVendor: ${formatMoney(item.vendor)}`
      if (item.quantity > 1) {
        title += ` (${formatMoney(item.vendor * item.quantity)})`
      }
    }
    if (item.auction) {
      title += `\nAuction: ${formatMoney(item.auction)}`
      if (item.quantity > 1) {
        title += ` (${formatMoney(item.auction * item.quantity)})`
      }
    }
    return title
  }

  update(item: ItemInfo) {
    this.element.title = Item.getTitle(item)
    const icon = item.icon || "inv_misc_questionmark"
    this.icon.src = `https://wow.zamimg.com/images/wow/icons/medium/${icon}.jpg`
    this.quantity.textContent = item.quantity > 1 ? item.quantity.toString() : ""
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