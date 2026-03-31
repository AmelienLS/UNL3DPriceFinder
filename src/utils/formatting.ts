export function fmt(n: number, decimals = 2): string {
  return n.toFixed(decimals);
}

export function euro(n: number): string {
  return `${fmt(n)} €`;
}

export function pct(n: number): string {
  return `${fmt(n * 100, 1)} %`;
}

export function closestTierQty(quantity: number, tiers: number[]): number {
  let best = tiers[0];
  for (const t of tiers) {
    if (quantity >= t) best = t;
  }
  return best;
}
