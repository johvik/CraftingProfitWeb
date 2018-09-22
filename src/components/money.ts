export function formatMoney(copper: number) {
  if (isNaN(copper)) {
    return "?g ?s ?c"
  }
  const gold = Math.floor(copper / 10000)
  copper -= gold * 10000
  const silver = Math.floor(copper / 100)
  copper -= silver * 100
  return gold + "g " + silver + "s " + copper + "c"
}

customElements.define("x-money",
  class Money extends HTMLElement {
    readonly shadow: ShadowRoot

    constructor() {
      super()

      this.shadow = this.attachShadow({ mode: "closed" })
      this.update()
    }

    static get observedAttributes() {
      return ["copper"]
    }

    attributeChangedCallback() {
      this.update()
    }

    update() {
      const copper = Number(this.getAttribute("copper") || "NaN")
      this.shadow.textContent = formatMoney(copper)
    }
  }
)