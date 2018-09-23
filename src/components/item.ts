import { NeverNull } from "../utils"
import { formatMoney } from "./money"
const template = document.createElement("template")

template.innerHTML = `
<style>
.wrapper {
  position: relative;
  cursor: default;
}
.icon {
  height: 36px;
  width: 36px;
  padding: 4px;
  background-image: url("https://wow.zamimg.com/images/Icon/medium/border/default.png");
}
.quantity {
  position: absolute;
  right: 10px;
  bottom: 5px;
  color: white;
  text-shadow: 0 0 2px black;
}
</style>

<span class="wrapper">
  <img class="icon">
  </img>
  <span class="quantity"></span>
</span>
`

customElements.define("x-item",
  class Item extends HTMLElement {
    readonly quantity: HTMLSpanElement
    readonly icon: HTMLImageElement

    constructor() {
      super()

      const shadowRoot = this.attachShadow({ mode: "closed" })
      shadowRoot.appendChild(template.content.cloneNode(true))
      this.quantity = NeverNull(shadowRoot.querySelector(".quantity"))
      this.icon = NeverNull(shadowRoot.querySelector(".icon"))

      if (this.isConnected) {
        this.update()
      }
    }

    static get observedAttributes() {
      return ["name", "quantity", "icon", "vendor", "auction"]
    }

    attributeChangedCallback() {
      this.update()
    }

    update() {
      const name = this.getAttribute("name") || "?"
      const quantity = Number(this.getAttribute("quantity") || 1)
      const icon = this.getAttribute("icon") || "inv_misc_questionmark"
      const vendor = Number(this.getAttribute("vendor"))
      const auction = Number(this.getAttribute("auction"))

      this.quantity.textContent = quantity > 1 ? (quantity + "") : ""
      this.icon.src = "https://wow.zamimg.com/images/wow/icons/medium/" + icon + ".jpg"
      let title = name
      if (vendor) {
        title += `\nVendor: ${formatMoney(vendor)}`
        if (quantity > 1) {
          title += ` (${formatMoney(vendor * quantity)})`
        }
      }
      if (auction) {
        title += `\nAuction: ${formatMoney(auction)}`
        if (quantity > 1) {
          title += ` (${formatMoney(auction * quantity)})`
        }
      }
      this.title = title
    }
  }
)