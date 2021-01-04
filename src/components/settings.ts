import { NeverNull } from '../utils';
import { PriceType } from '../types';
import { CraftingProfit } from '../index';
import History from './history';

export default class Settings {
  private readonly settings = NeverNull(document.getElementById('settings'));

  private readonly themeKey = 'theme';

  private readonly link = document.getElementById('main-style') as HTMLLinkElement;

  private readonly defaultTheme = this.link.href;

  private readonly craftsPriceType = document.getElementById('crafts-price-type') as HTMLSelectElement;

  private readonly costPriceType = document.getElementById('cost-price-type') as HTMLSelectElement;

  private readonly craftsTypeKey = 'crafts-type';

  private readonly costTypeKey = 'cost-type';

  private readonly automaticRefreshKey = 'automatic-refresh';

  constructor(craftingProfit: CraftingProfit) {
    const openSettings = NeverNull(document.getElementById('open-settings'));
    openSettings.onclick = () => {
      this.settings.classList.add('is-active');
    };

    const modalCloses = [
      document.querySelector('#settings .modal-background') as HTMLElement,
      document.querySelector('#settings .modal-close') as HTMLElement];
    for (const i of modalCloses) {
      i.onclick = () => {
        this.close();
      };
    }

    document.onkeydown = (event) => {
      if (event.keyCode === 27) { // Escape
        this.close();
      }
    };

    const theme = document.getElementById('theme') as HTMLInputElement;
    const storedTheme = localStorage.getItem(this.themeKey) || this.defaultTheme;
    theme.value = storedTheme;
    this.applyTheme(storedTheme);

    theme.onchange = () => {
      theme.blur();
      this.applyTheme(theme.value);
    };

    this.craftsPriceType.value = this.getCraftsPriceType();
    this.costPriceType.value = this.getCostPriceType();

    this.craftsPriceType.onchange = () => {
      this.onPriceTypeChange(craftingProfit);
    };
    this.costPriceType.onchange = () => {
      this.onPriceTypeChange(craftingProfit);
    };

    const automaticRefresh = document.getElementById('automatic-refresh') as HTMLInputElement;
    automaticRefresh.checked = this.getAutomaticRefresh();
    automaticRefresh.onchange = () => {
      localStorage.setItem(this.automaticRefreshKey, JSON.stringify(automaticRefresh.checked));
    };
  }

  private static getPriceType(value: string): PriceType {
    if (value === 'lowest' || value === 'farOut' || value === 'outlier' || value === 'mean'
      || value === 'firstQuartile' || value === 'secondQuartile' || value === 'thirdQuartile') {
      return value;
    }
    return 'lowest';
  }

  private onPriceTypeChange(craftingProfit: CraftingProfit) {
    const crafts = Settings.getPriceType(this.craftsPriceType.value);
    const cost = Settings.getPriceType(this.costPriceType.value);
    localStorage.setItem(this.craftsTypeKey, crafts);
    localStorage.setItem(this.costTypeKey, cost);
    craftingProfit.updateData();
  }

  getCraftsPriceType() {
    return Settings.getPriceType(localStorage.getItem(this.craftsTypeKey) || 'lowest');
  }

  getCostPriceType() {
    return Settings.getPriceType(localStorage.getItem(this.costTypeKey) || 'farOut');
  }

  getAutomaticRefresh() {
    return JSON.parse(localStorage.getItem(this.automaticRefreshKey) || 'true') === true;
  }

  private applyTheme(themeUrl: string) {
    const href = themeUrl || this.defaultTheme;
    this.link.href = href;
    localStorage.setItem(this.themeKey, href);
    History.hide();
  }

  private close() {
    this.settings.classList.remove('is-active');
  }
}
