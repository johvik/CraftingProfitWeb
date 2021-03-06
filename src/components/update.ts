import { API_URL, GENERATED_CONNECTED_REALM_ID } from "../constants";
import { CraftingProfitInterface, LastUpdate } from "../types";
import { getJson, NeverNull } from "../utils";
import Settings from "./settings";

export default class Update {
  private readonly updated = NeverNull(document.getElementById("updated"));

  private readonly refresh = document.getElementById(
    "refresh"
  ) as HTMLAnchorElement;

  private readonly dataFailed = NeverNull(
    document.getElementById("data-failed")
  );

  private lastModified: Date = new Date(0);

  private readonly settings: Settings;

  constructor(craftingProfit: CraftingProfitInterface, settings: Settings) {
    this.settings = settings;
    this.refresh.onclick = () => {
      this.refresh.classList.add("is-loading");
      this.dataFailed.style.visibility = "hidden";
      craftingProfit.updateData();
    };
    this.refresh.style.visibility = "";
    this.refresh.classList.add("is-loading");

    setInterval(() => {
      this.checkForUpdate();
    }, 60 * 1000);
  }

  private updateContent(updateAvailable: boolean) {
    const diff = new Date().getTime() - this.lastModified.getTime();
    const minutes = Math.ceil(diff / (60 * 1000));
    if (this.lastModified.getTime() === 0) {
      this.updated.textContent = "never";
    } else {
      this.updated.textContent = `${minutes} minutes ago`;
    }
    if (updateAvailable) {
      this.refresh.style.visibility = "";
      if (this.settings.getAutomaticRefresh()) {
        this.refresh.click();
      }
    } else {
      this.refresh.style.visibility = "hidden";
    }
  }

  private checkForUpdate() {
    const self = this;
    (async function () {
      try {
        const apiUrl = API_URL;
        const lastUpdate = (await getJson(
          `${apiUrl}/api/auctions/lastUpdate`
        )) as LastUpdate;

        const last = lastUpdate.find(
          (i) => i.id === GENERATED_CONNECTED_REALM_ID
        );
        if (last) {
          const modified = new Date(last.lastModified);
          self.updateContent(self.lastModified.getTime() < modified.getTime());
        }

        self.dataFailed.style.visibility = "hidden";
      } catch (error) {
        console.error("Failed to check for updates", error);
        self.dataFailed.style.visibility = "";
        self.updateContent(false);
      }
    })();
  }

  success(modified: Date) {
    this.lastModified = modified;
    this.updateContent(false);
    this.dataFailed.style.visibility = "hidden";
  }

  error() {
    this.dataFailed.style.visibility = "";
  }

  done() {
    this.refresh.classList.remove("is-loading");
    this.refresh.style.visibility = "hidden";
  }
}
