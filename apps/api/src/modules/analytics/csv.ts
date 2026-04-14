/// Escapes a string field for CSV output. Wraps in double quotes if the
/// field contains characters that would break a naive reader (comma, quote,
/// newline), and doubles embedded quotes per RFC 4180.
export function csvEscape(value: string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '';
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
