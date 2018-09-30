import { NeverNull, getJson } from "../utils"
import { LastUpdate } from "../types"
import { BASE_URL, REALM_ID } from "../constants"

const updated = NeverNull(document.getElementById("updated"))
const refresh = document.getElementById("refresh") as HTMLElement

// TODO Refresh without reload, maybe automatic refresh?

let lastModified: Date = new Date(0)

function updateDiv(updateAvailable: boolean) {
  const diff = new Date().getTime() - lastModified.getTime()
  const minutes = Math.ceil(diff / (60 * 1000))
  updated.textContent = `${minutes} minutes ago`
  if (updateAvailable) {
    refresh.style.display = ""
  } else {
    refresh.style.display = "none"
  }
}

function checkForUpdate() {
  (async function () {
    try {
      const baseUrl = BASE_URL
      const lastUpdate = await getJson(baseUrl + "/auctions/lastUpdate") as LastUpdate
      for (const i of lastUpdate) {
        if (i.id === REALM_ID) {
          const modified = new Date(i.lastModified)
          updateDiv(lastModified.getTime() < modified.getTime())
        }
      }
    } catch (error) {
      console.error("Failed to check for update", error)
    }
  })()
}

export function watchForUpdates(modified: Date) {
  lastModified = modified
  updateDiv(false)

  setInterval(checkForUpdate, 60 * 1000)
}