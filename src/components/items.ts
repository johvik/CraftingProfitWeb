import { NeverUndefined } from '../utils';
import { Item, ItemInfo } from './item';

export default class Items {
  readonly element = document.createElement('span');

  private readonly items: Item[] = [];

  update(itemInfos: ItemInfo[]) {
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
    for (let i = 0; i < this.items.length; i += 1) {
      this.items[i].update(itemInfos[i]);
    }
  }
}
