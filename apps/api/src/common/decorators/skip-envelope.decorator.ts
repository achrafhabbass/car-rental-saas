import { SetMetadata } from '@nestjs/common';

export const SKIP_ENVELOPE_KEY = 'skipEnvelope';

/// Marks a route as returning its response body as-is (e.g. CSV, binary).
/// The global TransformInterceptor will not wrap the response in the standard
/// success envelope for these routes.
export const SkipEnvelope = (): MethodDecorator & ClassDecorator =>
  SetMetadata(SKIP_ENVELOPE_KEY, true);
