import { DomData } from "../index"

export class Filters {
  private readonly domData: DomData[]
  private readonly filterName = document.getElementById("filter-name") as HTMLInputElement
  private readonly allCheckbox = document.querySelector("#filters input") as HTMLInputElement
  private readonly checkboxes = document.querySelectorAll("#filters input")
  private readonly emptyInfo = document.getElementById("empty-info") as HTMLElement
  private static readonly nameKey = "name"
  private static readonly professionsKey = "professions"

  constructor(domData: DomData[]) {
    this.domData = domData

    const storedName = localStorage.getItem(Filters.nameKey)
    if (storedName) {
      this.filterName.value = storedName
    }

    const storedFilters = localStorage.getItem(Filters.professionsKey)
    if (storedFilters) {
      this.updateCheckboxes(JSON.parse(storedFilters))
    }
    this.filterName.oninput = () => {
      localStorage.setItem(Filters.nameKey, this.filterName.value)
      this.apply()
    }

    for (const i of this.checkboxes) {
      const checkbox = i as HTMLInputElement
      checkbox.onchange = (event: Event) => {
        this.onProfessionFilterChange(event)
      }
    }
  }

  private updateCheckboxes(professionFilters: string[]) {
    for (const i of this.checkboxes) {
      const checkbox = i as HTMLInputElement
      checkbox.checked = false
    }

    let allUnchecked = true
    for (const filter of professionFilters) {
      for (const i of this.checkboxes) {
        const checkbox = i as HTMLInputElement
        if (checkbox.value === filter) {
          checkbox.checked = true
          allUnchecked = false
        }
      }
    }
    this.allCheckbox.checked = !allUnchecked
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
    localStorage.setItem(Filters.professionsKey, JSON.stringify(this.professionFilters()))
    this.apply()
  }

  private professionFilters() {
    const filters = []
    for (const i of this.checkboxes) {
      const checkbox = i as HTMLInputElement
      if (checkbox.checked && checkbox.value !== "all") {
        filters.push(checkbox.value)
      }
    }
    return filters
  }

  apply() {
    const nameFilter = new RegExp(this.filterName.value, "i")
    const professionFilters = this.professionFilters()

    let lastElement: HTMLElement | undefined = undefined
    for (const i of this.domData) {
      if ((i.dom.element.innerHTML || "").search(nameFilter) !== -1 && professionFilters.some(value => value === i.profit.profession)) {
        lastElement = i.dom.element
        i.dom.element.style.display = ""
        i.dom.element.classList.remove("last-row")
      } else {
        i.dom.element.style.display = "none"
      }
    }

    if (lastElement) {
      this.emptyInfo.style.display = "none"
      lastElement.classList.add("last-row")
    } else {
      this.emptyInfo.style.display = ""
    }
  }
}