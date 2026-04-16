import { Module } from '@nestjs/common';

import { VehicleCreditsController } from './vehicle-credits.controller';
import { VehicleCreditsRepository } from './vehicle-credits.repository';
import { VehicleCreditsService } from './vehicle-credits.service';

@Module({
  controllers: [VehicleCreditsController],
  providers: [VehicleCreditsService, VehicleCreditsRepository],
  exports: [VehicleCreditsService],
})
export class VehicleCreditsModule {}
