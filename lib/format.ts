/**
 * Shared date formatting (YYYY-MM-DD).
 */

export function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
