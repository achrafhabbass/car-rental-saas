import { Module } from '@nestjs/common';

import { ClientsModule } from '../clients/clients.module';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { ReservationsController } from './reservations.controller';
import { ReservationsRepository } from './reservations.repository';
import { ReservationsService } from './reservations.service';

@Module({
  imports: [VehiclesModule, ClientsModule],
  controllers: [ReservationsController],
  providers: [ReservationsService, ReservationsRepository],
  exports: [ReservationsService, ReservationsRepository],
})
export class ReservationsModule {}
