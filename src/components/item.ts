import { NeverNull } from "../utils"
import { formatMoney } from "./money"
const template = document.createElement("template")

template.innerHTML = `
<span class="quantity"></span>
<img class="icon"></img>
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

      this.quantity.textContent = quantity + "x"
      this.icon.src = "https://wow.zamimg.com/images/wow/icons/medium/" + icon + ".jpg"
      let title = name
      if (vendor) {
        title += "\nVendor: " + formatMoney(vendor)
      }
      if (auction) {
        title += "\nAuction: " + formatMoney(auction)
      }
      this.title = title
    }
  }
)