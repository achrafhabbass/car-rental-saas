import { ForbiddenException } from '@nestjs/common';

export interface PlanLimitExceededPayload {
  error: 'PLAN_LIMIT_EXCEEDED';
  resource: string;
  current: number;
  limit: number;
  plan: string;
  message: string;
  upgrade: string;
}

/**
 * Thrown when a tenant tries to exceed their plan's quota.
 * The HttpExceptionFilter will serialize this into a clear JSON response.
 */
export class PlanLimitExceededException extends ForbiddenException {
  constructor(
    resource: string,
    current: number,
    limit: number,
    planName: string,
  ) {
    const payload: PlanLimitExceededPayload = {
      error: 'PLAN_LIMIT_EXCEEDED',
      resource,
      current,
      limit,
      plan: planName,
      message: `Limite du plan ${planName} atteinte : ${current}/${limit} ${resource}. Veuillez passer à un plan supérieur.`,
      upgrade: '/platform/billing',
    };
    super(payload);
  }
}
