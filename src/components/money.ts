export function formatMoney(copper: number) {
  if (isNaN(copper)) {
    return "?g ?s ?c"
  }
  const sign = copper < 0 ? "-" : ""
  if (copper < 0) {
    copper = -copper
  }
  const gold = Math.floor(copper / 10000)
  copper -= gold * 10000
  const silver = Math.floor(copper / 100)
  copper -= silver * 100
  return `${sign}${gold}g ${silver}s ${copper}c`
}

export class Money {
  readonly element = document.createElement("span")

  update(copper: number) {
    this.element.textContent = formatMoney(copper)
  }
}