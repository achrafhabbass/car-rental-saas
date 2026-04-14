import { csvEscape } from './csv';

describe('csvEscape', () => {
  it('returns empty string for null/undefined/empty', () => {
    expect(csvEscape(null)).toBe('');
    expect(csvEscape(undefined)).toBe('');
    expect(csvEscape('')).toBe('');
  });

  it('passes through plain text unchanged', () => {
    expect(csvEscape('Hello world')).toBe('Hello world');
    expect(csvEscape('ACME')).toBe('ACME');
  });

  it('wraps commas in quotes', () => {
    expect(csvEscape('Acme, Inc.')).toBe('"Acme, Inc."');
  });

  it('wraps newlines in quotes', () => {
    expect(csvEscape('line one\nline two')).toBe('"line one\nline two"');
  });

  it('doubles embedded quotes', () => {
    expect(csvEscape('He said "hi"')).toBe('"He said ""hi"""');
  });
});
