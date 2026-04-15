import { PartialType, OmitType } from '@nestjs/mapped-types';

import { CreateInspectionDto } from './create-inspection.dto';

/// All fields except contractId/type are mutable; identity stays fixed.
export class UpdateInspectionDto extends PartialType(
  OmitType(CreateInspectionDto, ['contractId', 'type'] as const),
) {}
