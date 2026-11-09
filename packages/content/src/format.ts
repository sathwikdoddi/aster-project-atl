export function formatDate(value: string | null): string {
  if (!value) return "Date not yet documented";
  if (value.length === 4) return value;
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    ...(day ? { day: "numeric" } : {}),
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day || 1)));
}

export function formatLocation(location: {
  city: string | null;
  state: string | null;
  label?: string | null;
}): string {
  return (
    location.label ||
    [location.city, location.state].filter(Boolean).join(", ") ||
    "Location not yet documented"
  );
}

export function sortByDate<T>(
  records: T[],
  getDate: (record: T) => string | null,
  direction: "asc" | "desc" = "asc",
): T[] {
  return [...records].sort((a, b) => {
    const left = getDate(a);
    const right = getDate(b);
    if (!left) return right ? 1 : 0;
    if (!right) return -1;
    return direction === "asc"
      ? left.localeCompare(right)
      : right.localeCompare(left);
  });
}
