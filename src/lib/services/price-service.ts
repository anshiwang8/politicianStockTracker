export async function fetchMockPrices(ticker: string, days = 1825) {
  const seed = ticker.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const base = 40 + seed;
  return Array.from({ length: days }, (_, index) => {
    const drift = index * (0.015 + (seed % 7) / 600);
    const cycle = Math.sin(index / 34) * (seed % 11);
    const shortWave = Math.sin(index / 7) * ((seed % 5) + 1);
    const close = Math.max(8, base + drift + cycle + shortWave);
    return {
      date: new Date(Date.now() - (days - 1 - index) * 86_400_000),
      close,
      volume: BigInt(Math.round(1_000_000 + (Math.sin(index / 9) + 1.4) * 350_000 + seed * 100))
    };
  });
}
