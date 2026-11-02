const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/;

export const flattenKeys = (value: unknown, prefix = ""): string[] => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return [prefix];
  }
  return Object.entries(value).flatMap(([key, child]) =>
    flattenKeys(child, prefix === "" ? key : `${prefix}.${key}`),
  );
};

const normalizeKeys = (value: unknown): Set<string> =>
  new Set(flattenKeys(value).map((key) => key.replace(PLURAL_SUFFIX, "")));

export const compareKeys = (reference: unknown, candidate: unknown) => {
  const expected = normalizeKeys(reference);
  const actual = normalizeKeys(candidate);
  return {
    missing: [...expected].filter((key) => !actual.has(key)).toSorted(),
    extra: [...actual].filter((key) => !expected.has(key)).toSorted(),
  };
};
