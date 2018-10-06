import { NeverNull } from "../utils"

export class Settings {
  private readonly settings = NeverNull(document.getElementById("settings"))
  private readonly themeKey = "theme"
  private readonly link = document.getElementById("main-style") as HTMLLinkElement
  private readonly defaultTheme = this.link.href

  constructor() {
    const openSettings = NeverNull(document.getElementById("open-settings"))
    openSettings.onclick = () => {
      this.settings.classList.add("is-active")
    }

    const modalCloses = [
      document.querySelector("#settings .modal-background") as HTMLElement,
      document.querySelector("#settings .modal-close") as HTMLElement]
    for (const i of modalCloses) {
      i.onclick = () => {
        this.close()
      }
    }

    document.onkeydown = (event) => {
      if (event.keyCode === 27) { // Escape
        this.close()
      }
    }

    const theme = document.getElementById("theme") as HTMLInputElement
    const storedTheme = localStorage.getItem(this.themeKey) || this.defaultTheme
    theme.value = storedTheme
    this.applyTheme(storedTheme)

    theme.onchange = () => {
      theme.blur()
      this.applyTheme(theme.value)
    }
  }

  private applyTheme(themeUrl: string) {
    const href = themeUrl || this.defaultTheme
    this.link.href = href
    localStorage.setItem(this.themeKey, href)
  }

  private close() {
    this.settings.classList.remove("is-active")
  }
}