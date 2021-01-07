import { CItemInfo } from "../types";
import { NeverUndefined } from "../utils";
import Item from "./item";

export default class Items {
  readonly element = document.createElement("span");

  private readonly items: Item[] = [];

  update(itemInfos: CItemInfo[]) {
    // Reuse old elemets and add new ones if needed
    while (this.items.length > itemInfos.length) {
      const item = NeverUndefined(this.items.pop());
      this.element.removeChild(item.element);
    }
    while (this.items.length < itemInfos.length) {
      const item = new Item();
      this.items.push(item);
      this.element.appendChild(item.element);
    }

    // Update
    this.items.forEach((item, i) => item.update(itemInfos[i]));
  }
}
