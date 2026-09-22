export function parseWeekdays(value) {
  if (Array.isArray(value)) {
    return value.map(Number).filter((n) => n >= 0 && n <= 6);
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parseWeekdays(parsed);
    } catch (_) { /* ignore */ }
  }
  return [0, 1, 2, 3, 4, 5, 6];
}

export function allowedPassengerCounts(product) {
  return (product?.prices || [])
    .map((p) => Number(p.passengers))
    .filter((n) => Number.isFinite(n) && n > 0)
    .sort((a, b) => a - b);
}

export function defaultPassengerCount(product) {
  const counts = allowedPassengerCounts(product);
  return counts[0] || 2;
}
