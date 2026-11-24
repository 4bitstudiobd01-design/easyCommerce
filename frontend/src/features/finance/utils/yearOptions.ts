/** The current year followed by the `count - 1` years before it, newest first. */
export const recentYears = (count = 4): number[] => {
  const current = new Date().getFullYear();
  return Array.from({ length: count }, (_, i) => current - i);
};
