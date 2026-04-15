import { Transform, type TransformFnParams } from 'class-transformer';

/**
 * Proper string → boolean transform for query-string DTOs.
 *
 * Background: `@Type(() => Boolean)` calls `Boolean(value)`, and because
 * non-empty strings are truthy, `Boolean("false")` is `true` — which silently
 * flips the meaning of any `?flag=false` filter. This helper parses the
 * canonical strings ("true" | "false" | "1" | "0") to a real boolean and
 * passes through actual booleans untouched.
 */
export function ToBoolean(): PropertyDecorator {
  return Transform(({ value }: TransformFnParams) => {
    if (value === undefined || value === null) return undefined;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const v = value.trim().toLowerCase();
      if (v === 'true' || v === '1') return true;
      if (v === 'false' || v === '0') return false;
    }
    return value; // let class-validator reject anything else
  });
}
