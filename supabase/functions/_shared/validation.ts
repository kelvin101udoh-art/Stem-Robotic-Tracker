export function requireString(value: unknown, field: string): string {
  if (!value || typeof value !== "string") {
    throw new Error(`Invalid or missing field: ${field}`);
  }
  return value;
}

export function requireArray(value: unknown, field: string) {
  if (!Array.isArray(value)) {
    throw new Error(`Invalid or missing array: ${field}`);
  }
  return value;
}

export function assertUuid(value: string, field: string) {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(value)) {
    throw new Error(`Invalid UUID format for ${field}`);
  }
}