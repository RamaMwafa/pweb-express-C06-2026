export function getQueryString(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0];
  }

  return undefined;
}

export function parsePositiveInteger(
  value: unknown,
  fallback: number,
  max?: number,
): number {
  const raw = getQueryString(value);

  if (raw === undefined || raw.trim() === "") {
    return fallback;
  }

  const parsed = Number(raw);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return max === undefined ? parsed : Math.min(parsed, max);
}

