import { NeverNull, getJson } from "../utils"
import { LastUpdate } from "../types"
import { BASE_URL, REALM_ID } from "../constants"

// TODO Refresh without reload, maybe automatic refresh?

export class Update {
  private readonly updated = NeverNull(document.getElementById("updated"))
  private readonly refresh = document.getElementById("refresh") as HTMLElement
  private lastModified: Date = new Date(0)

  constructor() {
    setInterval(() => {
      this.checkForUpdate()
    }, 60 * 1000)
  }

  private updateContent(updateAvailable: boolean) {
    const diff = new Date().getTime() - this.lastModified.getTime()
    const minutes = Math.ceil(diff / (60 * 1000))
    if (this.lastModified.getTime() === 0) {
      this.updated.textContent = "never"
    } else {
      this.updated.textContent = `${minutes} minutes ago`
    }
    if (updateAvailable) {
      this.refresh.style.display = ""
    } else {
      this.refresh.style.display = "none"
    }
  }

  private checkForUpdate() {
    const self = this;
    (async function () {
      try {
        const baseUrl = BASE_URL
        const lastUpdate = await getJson(baseUrl + "/auctions/lastUpdate") as LastUpdate
        for (const i of lastUpdate) {
          if (i.id === REALM_ID) {
            const modified = new Date(i.lastModified)
            self.updateContent(self.lastModified.getTime() < modified.getTime())
          }
        }
      } catch (error) {
        console.error("Failed to check for updates", error)
        self.updateContent(false)
      }
    })()
  }

  updateComplete(modified: Date) {
    this.lastModified = modified
    this.updateContent(false)
  }
}