import { DomData } from "../index"

export class Filters {
  private readonly domData: DomData[]
  private readonly filterName = document.getElementById("filter-name") as HTMLInputElement
  private readonly allCheckbox = document.querySelector("#filters input") as HTMLInputElement
  private readonly checkboxes = document.querySelectorAll("#filters input")
  private readonly emptyInfo = document.getElementById("empty-info") as HTMLElement

  constructor(domData: DomData[]) {
    this.domData = domData

    this.filterName.oninput = () => {
      this.apply()
    }

    for (const i of this.checkboxes) {
      const checkbox = i as HTMLInputElement
      checkbox.onchange = (event: Event) => {
        this.onProfessionFilterChange(event)
      }
    }
  }

  private onProfessionFilterChange(event: Event) {
    const element = event.srcElement as HTMLInputElement
    const checked = element.checked
    const profession = element.value

    if (profession === "all") {
      for (const i of this.checkboxes) {
        const checkbox = i as HTMLInputElement
        checkbox.checked = checked
      }
    } else {
      let allUnchecked = true
      for (const i of this.checkboxes) {
        const checkbox = i as HTMLInputElement
        if (checkbox.value !== "all") {
          allUnchecked = allUnchecked && !checkbox.checked
        }
      }
      this.allCheckbox.checked = !allUnchecked
    }
    this.apply()
  }

  apply() {
    const nameFilter = new RegExp(this.filterName.value, "i")
    const professionFilters = []
    for (const i of this.checkboxes) {
      const checkbox = i as HTMLInputElement
      if (checkbox.checked && checkbox.value !== "all") {
        professionFilters.push(checkbox.value)
      }
    }

    let empty = true
    for (const i of this.domData) {
      if ((i.dom.element.innerHTML || "").search(nameFilter) !== -1 && professionFilters.some(value => value === i.profit.profession)) {
        empty = false
        i.dom.element.style.display = ""
      } else {
        i.dom.element.style.display = "none"
      }
    }

    if (empty) {
      this.emptyInfo.style.display = ""
    } else {
      this.emptyInfo.style.display = "none"
    }
  }
}