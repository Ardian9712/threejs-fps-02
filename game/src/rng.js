export function mulberry32(seed) {
  let value = seed >>> 0;
  return function nextValue() {
    value = (value + 0x6D2B79F5) | 0;
    let mixed = Math.imul(value ^ (value >>> 15), 1 | value);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

export function createRng(seed) {
  const random = mulberry32(seed);
  return {
    next: random,
    int(min, max) {
      return Math.floor(random() * (max - min + 1)) + min;
    },
    range(min, max) {
      return min + random() * (max - min);
    },
    pick(items) {
      return items[Math.floor(random() * items.length)];
    },
  };
}
