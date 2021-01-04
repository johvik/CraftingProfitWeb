import { DomData } from '../index';
import { NeverNull } from '../utils';
import { History } from './history';

export class Filters {
  private readonly domData: DomData[];

  private readonly filterName = document.getElementById('filter-name') as HTMLInputElement;

  private readonly allCheckbox = document.querySelector('#filters a') as HTMLElement;

  private readonly checkboxes = document.querySelectorAll('#filters a');

  private readonly emptyInfo = document.getElementById('empty-info') as HTMLElement;

  private static readonly nameKey = 'name';

  private static readonly professionsKey = 'professions';

  private static readonly selectAllFilter = 'select all';

  constructor(domData: DomData[]) {
    this.domData = domData;

    const storedName = localStorage.getItem(Filters.nameKey);
    if (storedName) {
      this.filterName.value = storedName;
    }

    const storedFilters = localStorage.getItem(Filters.professionsKey);
    if (storedFilters) {
      this.updateCheckboxes(JSON.parse(storedFilters));
    }
    this.filterName.oninput = () => {
      localStorage.setItem(Filters.nameKey, this.filterName.value);
      this.apply();
    };

    for (const i of this.checkboxes) {
      const checkbox = i as HTMLElement;
      checkbox.onclick = (event: Event) => {
        const element = event.srcElement as HTMLElement;
        Filters.setChecked(!Filters.isChecked(element), element);
        this.onProfessionFilterChange(element);
      };
    }
  }

  private static setChecked(checked: boolean, element: HTMLElement) {
    if (checked) {
      element.classList.remove('unchecked');
    } else {
      element.classList.add('unchecked');
    }
  }

  private static isChecked(element: HTMLElement) {
    return !element.classList.contains('unchecked');
  }

  private static getProfessionFilter(element: HTMLElement) {
    return NeverNull(element.textContent).toLowerCase();
  }

  private updateCheckboxes(professionFilters: string[]) {
    for (const i of this.checkboxes) {
      const checkbox = i as HTMLElement;
      Filters.setChecked(false, checkbox);
    }

    let allUnchecked = true;
    for (const filter of professionFilters) {
      for (const i of this.checkboxes) {
        const checkbox = i as HTMLElement;
        if (Filters.getProfessionFilter(checkbox) === filter) {
          Filters.setChecked(true, checkbox);
          allUnchecked = false;
        }
      }
    }
    Filters.setChecked(!allUnchecked, this.allCheckbox);
  }

  private onProfessionFilterChange(element: HTMLElement) {
    const checked = Filters.isChecked(element);
    const profession = Filters.getProfessionFilter(element);

    if (profession === Filters.selectAllFilter) {
      for (const i of this.checkboxes) {
        const checkbox = i as HTMLElement;
        Filters.setChecked(checked, checkbox);
      }
    } else {
      let allUnchecked = true;
      for (const i of this.checkboxes) {
        const checkbox = i as HTMLElement;
        if (Filters.getProfessionFilter(checkbox) !== Filters.selectAllFilter) {
          allUnchecked = allUnchecked && !Filters.isChecked(checkbox);
        }
      }
      Filters.setChecked(!allUnchecked, this.allCheckbox);
    }
    localStorage.setItem(Filters.professionsKey, JSON.stringify(this.professionFilters()));
    this.apply();
  }

  private professionFilters() {
    const filters = [];
    for (const i of this.checkboxes) {
      const checkbox = i as HTMLElement;
      const filter = Filters.getProfessionFilter(checkbox);
      if (Filters.isChecked(checkbox) && filter !== Filters.selectAllFilter) {
        filters.push(filter);
      }
    }
    return filters;
  }

  apply() {
    const nameFilter = new RegExp(this.filterName.value, 'i');
    const professionFilters = this.professionFilters();

    History.hide();

    let lastElement: HTMLElement | undefined;
    for (const i of this.domData) {
      if ((i.dom.element.innerHTML || '').search(nameFilter) !== -1 && professionFilters.some((value) => value === i.profit.profession)) {
        lastElement = i.dom.element;
        i.dom.element.style.display = '';
        i.dom.element.classList.remove('last-row');
      } else {
        i.dom.element.style.display = 'none';
      }
    }

    if (lastElement) {
      this.emptyInfo.style.display = 'none';
      lastElement.classList.add('last-row');
    } else {
      this.emptyInfo.style.display = '';
    }
  }
}
