export function formatMoney(copper: number) {
  if (Number.isNaN(copper)) {
    return '?g ?s ?c';
  }
  const sign = copper < 0 ? '-' : '';
  let remainingCopper = Math.abs(copper);
  const gold = Math.floor(remainingCopper / 10000);
  remainingCopper -= gold * 10000;
  const silver = Math.floor(remainingCopper / 100);
  remainingCopper -= silver * 100;
  return `${sign}${gold}g ${silver}s ${remainingCopper}c`;
}

export class Money {
  readonly element = document.createElement('span');

  update(copper: number) {
    this.element.textContent = formatMoney(copper);
  }
}
